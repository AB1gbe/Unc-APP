// Turning phone notifications on/off for THIS device (Web Push).
// The server side is server/src/lib/push.js and server/src/routes/push.js.
import { api } from './api.js';
import { t } from './i18n.jsx';

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInstalled = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

// 'ok' | 'ios-install' (iPhone: add to Home Screen first) | 'insecure'
// (needs https, or localhost) | 'unsupported'
export function pushSupport() {
  if (!window.isSecureContext) return 'insecure';
  if (isIos() && !isInstalled()) return 'ios-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'ok';
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker not registered:', err));
}

async function registration() {
  return navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
}

export async function currentSubscription() {
  if (pushSupport() !== 'ok') return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

// The browser wants the key as bytes; the server gives base64url text.
function keyBytes(base64url) {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Asks the phone for permission (must run from a tap), subscribes, and
// tells the server. Returns 'on' or 'denied'.
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';
  const reg = await registration();
  const { publicKey } = await api('/push/key');
  let sub = await reg.pushManager.getSubscription();
  // A subscription made with an old server key can't be used: start over.
  if (sub && sub.options?.applicationServerKey) {
    const old = new Uint8Array(sub.options.applicationServerKey);
    const now = keyBytes(publicKey);
    if (old.length !== now.length || old.some((b, i) => b !== now[i])) { await sub.unsubscribe(); sub = null; }
  }
  if (!sub) {
    // The browser talks to its push service (Google, Apple or Mozilla) here.
    // Give up after 20 s instead of leaving the button stuck, and explain
    // in the member's language (the browser's own errors are English-only).
    let timer;
    try {
      sub = await Promise.race([
        reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 20000); }),
      ]);
    } catch (err) {
      console.warn('Push subscribe failed:', err);
      throw new Error(t("Couldn't turn on notifications in this browser. Private/incognito windows can't get them; otherwise check your connection and try again."));
    } finally {
      clearTimeout(timer);
    }
  }
  await api('/push/subscribe', { method: 'POST', body: sub.toJSON() });
  return 'on';
}

// Used by the "Turn off" button and on log out, so the next person using
// this phone doesn't get your notifications.
export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe();
}

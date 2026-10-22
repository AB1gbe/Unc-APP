// Push notifications to phones and computers (Web Push: the browser's own
// push service, no app store). See docs/Features/Push Notifications.md
import fs from 'node:fs';
import path from 'node:path';
import webpush from 'web-push';
import { config } from '../config.js';

// VAPID keys prove to the push services that messages come from this
// server. From VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY if set; otherwise made
// once and kept in DATA_DIR/vapid.json (next to the database), so it works
// with no setup. Changing them cuts off every phone that already said yes.
let keys;
export function vapidKeys() {
  if (keys) return keys;
  if (config.push.publicKey && config.push.privateKey) {
    keys = { publicKey: config.push.publicKey, privateKey: config.push.privateKey };
    return keys;
  }
  const file = path.join(config.dataDir, 'vapid.json');
  try {
    keys = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    keys = webpush.generateVAPIDKeys();
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(keys), { mode: 0o600 });
  }
  return keys;
}

// Tests swap this out so nothing goes over the network.
let sender = (subscription, payload) => webpush.sendNotification(subscription, payload, {
  TTL: 24 * 60 * 60, // a phone that is off for a day still gets it
  vapidDetails: { subject: config.push.subject, ...vapidKeys() },
});
export function setPushSender(fn) { sender = fn; }

// What the phone shows, in the member's language.
const TEXT = {
  offer: {
    en: { title: 'New offer', body: (v) => `${v.actor} made an offer on “${v.title}”` },
    ar: { title: 'عرض جديد', body: (v) => `قدّم ${v.actor} عرضاً على «${v.title}»` },
  },
  'favourite-request': {
    en: { title: 'A customer is looking for something', body: (v) => `${v.actor}, who favourited you, is looking for “${v.title}”` },
    ar: { title: 'أحد عملائك يبحث عن شيء', body: (v) => `${v.actor} الذي أضافك للمفضلة يبحث عن «${v.title}»` },
  },
  'alert-match': {
    en: { title: 'New request for you', body: (v) => `“${v.title}” in ${v.city}` },
    ar: { title: 'طلب جديد يناسبك', body: (v) => `«${v.title}» في ${v.city}` },
  },
  expiring: {
    en: { title: 'Still looking?', body: (v) => `“${v.title}” closes in 3 days. Tap to keep it open.` },
    ar: { title: 'ما زلت تبحث؟', body: (v) => `«${v.title}» يُغلق خلال 3 أيام. اضغط لإبقائه مفتوحاً.` },
  },
  test: {
    en: { title: 'Unc', body: () => 'Notifications are on. You will get one for every new offer.' },
    ar: { title: 'Unc', body: () => 'الإشعارات مفعّلة. سيصلك إشعار مع كل عرض جديد.' },
  },
};

// Sends to every device the member turned notifications on for. Never
// throws: a failed push must not fail the request that caused it. Devices
// that unsubscribed or were reset (404/410 from the push service) are removed.
export async function pushTo(db, userId, kind, vars = {}, url = '/') {
  const user = db.prepare('SELECT language, banned_at FROM users WHERE id = ?').get(userId);
  if (!user || user.banned_at) return 0;
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  if (!subs.length) return 0;
  const lang = user.language === 'ar' ? 'ar' : 'en';
  const text = TEXT[kind][lang];
  const payload = JSON.stringify({
    title: text.title, body: text.body(vars), url, lang, dir: lang === 'ar' ? 'rtl' : 'ltr',
    tag: `${kind}:${url}`, // a second push about the same thing replaces the first
  });
  const results = await Promise.allSettled(subs.map((s) => sender({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)));
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') return;
    if ([404, 410].includes(r.reason?.statusCode)) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(subs[i].id);
    else console.warn(`[push] could not reach a device of user ${userId}: ${r.reason?.statusCode ?? ''} ${r.reason?.message ?? r.reason}`);
  });
  return results.filter((r) => r.status === 'fulfilled').length;
}

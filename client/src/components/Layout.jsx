import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Loading } from './ui.jsx';
import Logo from './Logo.jsx';
import TabBar from './TabBar.jsx';
import SideNav from './SideNav.jsx';
import { usePolling } from '../hooks.js';
import { LANGUAGES, hasSavedChoice, t, tj, useLanguage } from '../i18n.jsx';
import Celebrations from './Celebrate.jsx';
import Icon from './Icon.jsx';
import DeletePending from './DeletePending.jsx';
import TermsAccept from './TermsAccept.jsx';


export default function Layout() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [bell, setBell] = useState(0); // unread notifications
  const { pathname } = useLocation();
  const { lang, setLang } = useLanguage();
  const other = lang === 'ar' ? 'en' : 'ar';

  // Keep the member's saved language and this device in step:
  // - language picked on this device -> tell the server (emails use it);
  // - nothing picked here yet (e.g. a new laptop) -> use the member's language.
  useEffect(() => {
    if (!user?.language || user.language === lang) return;
    if (hasSavedChoice()) api('/auth/language', { method: 'PUT', body: { language: lang } }).catch(() => {});
    else setLang(user.language);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- only when a member logs in

  // Unread counts for the Messages tab and the 🔔: polled every 15 s while
  // the tab is visible, re-checked on every page change, and right after a
  // page marks something read (the 'unc:read' event).
  const loggedIn = Boolean(user);
  const refreshUnread = useCallback(() => {
    api('/conversations/unread-count').then((d) => setUnread(d.unread)).catch(() => {});
    api('/notifications/unread-count').then((d) => setBell(d.unread)).catch(() => {});
  }, []);
  usePolling(refreshUnread, 15000, loggedIn);
  useEffect(() => {
    if (loggedIn) refreshUnread();
  }, [loggedIn, pathname, refreshUnread]);
  useEffect(() => {
    window.addEventListener('unc:read', refreshUnread);
    return () => window.removeEventListener('unc:read', refreshUnread);
  }, [refreshUnread]);
  useEffect(() => {
    if (!loggedIn) { setUnread(0); setBell(0); }
  }, [loggedIn]);

  return (
    <>
      <SideNav unread={unread} bell={bell} />
      {/* Phones and small tablets: a slim app header; the tabs are at the bottom. */}
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo" aria-label="Unc"><Logo size={26} /></Link>
          <nav className="nav">
            {user && <NavLink to="/me" className="top-bell" aria-label={t('My Unc')} title={t('My Unc')}><Icon name="user" size="1.5em" /></NavLink>}
            {user ? (
              <NavLink to="/notifications" className="top-bell" aria-label={bell > 0 ? t('Notifications ({n} new)', { n: bell }) : t('Notifications')} title={t('Notifications')}>
                <Icon name="bell" size="1.5em" />
                {bell > 0 && <span className="unread-dot">{bell > 99 ? '99+' : bell}</span>}
              </NavLink>
            ) : (
              <>
                <NavLink to="/login">{t('Log in')}</NavLink>
                <Link className="btn sm" to="/register">{t('Sign up')}</Link>
              </>
            )}
            {/* Shows the OTHER language's name, written in that language. */}
            <button className="btn sm secondary lang-switch" onClick={() => setLang(other)} lang={other} title={t('Change language')}>
              {LANGUAGES[other]}
            </button>
          </nav>
        </div>
      </header>
      {user && !user.emailVerified && (
        <div className="container" style={{ paddingBottom: 0 }}>
          <div className="alert warn" style={{ margin: 0 }}>{tj('Confirm your email to get started. {link}', { link: <Link to="/verify-email">{t('Enter code')}</Link> })}</div>
        </div>
      )}
      {user && !user.termsAccepted && pathname !== '/terms' && (
        <div className="container" style={{ paddingBottom: 0 }}><TermsAccept banner /></div>
      )}
      {user?.deleteAt && (
        <div className="container" style={{ paddingBottom: 0 }}><DeletePending banner /></div>
      )}
      <main className="container with-tabbar">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar unread={unread} loggedIn={loggedIn} />
      <Celebrations />
    </>
  );
}

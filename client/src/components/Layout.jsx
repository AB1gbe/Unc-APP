import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Loading } from './ui.jsx';
import TabBar from './TabBar.jsx';
import { usePolling } from '../hooks.js';
import { LANGUAGES, hasSavedChoice, t, tj, useLanguage } from '../i18n.jsx';

// On phones these header links are hidden: the bottom tab bar has them.
const tabbed = ({ isActive }) => `hide-phone${isActive ? ' active' : ''}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
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

  // Unread count for the Messages tab: polled every 15 s while the tab is
  // visible, re-checked on every page change, and right after a
  // conversation marks messages read (the 'unc:read' event).
  const loggedIn = Boolean(user);
  const refreshUnread = useCallback(() => {
    api('/conversations/unread-count').then((d) => setUnread(d.unread)).catch(() => {});
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
    if (!loggedIn) setUnread(0);
  }, [loggedIn]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">un<span>c</span></Link>
          <nav className="nav">
            {user && <NavLink to="/" end className={tabbed}>{t('Home')}</NavLink>}
            <NavLink to={user ? '/browse' : '/'} end className={tabbed}>{t('Browse')}</NavLink>
            {user && <NavLink to="/my-requests" className={tabbed}>{t('My requests')}</NavLink>}
            {user && (
              <NavLink to="/messages" className={tabbed}>
                {t('Messages')} {unread > 0 && <span className="unread-dot">{unread}</span>}
              </NavLink>
            )}
            {user?.role === 'admin' && <NavLink to="/admin">{t('Admin')}</NavLink>}
            {user ? (
              <>
                <NavLink to="/account" className={tabbed}>{t('Account')}</NavLink>
                <button className="btn sm secondary hide-phone" onClick={async () => { await logout(); navigate('/'); }}>{t('Log out')}</button>
              </>
            ) : (
              <>
                <NavLink to="/login">{t('Log in')}</NavLink>
                <Link className="btn sm" to="/register">{t('Sign up')}</Link>
              </>
            )}
            {user && <Link className="btn sm hide-phone" to="/requests/new">{t('+ Post a request')}</Link>}
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
      <main className={`container ${user ? 'with-tabbar' : ''}`}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      {user && <TabBar unread={unread} />}
    </>
  );
}

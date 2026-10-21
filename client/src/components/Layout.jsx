import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Loading } from './ui.jsx';
import { usePolling } from '../hooks.js';
import { LANGUAGES, t, tj, useLanguage } from '../i18n.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();
  const { lang, setLang } = useLanguage();
  const other = lang === 'ar' ? 'en' : 'ar';

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
            <NavLink to="/" end>{t('Browse')}</NavLink>
            {user && <NavLink to="/my-requests">{t('My requests')}</NavLink>}
            {user && (
              <NavLink to="/messages">
                {t('Messages')} {unread > 0 && <span className="unread-dot">{unread}</span>}
              </NavLink>
            )}
            {user?.role === 'admin' && <NavLink to="/admin">{t('Admin')}</NavLink>}
            {user ? (
              <>
                <NavLink to="/account">{t('Account')}</NavLink>
                <button className="btn sm secondary" onClick={async () => { await logout(); navigate('/'); }}>{t('Log out')}</button>
              </>
            ) : (
              <>
                <NavLink to="/login">{t('Log in')}</NavLink>
                <Link className="btn sm" to="/register">{t('Sign up')}</Link>
              </>
            )}
            {user && <Link className="btn sm" to="/requests/new">{t('+ Post a request')}</Link>}
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
      <main className="container">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}

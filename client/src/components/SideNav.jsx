// The app-style side bar (session 72): on computers and big tablets the
// main places sit in a column on the left (right in Arabic), like the
// Instagram or X apps, instead of a website's top bar. Phones keep the
// slim header and the bottom tab bar.
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { LANGUAGES, t, useLanguage } from '../i18n.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { Avatar } from './ui.jsx';

// Collapsed or open is remembered on this device (session 72).
const KEY = 'unc.sidebar';
const readCollapsed = () => { try { return localStorage.getItem(KEY) === 'closed'; } catch { return false; } };

const Item = ({ to, icon, label, count, end, className = '' }) => (
  <NavLink to={to} end={end} className={className} title={label}>
    <span className="side-icon"><Icon name={icon} size="1.45em" />{count > 0 && <span className="unread-dot">{count > 99 ? '99+' : count}</span>}</span>
    <span className="side-label">{label}</span>
  </NavLink>
);

export default function SideNav({ unread, bell }) {
  const { user } = useAuth();
  const { lang, setLang } = useLanguage();
  const other = lang === 'ar' ? 'en' : 'ar';
  const [collapsed, setCollapsed] = useState(readCollapsed);
  useEffect(() => {
    document.documentElement.classList.toggle('side-collapsed', collapsed);
    try { localStorage.setItem(KEY, collapsed ? 'closed' : 'open'); } catch { /* private mode: not remembered */ }
  }, [collapsed]);
  return (
    <aside className="sidenav">
      <div className="side-top">
        <Link to="/" className="logo side-logo" aria-label="Unc"><Logo size={30} /></Link>
        <button type="button" className="side-toggle" onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed} aria-label={collapsed ? t('Open the menu') : t('Close the menu')} title={collapsed ? t('Open the menu') : t('Close the menu')}>
          <Icon name="sidebar" size="1.35em" />
        </button>
      </div>
      <nav className="nav side-links" aria-label={t('Main')}>
        <Item to="/" end icon="home" label={t('Home')} />
        <Item to="/for-sale" icon="tag" label={t('For sale')} />
        <Item to="/housing" icon="building" label={t('Housing')} />
        <Item to="/jobs" icon="briefcase" label={t('Jobs')} />
        <Item to="/browse" icon="search" label={t('Wanted')} />
        <Item to="/shops" icon="shop" label={t('Shops')} />
        {user && <Item to="/me" icon="user" label={t('My Unc')} />}
        {user && <Item to="/messages" icon="chat" label={t('Messages')} count={unread} />}
        {user && <Item to="/notifications" icon="bell" label={t('Notifications')} count={bell} className="bell" />}
        {user && <Item to="/my-requests" icon="list" label={t('My ads and requests')} />}
        {user?.role === 'admin' && <Item to="/admin" icon="admin" label={t('Admin')} />}
      </nav>
      {user
        ? <Link className="btn side-post" to="/requests/new?section=forsale" title={t('Post an ad')}><Icon name="plus" weight="bold" /> <span className="side-label">{t('Post an ad')}</span></Link>
        : <Link className="btn side-post" to="/register" title={t('Sign up')}><Icon name="user" weight="bold" /> <span className="side-label">{t('Sign up')}</span></Link>}
      <div className="side-bottom">
        <button className="side-lang" onClick={() => setLang(other)} lang={other} title={t('Change language')}>
          <Icon name="language" size="1.3em" /> <span className="side-label">{LANGUAGES[other]}</span>
        </button>
        {user ? (
          <NavLink to="/account" className="side-me" title={t('Account')}>
            <Avatar name={user.displayName} src={user.avatarUrl} size={34} />
            <span><bdi>{user.displayName}</bdi><small>{t('Account')}</small></span>
          </NavLink>
        ) : (
          <NavLink to="/login" className="side-me" title={t('Log in')}><Icon name="user" size="1.6em" /> <span>{t('Log in')}</span></NavLink>
        )}
      </div>
    </aside>
  );
}

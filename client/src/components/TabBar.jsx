// Bottom tab bar for phones (shown by CSS under 900 px wide, logged-in
// members only: phones and tablets) - like a native app: the main places one thumb-tap away.
import { NavLink } from 'react-router-dom';
import { t } from '../i18n.jsx';

// Simple line icons (inline SVG: no icon library to download).
const ICONS = {
  browse: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  mine: 'M5 4h14M5 9h14M5 14h9M5 19h6',
  post: 'M12 5v14M5 12h14',
  messages: 'M4 5h16v11H8l-4 4z',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

export default function TabBar({ unread }) {
  return (
    <nav className="tabbar" aria-label={t('Main')}>
      <NavLink to="/" end><Icon name="browse" /><span>{t('Browse')}</span></NavLink>
      <NavLink to="/my-requests"><Icon name="mine" /><span>{t('My requests')}</span></NavLink>
      <NavLink to="/requests/new" className="tab-post" aria-label={t('Post a request')}><Icon name="post" /><span>{t('Post')}</span></NavLink>
      <NavLink to="/messages">
        <span className="tab-icon"><Icon name="messages" />{unread > 0 && <span className="unread-dot">{unread > 99 ? '99+' : unread}</span>}</span>
        <span>{t('Messages')}</span>
      </NavLink>
      <NavLink to="/account"><Icon name="account" /><span>{t('Account')}</span></NavLink>
    </nav>
  );
}

// Bottom tab bar for phones (shown by CSS under 900 px wide) - like a
// native app: the main places one thumb-tap away. Since session 82 the
// Craigslist-style sections: Home, Housing, Jobs and Wanted for visitors;
// Home, Housing, Post, Jobs and Messages for members (My Unc and the
// account are in the slim header).
import { NavLink } from 'react-router-dom';
import { t } from '../i18n.jsx';

// Simple line icons (inline SVG: no icon library to download).
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  browse: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3',
  post: 'M12 5v14M5 12h14',
  messages: 'M4 5h16v11H8l-4 4z',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  shops: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  categories: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  housing: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  forsale: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  jobs: 'M4 8h16v12H4zM9 8V5h6v3M4 13h16',
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

export default function TabBar({ unread, loggedIn }) {
  if (!loggedIn) {
    // Visitors (session 72): the main tabs, so phones can reach every section.
    return (
      <nav className="tabbar" aria-label={t('Main')}>
        <NavLink to="/" end><Icon name="home" /><span>{t('Home')}</span></NavLink>
        <NavLink to="/for-sale"><Icon name="forsale" /><span>{t('For sale')}</span></NavLink>
        <NavLink to="/housing"><Icon name="housing" /><span>{t('Housing')}</span></NavLink>
        <NavLink to="/jobs"><Icon name="jobs" /><span>{t('Jobs')}</span></NavLink>
        <NavLink to="/browse"><Icon name="browse" /><span>{t('Wanted')}</span></NavLink>
      </nav>
    );
  }
  return (
    <nav className="tabbar" aria-label={t('Main')}>
      <NavLink to="/" end><Icon name="home" /><span>{t('Home')}</span></NavLink>
      <NavLink to="/for-sale"><Icon name="forsale" /><span>{t('For sale')}</span></NavLink>
      <NavLink to="/requests/new?section=forsale" className="tab-post" aria-label={t('Post an ad')}><Icon name="post" /><span>{t('Post')}</span></NavLink>
      <NavLink to="/housing"><Icon name="housing" /><span>{t('Housing')}</span></NavLink>
      <NavLink to="/messages">
        <span className="tab-icon"><Icon name="messages" />{unread > 0 && <span className="unread-dot">{unread > 99 ? '99+' : unread}</span>}</span>
        <span>{t('Messages')}</span>
      </NavLink>
    </nav>
  );
}

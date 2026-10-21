import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();

  // Poll the unread count so the Messages tab shows a dot. Also re-check on
  // every page change, so opening a conversation clears it straight away.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const tick = () => api('/conversations/unread-count').then((d) => alive && setUnread(d.unread)).catch(() => {});
    tick();
    const t = setInterval(tick, 15000);
    window.addEventListener('unc:read', tick); // fired by Conversation.jsx after marking messages read
    return () => { alive = false; clearInterval(t); window.removeEventListener('unc:read', tick); };
  }, [user, pathname]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">un<span>c</span></Link>
          <nav className="nav">
            <NavLink to="/" end>Browse</NavLink>
            {user && <NavLink to="/my-requests">My requests</NavLink>}
            {user && (
              <NavLink to="/messages">
                Messages {unread > 0 && <span className="unread-dot">{unread}</span>}
              </NavLink>
            )}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            {user ? (
              <>
                <NavLink to="/account">Account</NavLink>
                <button className="btn sm secondary" onClick={async () => { await logout(); navigate('/'); }}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link className="btn sm" to="/register">Sign up</Link>
              </>
            )}
            {user && <Link className="btn sm" to="/requests/new">+ Post a request</Link>}
          </nav>
        </div>
      </header>
      {user && !user.emailVerified && (
        <div className="container" style={{ paddingBottom: 0 }}>
          <div className="alert warn" style={{ margin: 0 }}>Confirm your email to get started. <Link to="/verify-email">Enter code</Link></div>
        </div>
      )}
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

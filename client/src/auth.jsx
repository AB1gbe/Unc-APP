// Keeps "who is logged in" in one place so every page can read it.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';
import { disablePush } from './push.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading

  const refresh = useCallback(async () => {
    try {
      const { user } = await api('/auth/me');
      setUser(user);
      return user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => {
    // Stop this phone's notifications first (needs the session to tell the server).
    await disablePush().catch(() => {});
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// The trust ladder (session 101, ADR-080):
// canChat = email confirmed + Terms: reply to ads and chat.
// isVerified = canChat + ID check approved (+ a card for businesses, who
// pay for ads): post, make offers on Wanted requests.
export const canChat = (u) => Boolean(u && u.emailVerified && u.termsAccepted);
export const isVerified = (u) => Boolean(canChat(u) && u.kycStatus === 'approved' && (u.accountType !== 'business' || u.hasCard));

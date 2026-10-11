import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';

/**
 * The session. Loaded once from /auth/me (null for guests, never a 401), then
 * kept in memory. The server's httpOnly cookie is the real source of truth.
 */
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .me(ctrl.signal)
      .then((u) => setUser(u))
      .catch((err) => {
        if (err.name !== 'AbortError') setOffline(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const login = useCallback(async (identifier, password) => {
    const u = await api.login(identifier, password);
    setUser(u);
    setOffline(false);
    return u;
  }, []);

  const register = useCallback(async (body) => {
    const u = await api.register(body);
    setUser(u);
    setOffline(false);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (body) => {
    const u = await api.updateProfile(body);
    setUser(u);
    return u;
  }, []);

  /** Optimistic: the heart fills immediately and rolls back if the call fails. */
  const toggleWishlist = useCallback(async (slug) => {
    setUser((u) => u && { ...u, wishlist: u.wishlist.includes(slug) ? u.wishlist.filter((s) => s !== slug) : [...u.wishlist, slug] });
    try {
      const { wishlist } = await api.toggleWishlist(slug);
      setUser((u) => u && { ...u, wishlist });
    } catch (err) {
      setUser((u) => u && { ...u, wishlist: u.wishlist.includes(slug) ? u.wishlist.filter((s) => s !== slug) : [...u.wishlist, slug] });
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      offline,
      isLoggedIn: Boolean(user),
      isAdmin: ['ADMIN', 'SUPER_ADMIN'].includes(user?.role),
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      login,
      register,
      logout,
      updateProfile,
      toggleWishlist,
    }),
    [user, loading, offline, login, register, logout, updateProfile, toggleWishlist]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

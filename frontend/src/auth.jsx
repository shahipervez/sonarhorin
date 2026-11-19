import { createContext, useContext, useEffect, useState } from "react";
import { api, refreshAccess, tokens } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the session from the HttpOnly refresh cookie (silent; no token is ever stored in JS storage).
  useEffect(() => {
    refreshAccess()
      .then((ok) => (ok ? api("/api/auth/me/").then(setUser) : null))
      .catch(() => tokens.clear())
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const d = await api("/api/auth/login/", { method: "POST", body: { email, password } });
    tokens.set(d.access);
    setUser(d.user);
    return d.user;
  };
  const register = async (form) => {
    const d = await api("/api/auth/register/", { method: "POST", body: form });
    tokens.set(d.access);
    setUser(d.user);
    return d.user;
  };
  // Third-party sign-in (Google / phone OTP) — same session payload as /login/.
  const setSession = (d) => { tokens.set(d.access); setUser(d.user); return d.user; };
  const loginWithGoogle = async (credential) => setSession(await api("/api/auth/google/", { method: "POST", body: { credential } }));
  const requestOtp = (phone) => api("/api/auth/otp/request/", { method: "POST", body: { phone } });
  const verifyOtp = async (phone, code, full_name) =>
    setSession(await api("/api/auth/otp/verify/", { method: "POST", body: { phone, code, ...(full_name ? { full_name } : {}) } }));
  const logout = async () => {
    try { await api("/api/auth/logout/", { method: "POST", retry: false }); } catch { /* already signed out */ }
    tokens.clear();
    setUser(null);
  };
  const updateMe = async (patch) => { const u = await api("/api/auth/me/", { method: "PATCH", body: patch }); setUser(u); return u; };

  return <AuthCtx.Provider value={{ user, ready, login, register, logout, updateMe, loginWithGoogle, requestOtp, verifyOtp }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

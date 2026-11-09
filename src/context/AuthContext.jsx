import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isTokenExpired, tokenExpiryMs } from "../lib/format";

const AuthContext = createContext(null);
const TOKEN_KEY = "reef.token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isTokenExpired(stored)) setToken(stored);
    else localStorage.removeItem(TOKEN_KEY);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const expiry = tokenExpiryMs(token);
    if (!expiry || expiry <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setExpired(true);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setExpired(true);
    }, expiry - Date.now());
    return () => window.clearTimeout(timer);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      ready,
      expired,
      clearExpired() {
        setExpired(false);
      },
      signIn(accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        setExpired(false);
        setToken(accessToken);
      },
      signOut() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      },
    }),
    [token, ready, expired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth");
  return context;
}

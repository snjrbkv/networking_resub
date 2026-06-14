/** Auth context — holds the current user and login/logout helpers. */
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { authApi } from "../api/services";
import { tokenStore } from "../api/client";
import { Role, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load if a token exists.
  useEffect(() => {
    (async () => {
      if (tokenStore.access) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          tokenStore.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const res = await authApi.register(payload);
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors on logout */
    }
    tokenStore.clear();
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => (user ? roles.includes(user.role) : false);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, hasRole }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

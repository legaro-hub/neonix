import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, captchaId?: string, captchaAnswer?: number) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await api.refresh();
      if (!active) return;
      if (ok) {
        try {
          const user = await api.me();
          if (active) setState({ user, loading: false });
        } catch {
          if (active) setState({ user: null, loading: false });
        }
      } else {
        if (active) setState({ user: null, loading: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login({ email, password });
    setAccessToken(data.accessToken);
    setState({ user: data.user, loading: false });
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string, captchaId?: string, captchaAnswer?: number) => {
      const data = await api.register({ email, password, name, captchaId: captchaId!, captchaAnswer: captchaAnswer! });
      setAccessToken(data.accessToken);
      setState({ user: data.user, loading: false });
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setState({ user: null, loading: false });
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

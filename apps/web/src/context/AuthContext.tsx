'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, setAccessToken, setUnauthorizedHandler } from '@/lib/api-instance';
import { clearSession, getRefreshToken, getSavedEmail, saveSession } from '@/lib/token-storage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (email: string, password: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref so the timeout callback always calls the latest version without stale closures
  const scheduleRefreshRef = useRef<((expiresAt: string) => void) | null>(null);

  const doLogout = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setAccessToken(null);
    clearSession();
    setIsAuthenticated(false);
    setUserEmail(null);
    queryClient.clear();
    router.replace('/login');
  }, [router, queryClient]);

  useEffect(() => {
    scheduleRefreshRef.current = (expiresAt: string) => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const delay = new Date(expiresAt).getTime() - Date.now() - 60_000;
      if (delay <= 0) return;
      refreshTimer.current = setTimeout(async () => {
        const rt = getRefreshToken();
        if (!rt) { doLogout(); return; }
        try {
          const tokens = await authApi.refresh({ refresh_token: rt });
          setAccessToken(tokens.access_token);
          saveSession(tokens.refresh_token, getSavedEmail() ?? '');
          scheduleRefreshRef.current?.(tokens.expires_at);
        } catch {
          doLogout();
        }
      }, delay);
    };
  }, [doLogout]);

  // On mount: restore session from stored refresh token
  useEffect(() => {
    setUnauthorizedHandler(doLogout);
    const rt = getRefreshToken();
    const email = getSavedEmail();

    if (!rt) {
      setIsLoading(false);
      return;
    }

    authApi
      .refresh({ refresh_token: rt })
      .then((tokens) => {
        setAccessToken(tokens.access_token);
        saveSession(tokens.refresh_token, email ?? '');
        setUserEmail(email);
        setIsAuthenticated(true);
        scheduleRefreshRef.current?.(tokens.expires_at);
      })
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));

    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const tokens = await authApi.login({ email, password });
      setAccessToken(tokens.access_token);
      saveSession(tokens.refresh_token, email);
      setUserEmail(email);
      setIsAuthenticated(true);
      scheduleRefreshRef.current?.(tokens.expires_at);
      router.replace(redirectTo ?? '/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const tokens = await authApi.register({ email, password });
      setAccessToken(tokens.access_token);
      saveSession(tokens.refresh_token, email);
      setUserEmail(email);
      setIsAuthenticated(true);
      scheduleRefreshRef.current?.(tokens.expires_at);
      router.replace(redirectTo ?? '/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    const rt = getRefreshToken();
    if (rt) {
      try { await authApi.logout({ refresh_token: rt }); } catch { /* ignore */ }
    }
    doLogout();
  }, [doLogout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSession } from '../api/auth';
import { SessionUser } from '../types/api';

type AuthContextValue = {
  isAuthenticated: boolean;
  user: SessionUser | null;
  setAuthenticated: (value: boolean) => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const setAuthenticated = useCallback((value: boolean) => {
    setIsAuthenticated(value);
    if (!value) {
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const sessionUser = await fetchSession();
      setUser(sessionUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      user,
      setAuthenticated,
      refreshSession
    }),
    [isAuthenticated, refreshSession, setAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

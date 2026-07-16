import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, saveToken, clearToken, getToken } from './api';

// Referans backend response şekli: id integer, password yok
export type User = {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: 'employee' | 'admin';
  workplace_id: number | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, surname: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const tok = await getToken();
    if (!tok) { setUser(null); return; }
    try {
      // Ref backend: GET /users/me → UserResponse
      const me = await api.get<User>('/users/me');
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => { (async () => { await refresh(); setLoading(false); })(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    // Ref backend: POST /auth/login → {access_token, token_type} (NO user)
    const res = await api.post<{ access_token: string; token_type: string }>('/auth/login',
      { email, password });
    await saveToken(res.access_token);
    // Now fetch user separately
    const me = await api.get<User>('/users/me');
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (name: string, surname: string, email: string, password: string) => {
    // Ref backend: POST /auth/register → {message, user_id} (NO token)
    await api.post<{ message: string; user_id: number }>('/auth/register',
      { name, surname, email, password });
    // Login immediately to get token
    return await login(email, password);
  }, [login]);

  const logout = useCallback(async () => { await clearToken(); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}

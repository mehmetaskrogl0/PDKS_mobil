import { storage } from '@/src/utils/storage';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8001';
const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? DEFAULT_BASE_URL).trim();
// Local backend server.py serves the API under /api.
// Set EXPO_PUBLIC_API_PREFIX="" only if your backend is mounted at the root.
const API_PREFIX = (process.env.EXPO_PUBLIC_API_PREFIX ?? '/api').trim();
const API = `${BASE_URL}${API_PREFIX}`;

export const TOKEN_KEY = 'atlas_pdks_token';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T = any>(path: string, method: Method = 'GET', body?: any): Promise<T> {
  const token = await storage.secureGet<string>(TOKEN_KEY, '');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `İstek başarısız (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p, 'GET'),
  post: <T = any>(p: string, body?: any) => request<T>(p, 'POST', body),
  put: <T = any>(p: string, body?: any) => request<T>(p, 'PUT', body),
  del: <T = any>(p: string) => request<T>(p, 'DELETE'),
};

export async function saveToken(token: string) { await storage.secureSet(TOKEN_KEY, token); }
export async function clearToken() { await storage.secureRemove(TOKEN_KEY); }
export async function getToken(): Promise<string> {
  return (await storage.secureGet<string>(TOKEN_KEY, '')) || '';
}

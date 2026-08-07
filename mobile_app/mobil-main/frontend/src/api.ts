import { storage } from '@/src/utils/storage';

const DEFAULT_BASE_URL = 'https://pdks-mobil.onrender.com';

const BASE_URL = (
  process.env.EXPO_PUBLIC_BACKEND_URL || DEFAULT_BASE_URL
).trim();

const API_PREFIX = (
  process.env.EXPO_PUBLIC_API_PREFIX || ''
).trim();

const API = `${BASE_URL}${API_PREFIX}`;

export const TOKEN_KEY = 'atlas_pdks_token';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T = any>(
  path: string,
  method: Method = 'GET',
  body?: any
): Promise<T> {

  const token = await storage.secureGet(
    TOKEN_KEY,
    ''
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API}${path}`;

  console.log('API adresi:', url);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined
        ? JSON.stringify(body)
        : undefined,
    });

    const text = await res.text();

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const message =
        data?.detail ||
        data?.message ||
        `İstek başarısız (${res.status})`;

      throw new Error(
        typeof message === 'string'
          ? message
          : JSON.stringify(message)
      );
    }

    return data as T;

  } catch (error: any) {

    console.error(
      'API bağlantı hatası:',
      error
    );

    if (
      error?.message === 'Network request failed' ||
      error instanceof TypeError
    ) {
      throw new Error(
        `Backend'e bağlanılamadı. Adres: ${url}`
      );
    }

    throw error;
  }
}


export const api = {
  get: <T = any>(path: string) =>
    request<T>(path, 'GET'),

  post: <T = any>(
    path: string,
    body?: any
  ) =>
    request<T>(path, 'POST', body),

  put: <T = any>(
    path: string,
    body?: any
  ) =>
    request<T>(path, 'PUT', body),

  del: <T = any>(path: string) =>
    request<T>(path, 'DELETE'),
};


export async function saveToken(token: string) {
  await storage.secureSet(
    TOKEN_KEY,
    token
  );
}


export async function clearToken() {
  await storage.secureRemove(
    TOKEN_KEY
  );
}


export async function getToken(): Promise<string> {
  return (
    await storage.secureGet(
      TOKEN_KEY,
      ''
    )
  ) || '';
}
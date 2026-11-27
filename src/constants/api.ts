import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'tf_token';
const USER_KEY = 'tf_user';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'supervisor' | 'manager' | 'administrator';
};

export type Shift = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
};

// ---- saved login ----
export async function saveSession(token: string, user: User) {
  await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(user)]]);
}

export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// ---- one function for every server call ----
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Is it running, and is the API address right?');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

// ---- the calls your screens use ----
export const login = (email: string, password: string) =>
  request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getLatestShift = () => request<{ shift: Shift | null }>('/shifts/latest');
export const startShift = () => request<Shift>('/shifts/start', { method: 'POST' });
export const endShift = () => request<Shift>('/shifts/end', { method: 'POST' });
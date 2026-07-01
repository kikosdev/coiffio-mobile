import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken, ApiError } from '../api/client';

const TOKEN_KEY = 'auth_token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client';
  clientId?: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthState {
  status: 'idle' | 'hydrating' | 'ready';
  user: AuthUser | null;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  registerClient: (dto: { name: string; identifier: string; phone: string; password: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  error: null,

  hydrate: async () => {
    set({ status: 'hydrating' });
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ status: 'ready', user: null });
      return;
    }
    setAuthToken(token);
    try {
      const user = await api.get<AuthUser>('/auth/me');
      set({ status: 'ready', user });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
      set({ status: 'ready', user: null });
    }
  },

  login: async (identifier, password) => {
    set({ error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/login', { identifier, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ user: res.user, status: 'ready' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to sign in.';
      set({ error: message });
      throw err;
    }
  },

  registerClient: async (dto) => {
    set({ error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/register/client', dto);
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setAuthToken(res.token);
      set({ user: res.user, status: 'ready' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create account.';
      set({ error: message });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    set({ user: null, status: 'ready' });
  },
}));

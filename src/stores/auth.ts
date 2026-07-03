import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken, ApiError } from '../api/client';
import { BackendRole } from '../features/auth/roleConfig';

const TOKEN_KEY = 'auth_token';

export interface AuthUser {
  id: string;
  salonId: string;
  name: string;
  email: string;
  phone: string;
  role: BackendRole;
  color?: string;
  isActive: boolean;
  registered: boolean;
  accountType: 'staff' | 'client';
  staffId?: string;
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
  login: (identifier: string, password: string) => Promise<AuthUser>;
  registerClient: (dto: { name: string; identifier: string; phone: string; password: string; email?: string }) => Promise<AuthUser>;
  updateProfile: (dto: { name?: string; email?: string; phone?: string }) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
      return res.user;
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
      return res.user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create account.';
      set({ error: message });
      throw err;
    }
  },

  updateProfile: async (dto) => {
    const updated = await api.patch<AuthUser>('/auth/me', dto);
    set((s) => ({ user: s.user ? { ...s.user, ...updated } : updated }));
    return updated;
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.patch('/auth/me/password', { currentPassword, newPassword });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    set({ user: null, status: 'ready' });
  },
}));

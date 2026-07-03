import { create } from 'zustand';
import { api } from '../api/client';

export type ClientPersonal = {
  fullName: string;
  email: string;
};

interface ProfileState {
  loaded: boolean;
  id: string;
  name: string;
  avatarUri?: string;
  notificationsEnabled: boolean;
  visits: number;
  upcoming: number;

  // Personal
  fullName: string;
  email: string;
  phone: string;

  fetchProfile: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => void;
  updateField: (key: keyof ClientPersonal, value: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setAvatar: (uri: string) => void;
  deactivateAccount: () => void;
}

interface RawUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const useProfile = create<ProfileState>()((set, get) => ({
  loaded: false,
  id: '',
  name: '',
  notificationsEnabled: true,
  visits: 0,
  upcoming: 0,

  fullName: '',
  email: '',
  phone: '',

  fetchProfile: async () => {
    const [me, history, upcoming] = await Promise.all([
      api.get<RawUser>('/auth/me'),
      api.get<unknown[]>('/appointments/mine', { scope: 'history' }),
      api.get<unknown[]>('/appointments/mine', { scope: 'upcoming' }),
    ]);
    set({
      loaded: true,
      id: me.id,
      name: me.name,
      fullName: me.name,
      email: me.email,
      phone: me.phone,
      visits: history.filter((a: any) => a.status === 'completed').length,
      upcoming: upcoming.length,
    });
  },

  setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

  updateField: async (key, value) => {
    const dto = key === 'fullName' ? { name: value } : { email: value };
    const updated = await api.patch<RawUser>('/auth/me', dto);
    set({
      fullName: updated.name,
      name: updated.name,
      email: updated.email,
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.patch('/auth/me/password', { currentPassword, newPassword });
  },

  setAvatar: (uri) => set({ avatarUri: uri }),

  deactivateAccount: () => { /* V1: no backend deactivation endpoint for clients yet */ },
}));

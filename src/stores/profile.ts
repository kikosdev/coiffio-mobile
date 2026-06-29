import { create } from 'zustand';

export type ClientProfile = {
  id: string;
  name: string;
  avatarUri?: string;
  tier: 'STANDARD' | 'GOLD';
  stats: { visits: number; points: number; reviews: number };
  notificationsEnabled: boolean;
};

export type ClientPersonal = {
  fullName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  gender?: 'male' | 'female' | 'other' | 'unspecified';
  birthday?: string;    // 'yyyy-MM-dd'
  location?: string;    // V1: free text
};

interface ProfileState extends ClientProfile, ClientPersonal {
  setNotificationsEnabled: (v: boolean) => void;
  updateField: (key: keyof ClientPersonal, value: string | undefined) => void;
  setAvatar: (uri: string) => void;
  requestPhoneChange: (phone: string) => void;
  confirmPhoneOtp: (code: string) => { ok: boolean; collision?: boolean };
  requestEmailChange: (email: string) => void;
  deactivateAccount: () => void;
}

export const useProfile = create<ProfileState>()((set) => ({
  id: 'u1',
  name: 'Michael Reeves',
  tier: 'GOLD',
  stats: { visits: 24, points: 480, reviews: 12 },
  notificationsEnabled: true,

  // Personal
  fullName: 'Michael Reeves',
  username: 'michael.reeves',
  email: 'michael@email.com',
  emailVerified: true,
  phone: '+216 55 123 456',
  phoneVerified: true,
  gender: 'male',
  birthday: '1992-03-14',
  location: 'Tunis, TN',

  setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

  updateField: (key, value) =>
    set((s) => ({
      ...s,
      [key]: value,
      ...(key === 'fullName' ? { name: value } : {}),
    } as ProfileState)),

  setAvatar: (uri) => set({ avatarUri: uri }),

  requestPhoneChange: (phone) => set({ phone, phoneVerified: false }),

  confirmPhoneOtp: (code) => {
    if (code === '000000') return { ok: false, collision: true };
    set({ phoneVerified: true });
    return { ok: true };
  },

  requestEmailChange: (email) => set({ email, emailVerified: false }),

  deactivateAccount: () => { /* V1: soft-delete stub */ },
}));

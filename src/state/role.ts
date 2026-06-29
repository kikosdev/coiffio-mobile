import { create } from 'zustand';
import { Role } from '../theme/tokens';

export type StaffJob = 'stylist' | 'manager';

interface RoleState {
  role: Role;
  job?: StaffJob;
  setRole: (role: Role, job?: StaffJob) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  role: 'client',
  job: undefined,
  setRole: (role, job) => set({ role, job }),
}));

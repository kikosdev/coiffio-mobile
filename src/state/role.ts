import { create } from 'zustand';
import { Role } from '../theme/tokens';

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  role: 'client',
  setRole: (role) => set({ role }),
}));

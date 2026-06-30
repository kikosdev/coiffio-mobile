import { Role } from '../../theme/tokens';

export type AuthRole = Role; // 'client' | 'staff' | 'owner'

export interface RoleAuthConfig {
  label: string;
  emailLabel: string;
  emailPlaceholder: string;
  canSignup: boolean;
  staffNote?: string;
  home: string;
}

export const ROLE_AUTH: Record<AuthRole, RoleAuthConfig> = {
  client: {
    label: 'Signing in as Client',
    emailLabel: 'EMAIL',
    emailPlaceholder: 'you@email.com',
    canSignup: true,
    home: '/(client)/home',
  },
  staff: {
    label: 'Signing in as Barber',
    emailLabel: 'WORK EMAIL',
    emailPlaceholder: 'name@yoursalon.com',
    canSignup: false,
    staffNote: 'Barber accounts are created by your salon owner. Use the work email they set up for you.',
    home: '/(staff)/today',
  },
  owner: {
    label: 'Signing in as Owner',
    emailLabel: 'WORK EMAIL',
    emailPlaceholder: 'owner@yourbrand.com',
    canSignup: false,
    staffNote: 'Owner accounts are provisioned by Black Box super-admin. Contact HQ to get access.',
    home: '/(owner)/hq',
  },
};

export function resolveRole(raw?: string | string[]): AuthRole {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'staff' || v === 'owner' ? v : 'client';
}

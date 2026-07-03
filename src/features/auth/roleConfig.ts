import { Role } from '../../theme/tokens';

export type AuthRole = Role; // 'client' | 'staff' | 'owner'

/** Backend account roles (`Staff.role` ∪ `'client'`) — distinct from the UI surface `Role`. */
export type BackendRole = 'client' | 'owner' | 'manager' | 'stylist' | 'colorist';

/** Maps a real backend account role to the UI surface it should land on. */
export function mapBackendRoleToSurface(role: BackendRole): Role {
  if (role === 'owner') return 'owner';
  if (role === 'manager' || role === 'stylist' || role === 'colorist') return 'staff';
  return 'client';
}

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
    emailLabel: 'EMAIL OR PHONE',
    emailPlaceholder: 'you@email.com or +216 XX XXX XXX',
    canSignup: true,
    home: '/(client)/home',
  },
  staff: {
    label: 'Signing in as Barber',
    emailLabel: 'WORK EMAIL OR PHONE',
    emailPlaceholder: 'name@yoursalon.com or +216 XX XXX XXX',
    canSignup: false,
    staffNote: 'Barber accounts are created by your salon owner. Use the email or phone they set up for you.',
    home: '/(staff)/today',
  },
  owner: {
    label: 'Signing in as Owner',
    emailLabel: 'WORK EMAIL OR PHONE',
    emailPlaceholder: 'owner@yourbrand.com or +216 XX XXX XXX',
    canSignup: false,
    staffNote: 'Owner accounts are provisioned by Black Box super-admin. Contact HQ to get access.',
    home: '/(owner)/hq',
  },
};

export function resolveRole(raw?: string | string[]): AuthRole {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'staff' || v === 'owner' ? v : 'client';
}

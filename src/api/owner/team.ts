import { api } from '../client';
import { Staff, StaffLevel, StaffRole } from '../../types/owner';

export type { Staff };

// The owner roster is already served by GET /owner/hq (src/stores/ownerSalon.ts) as
// `MySalon.team` — prefer that for anything a list/card screen needs. This one exists for
// screens that need fields the HQ aggregate doesn't carry (role, phone, email, color,
// commissionPct, baseRate…), e.g. prefilling the team edit form.
/** GET /team — owner/manager. Full unshaped roster. */
export function list(): Promise<Staff[]> {
  return api.get<Staff[]>('/team');
}

export interface CreateStaffDto {
  name: string;
  identifier: string; // login (email or phone) for the new account
  role: StaffRole;
  password: string;
  email?: string;
  phone?: string;
  color?: string;
  level?: StaffLevel;
  capabilities?: string[];
  baseRate?: number;
  commissionPct?: number;
}

/** POST /team — owner only. */
export function create(dto: CreateStaffDto): Promise<Staff> {
  return api.post<Staff>('/team', dto);
}

export interface UpdateStaffDto {
  name?: string;
  phone?: string;
  role?: StaffRole;
  isActive?: boolean;
  color?: string;
  level?: StaffLevel;
  capabilities?: string[];
  baseRate?: number;
  commissionPct?: number;
}

/** PATCH /team/:id — owner/manager. */
export function update(id: string, dto: UpdateStaffDto): Promise<Staff> {
  return api.patch<Staff>(`/team/${id}`, dto);
}

/** DELETE /team/:id — owner only. Soft: sets isActive:false, does not remove the account. */
export function deactivate(id: string): Promise<Staff> {
  return api.del<Staff>(`/team/${id}`);
}

/** DELETE /team/:id/access — owner only. Revokes tenant access outright (harder than deactivate). */
export function revokeAccess(id: string): Promise<{ revoked: boolean }> {
  return api.del<{ revoked: boolean }>(`/team/${id}/access`);
}

export interface StaffStats {
  stylistId: string;
  weekRevenueTnd: number;
  weekCuts: number;
  weekUtil: { date: string; pct: number }[];
}

/** GET /team/:id/stats — owner/manager. */
export function stats(id: string): Promise<StaffStats> {
  return api.get<StaffStats>(`/team/${id}/stats`);
}

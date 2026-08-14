import { api } from '../client';
import { BusinessHoursDay, Salon } from '../../types/owner';

/** GET /schedule/salon-hours — the salon's opening hours, used to disable closed days in pickers. */
export function getSalon(): Promise<BusinessHoursDay[]> {
  return api.get<BusinessHoursDay[]>('/schedule/salon-hours');
}

/**
 * GET /settings/salon — the full salon config (owner/manager), counterpart of `updateSalon()`
 * below. Distinct from `GET /owner/hq`, which is a dashboard: it returns today's derived
 * `hoursToday` string and live revenue, not the editable record.
 */
export function getSalonSettings(): Promise<Salon> {
  return api.get<Salon>('/settings/salon');
}

export interface UpdateSalonDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  taxRate?: number;
  businessHours?: BusinessHoursDay[];
}

/**
 * PATCH /settings/salon — owner only. Salon-wide config, not just hours; `businessHours` is
 * the field that overlaps with getSalon()'s GET /schedule/salon-hours response.
 */
export function updateSalon(dto: UpdateSalonDto): Promise<Salon> {
  return api.patch<Salon>('/settings/salon', dto);
}

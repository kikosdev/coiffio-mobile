import { api } from '../client';
import { LeaveRange, LeaveRequest, LeaveStatus, LeaveType, Override, OverrideType, Schedule, WeeklyDay } from '../../types/owner';

/** GET /schedule/:stylistId — owner/manager see any stylist; a stylist only their own. */
export function getStaff(stylistId: string): Promise<Schedule> {
  return api.get<Schedule>(`/schedule/${stylistId}`);
}

export interface SetWeeklyDto {
  weekly: WeeklyDay[];
}

/** PUT /schedule/:stylistId — owner/manager only. Replaces the whole weekly rota. */
export function setWeekly(stylistId: string, dto: SetWeeklyDto): Promise<Schedule> {
  return api.put<Schedule>(`/schedule/${stylistId}`, dto);
}

export interface AddOverrideDto {
  date: string; // 'YYYY-MM-DD'
  type: OverrideType;
  start?: string; // required when type === 'custom'
  end?: string;
  note?: string;
}

/** POST /schedule/:stylistId/override — owner/manager only. */
export function addOverride(stylistId: string, dto: AddOverrideDto): Promise<Schedule> {
  return api.post<Schedule>(`/schedule/${stylistId}/override`, dto);
}

/** DELETE /schedule/:stylistId/override/:date — owner/manager only. */
export function removeOverride(stylistId: string, date: string): Promise<Schedule> {
  return api.del<Schedule>(`/schedule/${stylistId}/override/${date}`);
}

/** GET /leave-requests — scoped to self for a stylist; owner/manager see the salon's queue. */
export function listLeave(status?: LeaveStatus): Promise<LeaveRequest[]> {
  return api.get<LeaveRequest[]>('/leave-requests', { status });
}

export interface CreateLeaveRequestDto {
  stylistId?: string; // owner/manager can file on behalf of a stylist; omit for self
  type: LeaveType;
  range: LeaveRange;
  swapWithId?: string;
  note?: string;
}

/** POST /leave-requests. */
export function createLeave(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
  return api.post<LeaveRequest>('/leave-requests', dto);
}

/**
 * POST /leave-requests/:id/approve — owner/manager only. If bookings collide with the
 * requested range, the backend responds 409 with the conflict list instead of approving —
 * never auto-resolved, so a caller must surface that 409 rather than swallow it.
 */
export function approveLeave(id: string): Promise<LeaveRequest> {
  return api.post<LeaveRequest>(`/leave-requests/${id}/approve`);
}

/** POST /leave-requests/:id/reject — owner/manager only. */
export function rejectLeave(id: string): Promise<LeaveRequest> {
  return api.post<LeaveRequest>(`/leave-requests/${id}/reject`);
}

export type { Override };

// SWAP: GET /auth/me + staff profile
import { myStaffProfile } from '../../data/staff/profile';

export function useMyProfile() {
  return { data: myStaffProfile, isLoading: false, error: null };
}

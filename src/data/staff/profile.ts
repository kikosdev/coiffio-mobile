// SWAP: GET /auth/me + staff profile

export type StaffJob = 'stylist' | 'manager';

export type StaffProfileData = {
  id: string;
  name: string;
  initials: string;
  job: StaffJob;
  rating: number;
  isPro: boolean;
  salonName: string;
  stats: { clients: number; cuts: number; yearsExp: number };
  bio?: string;
};

export const myStaffProfile: StaffProfileData = {
  id: 'b1',
  name: 'Richard Anderson',
  initials: 'RA',
  job: 'stylist',
  rating: 4.8,
  isPro: true,
  salonName: 'Haire · Tunis Centre',
  stats: { clients: 248, cuts: 1200, yearsExp: 6 },
  bio: 'Specialist in skin fades and precision cuts. 6 years at Haire.',
};

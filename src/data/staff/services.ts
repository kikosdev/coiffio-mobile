// SWAP: GET /services?staffId=me

export type StaffService = {
  id: string;
  name: string;
  durationMin: number;
  priceTnd: number;
};

export const defaultAcceptingBookings = true;

export const myServices: StaffService[] = [
  { id: 'ss1', name: 'Haircut & styling', durationMin: 35, priceTnd: 25 },
  { id: 'ss2', name: 'Skin fade',         durationMin: 30, priceTnd: 28 },
  { id: 'ss3', name: 'Hot towel & beard', durationMin: 20, priceTnd: 18 },
  { id: 'ss4', name: 'Mustang shaving',   durationMin: 10, priceTnd: 10 },
  { id: 'ss5', name: 'Kids cut',          durationMin: 25, priceTnd: 22 },
];

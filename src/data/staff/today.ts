// SWAP: GET /appointments/mine?date=today&assigned=me

export type TodayState = 'waiting' | 'in_chair' | 'done';

export type TodayService = {
  name: string;
  durationMin: number;
  priceTnd: number;
};

export type TodayAppointment = {
  id: string;
  clientName: string;
  clientInitials: string;
  phone: string;
  services: TodayService[];
  startTime: string;    // 'HH:mm'
  durationMin: number;
  totalTnd: number;
  state: TodayState;
  note?: string;
  visitCount: number;
};

export const todayDate = '2026-06-29';

export const staffTodayAppointments: TodayAppointment[] = [
  {
    id: 'ta1', clientName: 'Mehdi Salah', clientInitials: 'MS', phone: '+216 9x xxx x47',
    services: [{ name: 'Haircut', durationMin: 35, priceTnd: 25 }, { name: 'Beard trim', durationMin: 10, priceTnd: 10 }],
    startTime: '09:00', durationMin: 45, totalTnd: 35, state: 'done', visitCount: 18,
    note: 'Keep sides tight, leave top longer.',
  },
  {
    id: 'ta2', clientName: 'Yassine Trabelsi', clientInitials: 'YT', phone: '+216 5x xxx x83',
    services: [{ name: 'Skin fade', durationMin: 30, priceTnd: 28 }],
    startTime: '10:00', durationMin: 30, totalTnd: 28, state: 'done', visitCount: 12,
  },
  {
    id: 'ta3', clientName: 'Amine Gharbi', clientInitials: 'AG', phone: '+216 2x xxx x91',
    services: [{ name: 'Haircut & beard', durationMin: 60, priceTnd: 48 }],
    startTime: '11:15', durationMin: 60, totalTnd: 48, state: 'in_chair', visitCount: 8,
  },
  {
    id: 'ta4', clientName: 'Sami Bouazizi', clientInitials: 'SB', phone: '+216 9x xxx x22',
    services: [{ name: 'Haircut & styling', durationMin: 35, priceTnd: 25 }],
    startTime: '13:00', durationMin: 35, totalTnd: 25, state: 'waiting', visitCount: 6,
  },
  {
    id: 'ta5', clientName: 'Karim Nasri', clientInitials: 'KN', phone: '+216 5x xxx x60',
    services: [{ name: 'Hot towel & beard', durationMin: 20, priceTnd: 18 }],
    startTime: '14:00', durationMin: 20, totalTnd: 18, state: 'waiting', visitCount: 4,
  },
  {
    id: 'ta6', clientName: 'Omar Ferjani', clientInitials: 'OF', phone: '+216 2x xxx x17',
    services: [{ name: 'Skin fade', durationMin: 30, priceTnd: 28 }],
    startTime: '15:30', durationMin: 30, totalTnd: 28, state: 'waiting', visitCount: 2,
  },
];

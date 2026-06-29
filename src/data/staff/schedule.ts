// SWAP: GET /schedule?staffId=me&weekStart=...

export type ScheduleSlotState = 'confirmed' | 'pending' | 'open' | 'blocked';

export type ScheduleSlot = {
  id: string;
  date: string;           // 'yyyy-MM-dd'
  startTime: string;      // 'HH:mm'
  durationMin: number;
  clientName: string;
  clientInitials: string;
  service: string;
  priceTnd: number;
  state: ScheduleSlotState;
};

// Week of 2026-06-29 (Mon–Fri)
export const scheduleWeekDates = [
  '2026-06-29', // Mon (today)
  '2026-06-30', // Tue
  '2026-07-01', // Wed
  '2026-07-02', // Thu
  '2026-07-03', // Fri
];

export const scheduleSlots: ScheduleSlot[] = [
  // Monday
  { id: 'sl1', date: '2026-06-29', startTime: '09:00', durationMin: 45, clientName: 'Mehdi Salah',      clientInitials: 'MS', service: 'Haircut & beard',  priceTnd: 35, state: 'confirmed' },
  { id: 'sl2', date: '2026-06-29', startTime: '10:00', durationMin: 30, clientName: 'Yassine Trabelsi', clientInitials: 'YT', service: 'Skin fade',         priceTnd: 28, state: 'confirmed' },
  { id: 'sl3', date: '2026-06-29', startTime: '11:15', durationMin: 60, clientName: 'Amine Gharbi',     clientInitials: 'AG', service: 'Full service',      priceTnd: 48, state: 'confirmed' },
  { id: 'sl4', date: '2026-06-29', startTime: '13:00', durationMin: 35, clientName: 'Sami Bouazizi',    clientInitials: 'SB', service: 'Haircut & styling', priceTnd: 25, state: 'confirmed' },
  { id: 'sl5', date: '2026-06-29', startTime: '14:00', durationMin: 20, clientName: 'Karim Nasri',      clientInitials: 'KN', service: 'Hot towel & beard', priceTnd: 18, state: 'confirmed' },
  { id: 'sl6', date: '2026-06-29', startTime: '15:30', durationMin: 30, clientName: 'Omar Ferjani',     clientInitials: 'OF', service: 'Skin fade',         priceTnd: 28, state: 'pending'   },
  // Tuesday
  { id: 'sl7', date: '2026-06-30', startTime: '09:30', durationMin: 45, clientName: 'Mehdi Salah',      clientInitials: 'MS', service: 'Haircut & beard',  priceTnd: 35, state: 'confirmed' },
  { id: 'sl8', date: '2026-06-30', startTime: '11:00', durationMin: 30, clientName: 'Bilel Mrani',      clientInitials: 'BM', service: 'Skin fade',         priceTnd: 28, state: 'confirmed' },
  { id: 'sl9', date: '2026-06-30', startTime: '12:30', durationMin: 60, clientName: '',                 clientInitials: '',   service: '',                  priceTnd: 0,  state: 'open'      },
  { id: 'slA', date: '2026-06-30', startTime: '14:00', durationMin: 45, clientName: 'Sami Bouazizi',    clientInitials: 'SB', service: 'Haircut & beard',   priceTnd: 35, state: 'pending'   },
  // Wednesday
  { id: 'slB', date: '2026-07-01', startTime: '10:00', durationMin: 45, clientName: 'Amine Gharbi',     clientInitials: 'AG', service: 'Full service',      priceTnd: 48, state: 'confirmed' },
  { id: 'slC', date: '2026-07-01', startTime: '14:30', durationMin: 20, clientName: 'Karim Nasri',      clientInitials: 'KN', service: 'Beard trim',        priceTnd: 10, state: 'confirmed' },
  // Thursday
  { id: 'slD', date: '2026-07-02', startTime: '09:00', durationMin: 35, clientName: 'Omar Ferjani',     clientInitials: 'OF', service: 'Haircut & styling', priceTnd: 25, state: 'confirmed' },
  { id: 'slE', date: '2026-07-02', startTime: '11:00', durationMin: 30, clientName: 'Yassine Trabelsi', clientInitials: 'YT', service: 'Skin fade',         priceTnd: 28, state: 'confirmed' },
  // Friday
  { id: 'slF', date: '2026-07-03', startTime: '10:00', durationMin: 60, clientName: 'Mehdi Salah',      clientInitials: 'MS', service: 'Haircut & beard',  priceTnd: 35, state: 'confirmed' },
  { id: 'slG', date: '2026-07-03', startTime: '14:00', durationMin: 20, clientName: 'Amine Gharbi',     clientInitials: 'AG', service: 'Hot towel & beard', priceTnd: 18, state: 'confirmed' },
];

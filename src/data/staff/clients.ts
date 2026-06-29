// SWAP: GET /clients?staffId=me

export type StaffClientVisit = {
  serviceName: string;
  date: string;       // 'yyyy-MM-dd'
  priceTnd: number;
};

export type StaffClient = {
  id: string;
  name: string;
  initials: string;
  isRegular: boolean;
  visitCount: number;
  lastVisitDate: string;  // 'yyyy-MM-dd'
  totalSpentTnd: number;
  phone: string;          // masked per privacy rule #10
  notes?: string;
  recentVisits: StaffClientVisit[];
};

export const myClientsStats = { total: 248, regulars: 32, thisWeek: 9 };

export const myClients: StaffClient[] = [
  {
    id: 'mc1', name: 'Mehdi Salah',      initials: 'MS', isRegular: true,  visitCount: 18,
    lastVisitDate: '2026-06-29', totalSpentTnd: 630, phone: '+216 9x xxx x47',
    notes: 'Prefers tight sides, slightly longer on top.',
    recentVisits: [
      { serviceName: 'Haircut & beard', date: '2026-06-29', priceTnd: 35 },
      { serviceName: 'Skin fade',       date: '2026-06-12', priceTnd: 28 },
      { serviceName: 'Haircut & beard', date: '2026-05-29', priceTnd: 35 },
    ],
  },
  {
    id: 'mc2', name: 'Yassine Trabelsi', initials: 'YT', isRegular: true,  visitCount: 12,
    lastVisitDate: '2026-06-29', totalSpentTnd: 336, phone: '+216 5x xxx x83',
    recentVisits: [
      { serviceName: 'Skin fade', date: '2026-06-29', priceTnd: 28 },
      { serviceName: 'Skin fade', date: '2026-06-15', priceTnd: 28 },
      { serviceName: 'Skin fade', date: '2026-05-31', priceTnd: 28 },
    ],
  },
  {
    id: 'mc3', name: 'Amine Gharbi',     initials: 'AG', isRegular: true,  visitCount: 8,
    lastVisitDate: '2026-06-21', totalSpentTnd: 384, phone: '+216 2x xxx x91',
    recentVisits: [
      { serviceName: 'Full service',    date: '2026-06-21', priceTnd: 48 },
      { serviceName: 'Haircut & beard', date: '2026-06-07', priceTnd: 35 },
    ],
  },
  {
    id: 'mc4', name: 'Sami Bouazizi',    initials: 'SB', isRegular: true,  visitCount: 6,
    lastVisitDate: '2026-06-14', totalSpentTnd: 168, phone: '+216 9x xxx x22',
    recentVisits: [{ serviceName: 'Haircut & styling', date: '2026-06-14', priceTnd: 25 }],
  },
  {
    id: 'mc5', name: 'Karim Nasri',      initials: 'KN', isRegular: false, visitCount: 4,
    lastVisitDate: '2026-06-08', totalSpentTnd: 72,  phone: '+216 5x xxx x60',
    recentVisits: [{ serviceName: 'Hot towel & beard', date: '2026-06-08', priceTnd: 18 }],
  },
  {
    id: 'mc6', name: 'Omar Ferjani',     initials: 'OF', isRegular: false, visitCount: 2,
    lastVisitDate: '2026-05-30', totalSpentTnd: 56,  phone: '+216 2x xxx x17',
    recentVisits: [{ serviceName: 'Skin fade', date: '2026-05-30', priceTnd: 28 }],
  },
];

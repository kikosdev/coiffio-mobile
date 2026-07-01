// All dummy data for Step 1 prototype — no API calls

// ── CLIENT ──────────────────────────────────────────────────────────────────

export const dummySalon = {
  id: 's1',
  name: 'Rogers · Union Square',
  address: '312 E 14th St, New York',
  hours: 'Mon–Sat 9:00–21:00',
  rating: 4.8,
  reviewCount: 312,
  isOpen: true,
  barberCount: 6,
};

export const dummyBarbers = [
  { id: 'b1', name: 'Richard Anderson', title: 'Senior Barber', rating: 4.9, reviewCount: 114, yearsExp: 6, isPro: true, initials: 'RA', isOnline: true, todayCount: 4 },
  { id: 'b2', name: 'Marcus Bell',      title: 'Barber',         rating: 4.7, reviewCount: 88,  yearsExp: 3, isPro: false, initials: 'MB', isOnline: true, todayCount: 3 },
  { id: 'b3', name: 'Dawit Alem',       title: 'Barber',         rating: 4.8, reviewCount: 67,  yearsExp: 4, isPro: true,  initials: 'DA', isOnline: false, todayCount: 0 },
  { id: 'b4', name: 'Theo Brooks',      title: 'Senior Barber',  rating: 4.6, reviewCount: 54,  yearsExp: 5, isPro: false, initials: 'TB', isOnline: true, todayCount: 5 },
  { id: 'b5', name: 'Iván Costa',       title: 'Barber',         rating: 4.8, reviewCount: 92,  yearsExp: 2, isPro: false, initials: 'IC', isOnline: true, todayCount: 4 },
];

export const dummyServices = [
  { id: 'sv1', name: 'Classic Cut',      duration: 30, price: 35,  description: 'Scissor or clipper cut, styled to finish.' },
  { id: 'sv2', name: 'Fade & Style',     duration: 45, price: 45,  description: 'Skin fade blended to any length on top.' },
  { id: 'sv3', name: 'Beard Trim',       duration: 20, price: 20,  description: 'Shape, line-up, and hot-towel finish.' },
  { id: 'sv4', name: 'Cut & Beard',      duration: 60, price: 60,  description: 'Full service — cut plus beard in one visit.' },
  { id: 'sv5', name: 'Head Shave',       duration: 30, price: 30,  description: 'Straight-razor head shave with hot towel.' },
  { id: 'sv6', name: 'Kids Cut (U-12)', duration: 25, price: 25,  description: 'Relaxed cut for children under 12.' },
];

export const dummyTimeSlots = [
  { id: 't1', time: '09:00', available: true },
  { id: 't2', time: '09:30', available: true },
  { id: 't3', time: '10:00', available: false },
  { id: 't4', time: '10:30', available: true },
  { id: 't5', time: '11:00', available: true },
  { id: 't6', time: '11:30', available: false },
  { id: 't7', time: '12:00', available: true },
  { id: 't8', time: '14:00', available: true },
  { id: 't9', time: '14:30', available: true },
  { id: 't10', time: '15:00', available: false },
  { id: 't11', time: '15:30', available: true },
  { id: 't12', time: '16:00', available: true },
];

export const dummyClientBookings = [
  {
    id: 'bk1',
    confirmationCode: 'BB-48291',
    barberName: 'Richard Anderson',
    barberInitials: 'RA',
    serviceName: 'Fade & Style',
    date: '2026-06-28',
    time: '10:30',
    duration: 45,
    price: 45,
    status: 'confirmed' as const,
    salonName: 'Rogers · Union Square',
  },
  {
    id: 'bk2',
    confirmationCode: 'BB-39104',
    barberName: 'Marcus Bell',
    barberInitials: 'MB',
    serviceName: 'Classic Cut',
    date: '2026-07-05',
    time: '14:00',
    duration: 30,
    price: 35,
    status: 'confirmed' as const,
    salonName: 'Rogers · Union Square',
  },
  {
    id: 'bk3',
    confirmationCode: 'BB-27463',
    barberName: 'Richard Anderson',
    barberInitials: 'RA',
    serviceName: 'Cut & Beard',
    date: '2026-06-14',
    time: '11:00',
    duration: 60,
    price: 60,
    status: 'completed' as const,
    salonName: 'Rogers · Union Square',
  },
];

export type SalonPin = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
};

export const dummySalonPins: SalonPin[] = [
  { id: 'p1', name: 'The Barber Shop',  rating: 4.9, reviews: 312, lat: 36.8100, lng: 10.1760 },
  { id: 'p2', name: 'Good Place',        rating: 4.8, reviews: 198, lat: 36.8020, lng: 10.1870 },
  { id: 'p3', name: 'Silent Fox',        rating: 5.0, reviews: 127, lat: 36.8065, lng: 10.1930 },
  { id: 'p4', name: 'Rogers Barbershop', rating: 4.7, reviews: 279, lat: 36.7990, lng: 10.1790 },
];

export type Pack = {
  id: string;
  name: string;
  description: string;
  serviceIds: string[];
  price: number; // TND
  durationMin: number;
  badge?: string;
};

export const dummyPacks: Pack[] = [
  {
    id: 'pk1', name: 'Combo Fresh',
    description: 'Classic Cut + Beard Trim — our most popular combo.',
    serviceIds: ['sv1', 'sv3'],
    price: 45, durationMin: 50,
    badge: 'BEST VALUE',
  },
  {
    id: 'pk2', name: 'Full Treatment',
    description: 'Cut & Beard all-in-one, styled to finish.',
    serviceIds: ['sv4'],
    price: 55, durationMin: 60,
    badge: '-8%',
  },
];

export const dummyOffers = [
  { id: 'o1', title: 'First Visit', discount: '20% off', description: 'Any service on your first visit.', badge: 'NEW CLIENT', expires: '2026-07-31' },
  { id: 'o2', title: 'Cut + Beard Bundle', discount: '$10 off', description: 'Book a cut and beard trim together.', badge: 'BUNDLE', expires: '2026-07-15' },
];

// ── STAFF ────────────────────────────────────────────────────────────────────

export const dummyStaffProfile = {
  id: 'b1',
  name: 'Richard Anderson',
  initials: 'RA',
  title: 'Senior Barber',
  salon: 'Rogers · Union Square',
  rating: 4.9,
  reviewCount: 114,
  acceptingBookings: true,
};

export const dummyTodayAppointments = [
  { id: 'a1', clientName: 'James Wilson',  clientInitials: 'JW', service: 'Fade & Style',  time: '09:30', duration: 45, price: 45, status: 'completed' as const },
  { id: 'a2', clientName: 'Omar Hassan',   clientInitials: 'OH', service: 'Classic Cut',   time: '10:30', duration: 30, price: 35, status: 'completed' as const },
  { id: 'a3', clientName: 'Luis Moreno',   clientInitials: 'LM', service: 'Cut & Beard',   time: '12:00', duration: 60, price: 60, status: 'in_progress' as const },
  { id: 'a4', clientName: 'Kwame Osei',    clientInitials: 'KO', service: 'Fade & Style',  time: '14:00', duration: 45, price: 45, status: 'upcoming' as const },
  { id: 'a5', clientName: 'Alexei Romanov',clientInitials: 'AR', service: 'Classic Cut',   time: '15:00', duration: 30, price: 35, status: 'upcoming' as const },
  { id: 'a6', clientName: 'Yusuf Al-Amin', clientInitials: 'YA', service: 'Beard Trim',    time: '16:00', duration: 20, price: 20, status: 'upcoming' as const },
];

export const dummyWeekSchedule = [
  { day: 'Mon', date: '23', slots: 8 },
  { day: 'Tue', date: '24', slots: 7 },
  { day: 'Wed', date: '25', slots: 9 },
  { day: 'Thu', date: '26', slots: 6, isToday: true },
  { day: 'Fri', date: '27', slots: 8 },
  { day: 'Sat', date: '28', slots: 10 },
];

export const dummyEarnings = {
  todayTotal: 195,
  weekTotal: 2940,
  monthTotal: 11800,
  byService: [
    { service: 'Fade & Style',  count: 28, total: 1260 },
    { service: 'Classic Cut',   count: 22, total: 770 },
    { service: 'Cut & Beard',   count: 8,  total: 480 },
    { service: 'Beard Trim',    count: 3,  total: 60  },
  ],
  weekChart: [60, 80, 70, 95, 85, 100],
};

export const dummyClients = [
  { id: 'c1', name: 'James Wilson',   initials: 'JW', visitCount: 12, lastVisit: '2026-06-26', totalSpent: 420 },
  { id: 'c2', name: 'Omar Hassan',    initials: 'OH', visitCount: 8,  lastVisit: '2026-06-24', totalSpent: 280 },
  { id: 'c3', name: 'Luis Moreno',    initials: 'LM', visitCount: 5,  lastVisit: '2026-06-20', totalSpent: 300 },
  { id: 'c4', name: 'Kwame Osei',     initials: 'KO', visitCount: 3,  lastVisit: '2026-06-15', totalSpent: 135 },
  { id: 'c5', name: 'Alexei Romanov', initials: 'AR', visitCount: 7,  lastVisit: '2026-06-22', totalSpent: 245 },
  { id: 'c6', name: 'Yusuf Al-Amin',  initials: 'YA', visitCount: 2,  lastVisit: '2026-06-10', totalSpent: 70  },
];

// ── OWNER ────────────────────────────────────────────────────────────────────

export const dummyOwnerProfile = {
  name: 'Daniel Rogers',
  initials: 'DR',
};

export const dummySalons = [
  {
    id: 'sl1', name: 'Union Square', address: '312 E 14th St, New York',
    barberCount: 6, todayRevenue: 1420, bookingCount: 32, chairUse: 78,
    isOpen: true, status: 'open' as const, rating: 4.8,
  },
  {
    id: 'sl2', name: 'SoHo', address: '88 Spring St, New York',
    barberCount: 5, todayRevenue: 1080, bookingCount: 27, chairUse: 65,
    isOpen: true, status: 'open' as const, rating: 4.7,
  },
  {
    id: 'sl3', name: 'Brooklyn', address: '540 Atlantic Ave, Brooklyn',
    barberCount: 7, todayRevenue: 712, bookingCount: 18, chairUse: 42,
    isOpen: true, status: 'closing' as const, rating: 4.6,
  },
];

// Single-salon V1 reference (collapse of multi-salon design)
export const dummySingleSalon = {
  id: 'sl1',
  name: 'Union Square',
  address: '312 E 14th St, New York',
  hours: 'Mon–Sat 9:00–21:00',
  barberCount: 6,
  todayRevenue: 1420,
  bookingCount: 32,
  chairUse: 78,
  isOpen: true,
  status: 'open' as const,
};

export const dummyHQStats = {
  todayRevenue: 3212,
  revenueChange: 9,
  bookingCount: 84,
  barbersOn: 14,
  barbersTotal: 18,
};

export const dummyTeam = [
  { id: 'b1', name: 'Richard Anderson', initials: 'RA', salon: 'Union Square', salonColor: '#F4A62A', status: 'active' as const, todayCount: 4, isPro: true,  rating: 4.9 },
  { id: 'b2', name: 'Marcus Bell',      initials: 'MB', salon: 'Union Square', salonColor: '#F4A62A', status: 'break' as const,  todayCount: 3, isPro: false, rating: 4.7 },
  { id: 'b3', name: 'Dawit Alem',       initials: 'DA', salon: 'Union Square', salonColor: '#F4A62A', status: 'off' as const,    todayCount: 0, isPro: false, rating: 4.8 },
  { id: 'b4', name: 'Theo Brooks',      initials: 'TB', salon: 'Union Square', salonColor: '#F4A62A', status: 'active' as const, todayCount: 5, isPro: false, rating: 4.6 },
  { id: 'b5', name: 'Iván Costa',       initials: 'IC', salon: 'Union Square', salonColor: '#F4A62A', status: 'active' as const, todayCount: 4, isPro: false, rating: 4.8 },
  { id: 'b6', name: 'Jordan Price',     initials: 'JP', salon: 'Union Square', salonColor: '#F4A62A', status: 'active' as const, todayCount: 2, isPro: false, rating: 4.5 },
];

export type BarberDetail = {
  yearsExp: number;
  weekRevenue: number;
  weekCuts: number;
  weekUtil: number[]; // Mon–Sun (0–100), 0 = closed/day off
};

export const dummyBarberDetails: Record<string, BarberDetail> = {
  b1: { yearsExp: 6, weekRevenue: 2940, weekCuts: 61, weekUtil: [60, 80, 70, 95, 85, 100, 0] },
  b2: { yearsExp: 3, weekRevenue: 1890, weekCuts: 45, weekUtil: [50, 70, 60, 80, 75, 85,  0] },
  b3: { yearsExp: 4, weekRevenue: 1260, weekCuts: 32, weekUtil: [40,  0, 55, 70, 60,  0,  0] },
  b4: { yearsExp: 5, weekRevenue: 2100, weekCuts: 50, weekUtil: [65, 75, 70, 85, 80, 95,  0] },
  b5: { yearsExp: 2, weekRevenue: 1680, weekCuts: 40, weekUtil: [55, 65, 60, 75, 70, 80,  0] },
  b6: { yearsExp: 1, weekRevenue:  840, weekCuts: 22, weekUtil: [30, 50, 45, 60, 55, 70,  0] },
};

export const dummyAnalytics = {
  monthRevenue: 74180,
  revenueChange: 14,
  byStaff: [
    { name: 'Richard Anderson', revenue: 11800, pct: 100 },
    { name: 'Iván Costa',       revenue: 9400,  pct: 80  },
    { name: 'Theo Brooks',      revenue: 8700,  pct: 74  },
    { name: 'Marcus Bell',      revenue: 7200,  pct: 61  },
    { name: 'Dawit Alem',       revenue: 6100,  pct: 52  },
  ],
  topBarbers: [
    { rank: 1, name: 'Richard Anderson', initials: 'RA', salon: 'Union Square', revenue: 11800 },
    { rank: 2, name: 'Iván Costa',       initials: 'IC', salon: 'Union Square', revenue: 9400  },
    { rank: 3, name: 'Theo Brooks',      initials: 'TB', salon: 'Union Square', revenue: 8700  },
  ],
  weekChart: [8200, 9400, 10100, 11800, 12400, 10200, 12080],
};

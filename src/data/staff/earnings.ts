// SWAP: GET /earnings/mine?period=week|month|year

export type EarningPeriod = 'week' | 'month' | 'year';

export type ByService = { service: string; totalTnd: number; count: number; pct: number };
export type ChartBar  = { label: string; valueTnd: number; isToday?: boolean };

export type EarningsData = {
  period: EarningPeriod;
  totalTnd: number;
  changePct: number;
  byService: ByService[];
  chartBars: ChartBar[];
};

export const earningsByPeriod: Record<EarningPeriod, EarningsData> = {
  week: {
    period: 'week',
    totalTnd: 1840,
    changePct: 18,
    byService: [
      { service: 'Haircuts',      totalTnd: 980,  count: 28, pct: 72 },
      { service: 'Beard & shave', totalTnd: 520,  count: 18, pct: 42 },
      { service: 'Full service',  totalTnd: 340,  count: 7,  pct: 26 },
    ],
    chartBars: [
      { label: 'M', valueTnd: 260 },
      { label: 'T', valueTnd: 310 },
      { label: 'W', valueTnd: 280 },
      { label: 'T', valueTnd: 284, isToday: true },
      { label: 'F', valueTnd: 320 },
      { label: 'S', valueTnd: 386 },
      { label: 'S', valueTnd: 0   },
    ],
  },
  month: {
    period: 'month',
    totalTnd: 7200,
    changePct: 12,
    byService: [
      { service: 'Haircuts',      totalTnd: 3800, count: 108, pct: 78 },
      { service: 'Beard & shave', totalTnd: 2100, count: 73,  pct: 54 },
      { service: 'Full service',  totalTnd: 1300, count: 27,  pct: 32 },
    ],
    chartBars: [
      { label: 'W1', valueTnd: 1400 },
      { label: 'W2', valueTnd: 1650 },
      { label: 'W3', valueTnd: 1800 },
      { label: 'W4', valueTnd: 1900, isToday: true },
      { label: 'W5', valueTnd: 450  },
    ],
  },
  year: {
    period: 'year',
    totalTnd: 84000,
    changePct: 23,
    byService: [
      { service: 'Haircuts',      totalTnd: 44000, count: 1260, pct: 82 },
      { service: 'Beard & shave', totalTnd: 24000, count: 832,  pct: 58 },
      { service: 'Full service',  totalTnd: 16000, count: 330,  pct: 40 },
    ],
    chartBars: [
      { label: 'J', valueTnd: 5800 },
      { label: 'F', valueTnd: 6200 },
      { label: 'M', valueTnd: 7400 },
      { label: 'A', valueTnd: 7100 },
      { label: 'M', valueTnd: 7800 },
      { label: 'J', valueTnd: 8400, isToday: true },
      { label: 'J', valueTnd: 7000 },
      { label: 'A', valueTnd: 0    },
      { label: 'S', valueTnd: 0    },
      { label: 'O', valueTnd: 0    },
      { label: 'N', valueTnd: 0    },
      { label: 'D', valueTnd: 0    },
    ],
  },
};

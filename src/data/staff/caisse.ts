// SWAP: GET /caisse/day?date=&staffId=me  (manager: salon-wide + /caisse/day/summary)

export type CaisseEntry = {
  id: string;
  time: string;         // 'HH:mm'
  clientName: string;
  service: string;
  amountTnd: number;
  method: 'cash';
};

export type DayCaisse = {
  date: string;         // 'yyyy-MM-dd'
  servicesTotalTnd: number;
  productsTotalTnd: number;
  entries: CaisseEntry[];
};

export const dayCaisseFixture: DayCaisse = {
  date: '2026-06-29',
  servicesTotalTnd: 111,
  productsTotalTnd: 0,
  entries: [
    { id: 'ce1', time: '09:45', clientName: 'Mehdi Salah',      service: 'Haircut & beard', amountTnd: 35,  method: 'cash' },
    { id: 'ce2', time: '10:35', clientName: 'Yassine Trabelsi', service: 'Skin fade',        amountTnd: 28,  method: 'cash' },
    { id: 'ce3', time: '12:30', clientName: 'Amine Gharbi',     service: 'Full service',     amountTnd: 48,  method: 'cash' },
  ],
};

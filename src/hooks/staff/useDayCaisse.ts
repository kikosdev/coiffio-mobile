// SWAP: GET /caisse/day?date=&staffId=me  (manager: salon-wide + /caisse/day/summary)
import { useState } from 'react';
import { dayCaisseFixture, CaisseEntry } from '../../data/staff/caisse';

let _nextId = 200;

export function useDayCaisse() {
  const [entries, setEntries] = useState<CaisseEntry[]>(dayCaisseFixture.entries);

  const totalTnd = entries.reduce((s, e) => s + e.amountTnd, 0);

  function addSale(clientName: string, service: string, amountTnd: number) {
    // SWAP: POST /sales { clientName, service, amountTnd, method:'cash', staffId:me }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setEntries((prev) => [
      ...prev,
      { id: `ce${_nextId++}`, time: `${hh}:${mm}`, clientName, service, amountTnd, method: 'cash' },
    ]);
  }

  return {
    data: { date: dayCaisseFixture.date, totalTnd, servicesTotalTnd: totalTnd, productsTotalTnd: 0, cashTnd: totalTnd, entries },
    isLoading: false,
    error: null,
    addSale,
  };
}

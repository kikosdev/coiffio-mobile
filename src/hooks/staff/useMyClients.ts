// SWAP: GET /clients?staffId=me&search=...
import { myClients, myClientsStats, StaffClient } from '../../data/staff/clients';

export function useMyClients(search: string = '') {
  const q = search.toLowerCase();
  const filtered = q
    ? myClients.filter((c) => c.name.toLowerCase().includes(q))
    : myClients;

  return { data: { clients: filtered, stats: myClientsStats }, isLoading: false, error: null };
}

export function useMyClient(id: string): StaffClient | null {
  return myClients.find((c) => c.id === id) ?? null;
}

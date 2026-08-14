import { api } from '../client';

/**
 * GET /clients/:id item — only the fields the appointment detail screen needs (the backend's
 * ClientDetail also carries notes/visitCount/totalSpentTnd/recentVisits, unused here).
 */
export interface ClientDetail {
  id: string;
  name: string;
  phone: string;
  email: string;
}

/**
 * GET /clients/:id — owner/manager/stylist/colorist. The one place a client-name lookup is
 * allowed on the appointments surface (agenda.tsx uses a placeholder instead, to avoid an
 * N+1 fetch per row on the list).
 */
export function get(id: string): Promise<ClientDetail> {
  return api.get<ClientDetail>(`/clients/${id}`);
}

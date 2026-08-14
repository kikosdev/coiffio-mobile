import { api } from '../client';
import { getSalon } from '../salons';
import { useOwnerSalonStore } from '../../stores/ownerSalon';
import { salonDateKey, nowAsSalonTime } from '../../utils/salonTime';
import { MySalon } from '../../types/owner';

/**
 * The owner surface's own tenant slug, for the `:salonSlug`-prefixed routes (products, booking
 * catalog, cancel). It replaces a hardcoded `process.env.EXPO_PUBLIC_SALON_SLUG ?? 'salon-haire'`
 * — a slug that isn't in the database, so every one of those routes 404'd.
 *
 * Resolved from real data, never guessed: `GET /owner/hq` gives the salon id, and
 * `GET /public/salons/:id` turns it into the slug (`/owner/hq` itself returns no slug today).
 * Read from the ownerSalon store when it has already loaded, so the common path costs nothing.
 *
 * Kept in the API layer rather than passed down from each screen so the ~10 owner call sites
 * don't each have to thread a slug they have no reason to know about.
 */
let inFlight: Promise<string> | null = null;

/**
 * Oublie TOUT l'état tenant de l'owner — la promesse mémoïsée ici ET le store.
 *
 * ⚠️ Sécurité : à appeler à chaque déconnexion. Ces deux caches vivent au niveau du module et
 * du store, pas de la session : sans reset, un owner qui se déconnecte puis se reconnecte sur
 * un AUTRE compte conserverait le slug et le salon du précédent, et ses appels
 * `/:salonSlug/...` partiraient vers le mauvais tenant. Le backend ne rattraperait pas
 * l'erreur : le slug est une entrée légitime, il servirait simplement le mauvais salon.
 */
export function resetOwnerTenantCache(): void {
  inFlight = null;
  useOwnerSalonStore.setState({ salon: null, salonSlug: null, status: 'idle', error: undefined });
}

export function getOwnerSalonSlug(): Promise<string> {
  const cached = useOwnerSalonStore.getState().salonSlug;
  if (cached) return Promise.resolve(cached);

  // De-duped: several owner resources mount together and would otherwise each resolve the slug.
  if (!inFlight) {
    inFlight = (async () => {
      const salon = useOwnerSalonStore.getState().salon
        ?? (await api.get<MySalon>('/owner/hq', { date: salonDateKey(nowAsSalonTime()) }));
      const slug = (await getSalon(salon.id)).slug;
      if (!slug) throw new Error('[owner] salon has no slug — cannot call slug-scoped routes');
      useOwnerSalonStore.setState({ salonSlug: slug });
      return slug;
    })().catch((err) => {
      inFlight = null; // let the next caller retry rather than caching the failure forever
      throw err;
    });
  }
  return inFlight;
}

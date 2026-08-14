import { fetchCatalog, BookService } from '../booking';
import { getOwnerSalonSlug } from './tenant';

// Reuses booking.ts's cached public catalog (GET /:salonSlug/book/services) rather than
// duplicating a fetch — the owner surface reads the same service list the storefront does;
// there's no separate backoffice /services consumer here yet.
export type { BookService };

export async function list(): Promise<BookService[]> {
  return fetchCatalog(await getOwnerSalonSlug());
}

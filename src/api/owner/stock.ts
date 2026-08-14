import { api } from '../client';
import { getOwnerSalonSlug } from './tenant';
import { Product, StockMovement } from '../../types/owner';

export interface ListProductsParams {
  search?: string;
  inStock?: boolean;
}

/**
 * GET /:salonSlug/products — there is no plain `/products` list route; the only listing
 * endpoint is the public/slug-scoped storefront one (OptionalJwtGuard), same shape mutations
 * (`/products/:id` etc.) operate on. The tenant slug is resolved from real data by
 * `getOwnerSalonSlug()` — there is no hardcoded default.
 */
export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const salonSlug = await getOwnerSalonSlug();
  return api.get<Product[]>(`/${salonSlug}/products`, {
    search: params.search,
    inStock: params.inStock === undefined ? undefined : String(params.inStock),
  });
}

// No getProduct(id) — the backend exposes no `GET /products/:id`; only list/create/update/
// remove/restock/adjust/movements exist. Read a single product out of listProducts() instead.

export interface CreateProductDto {
  name: string;
  category?: string;
  price: number;
  cost?: number;
  stock?: number;
  lowStockAt?: number;
  supplier?: string;
  barcode?: string;
  notes?: string;
}

/** POST /products — owner/manager. */
export function createProduct(dto: CreateProductDto): Promise<Product> {
  return api.post<Product>('/products', dto);
}

export interface UpdateProductDto {
  name?: string;
  category?: string;
  price?: number;
  cost?: number;
  lowStockAt?: number;
  supplier?: string;
  barcode?: string;
  notes?: string;
  visibleLanding?: boolean;
  promo?: boolean;
  promoPercent?: number;
  promoLabel?: string;
  active?: boolean;
}

/** PATCH /products/:id — owner/manager. */
export function updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, dto);
}

/** DELETE /products/:id — owner/manager. Archives (soft-delete), does not hard-remove. */
export function removeProduct(id: string): Promise<Product> {
  return api.del<Product>(`/products/${id}`);
}

/** POST /products/:id/restock — owner/manager. `qty` must be > 0. */
export function restock(id: string, dto: { qty: number; note?: string }): Promise<Product> {
  return api.post<Product>(`/products/${id}/restock`, dto);
}

/** POST /products/:id/adjust — owner/manager. `delta` is signed (+in / -out). */
export function adjust(id: string, dto: { delta: number; note?: string }): Promise<Product> {
  return api.post<Product>(`/products/${id}/adjust`, dto);
}

/** GET /stock/movements — owner/manager, optionally filtered by product. */
export function movements(productId?: string): Promise<StockMovement[]> {
  return api.get<StockMovement[]>('/stock/movements', { productId });
}

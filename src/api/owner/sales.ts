import { api } from '../client';
import { BestSeller, Sale } from '../../types/owner';

export interface SaleItemDto {
  refId: string;
  qty: number;
}

export interface SaleDiscountDto {
  type: 'amount' | 'pct';
  value: number;
}

export interface CreateSaleDto {
  items: SaleItemDto[];
  discount?: SaleDiscountDto;
  method: 'cash' | 'card';
}

/** POST /sales — owner/manager/stylist. Decrements stock. */
export function create(dto: CreateSaleDto): Promise<Sale> {
  return api.post<Sale>('/sales', dto);
}

export interface ListSalesParams {
  period?: 'day' | 'week' | 'month';
  from?: string; // 'YYYY-MM-DD'
  to?: string;
}

/** GET /sales — owner/manager. */
export function list(params: ListSalesParams = {}): Promise<Sale[]> {
  return api.get<Sale[]>('/sales', { period: params.period, from: params.from, to: params.to });
}

export interface BestSellersParams {
  period?: 'day' | 'week' | 'month';
  limit?: number;
}

/** GET /sales/best-sellers — owner/manager. */
export function bestSellers(params: BestSellersParams = {}): Promise<BestSeller[]> {
  return api.get<BestSeller[]>('/sales/best-sellers', { period: params.period, limit: params.limit });
}

/** GET /sales/:id — owner/manager/stylist (a stylist can only fetch their own sale). */
export function get(id: string): Promise<Sale> {
  return api.get<Sale>(`/sales/${id}`);
}

/** DELETE /sales/:id — owner only. `restock` is a query flag, not a body field. */
export function voidSale(id: string, restock: boolean): Promise<Sale> {
  return api.del<Sale>(`/sales/${id}`, { restock: restock ? 'true' : 'false' });
}

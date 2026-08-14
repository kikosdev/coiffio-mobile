import { api } from '../client';
import { Order, OrderStatus } from '../../types/owner';

// GET /orders takes no query params server-side (OrdersController.list() has no @Query()) —
// status/from/to/search/page/limit filtering does not exist yet; filter client-side if needed.
/** GET /orders — owner/manager. Requires the `ecommerce` feature flag. */
export function list(): Promise<Order[]> {
  return api.get<Order[]>('/orders');
}

// No stats(), get(id), updatePaymentStatus(), or refund() — none of these exist server-side.
// The backoffice surface only has list() and updateStatus() below; a single order can only be
// looked up publicly, by its trackToken (GET /:salonSlug/track/order/:trackToken).

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

/** PATCH /orders/:id/status — owner/manager. Requires the `ecommerce` feature flag. */
export function updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
  return api.patch<Order>(`/orders/${id}/status`, dto);
}

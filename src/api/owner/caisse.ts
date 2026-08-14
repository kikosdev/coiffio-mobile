import { api } from '../client';
import { Expense, Payment, PaymentLine } from '../../types/owner';

export interface CaisseOverviewRaw {
  totals: { count: number; gross: number; tips: number; commission: number; byMethod: { cash: number; card: number } };
  byStylist: { stylistId: string; name: string; gross: number; tips: number; commission: number }[];
}

/** GET /caisse/overview — owner/manager. Salon-wide, today. */
export function overview(): Promise<CaisseOverviewRaw> {
  return api.get<CaisseOverviewRaw>('/caisse/overview');
}

export interface CreatePaymentDto {
  appointmentId?: string;
  stylistId: string;
  items: PaymentLine[];
  tip?: number;
  method: 'cash' | 'card';
}

/** POST /payments — owner/manager/stylist. */
export function pay(dto: CreatePaymentDto): Promise<Payment> {
  return api.post<Payment>('/payments', dto);
}

/** POST /payments/:id/refund — owner only. */
export function refund(paymentId: string): Promise<Payment> {
  return api.post<Payment>(`/payments/${paymentId}/refund`);
}

/** GET /expenses — owner/manager. */
export function listExpenses(): Promise<Expense[]> {
  return api.get<Expense[]>('/expenses');
}

export interface CreateExpenseDto {
  category: string;
  amount: number;
  date?: string; // 'YYYY-MM-DD', defaults server-side to today
  note?: string;
}

/** POST /expenses — owner/manager. */
export function createExpense(dto: CreateExpenseDto): Promise<Expense> {
  return api.post<Expense>('/expenses', dto);
}

export interface UpdateExpenseDto {
  category?: string;
  amount?: number;
  date?: string;
  note?: string;
}

/** PATCH /expenses/:id — owner/manager. */
export function updateExpense(id: string, dto: UpdateExpenseDto): Promise<Expense> {
  return api.patch<Expense>(`/expenses/${id}`, dto);
}

/** DELETE /expenses/:id — owner/manager. */
export function removeExpense(id: string): Promise<{ id: string }> {
  return api.del<{ id: string }>(`/expenses/${id}`);
}

/**
 * GET /reports/export.csv — owner/manager. Responds `Content-Type: text/csv`, not the usual
 * `{ data, message }` JSON envelope, so this goes through `api.getText` (raw body) instead of
 * `api.get` (which always runs the response through `JSON.parse` and would throw on CSV text).
 */
export function exportCsv(params: { period?: 'day' | 'week' | 'month' } = {}): Promise<string> {
  return api.getText('/reports/export.csv', { period: params.period });
}

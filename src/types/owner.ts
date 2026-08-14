// Shared domain types for the owner surface, mirrored 1:1 from salon-backend response shapes.
//
// Two response conventions coexist backend-side, and the field names below follow whichever
// convention the endpoint that returns them actually uses:
//   - shaped/service-crafted responses expose `id: string` (e.g. Staff, from TeamService.toPublic())
//   - raw Mongoose documents returned as-is expose `_id: string` and Date fields as ISO strings
//     (Appointment, Schedule, LeaveRequest, Product, StockMovement, Sale, Payment, Expense, Order)

export type StaffRole = 'manager' | 'stylist' | 'colorist';
export type StaffLevel = 'master' | 'senior' | 'apprentice';

/** GET /team item shape — TeamService.PublicStaff. */
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole | 'owner';
  color: string;
  isActive: boolean;
  acceptingBookings: boolean;
  level?: StaffLevel;
  capabilities?: string[];
  baseRate?: number;
  commissionPct?: number;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface TimeBreak {
  start: string; // 'HH:mm'
  end: string;
}

export interface WeeklyDay {
  day: number; // 0=dimanche … 6=samedi
  start: string; // 'HH:mm'
  end: string;
  breaks?: TimeBreak[];
}

export type OverrideType = 'off' | 'leave' | 'custom';

export interface Override {
  date: string; // 'YYYY-MM-DD'
  type: OverrideType;
  start?: string;
  end?: string;
  note?: string;
}

/** GET /schedule/:stylistId — raw Schedule document. */
export interface Schedule {
  _id: string;
  stylistId: string;
  weekly: WeeklyDay[];
  overrides: Override[];
}

// ─── Leave / swap requests ──────────────────────────────────────────────────

export type LeaveType = 'leave' | 'swap';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRange {
  from: string; // 'YYYY-MM-DD'
  to: string;
}

export interface LeaveConflict {
  appointmentId: string;
  start: string; // ISO
  end: string;
  clientId: string;
}

/** GET /leave-requests item — raw LeaveRequest document. */
export interface LeaveRequest {
  _id: string;
  stylistId: string;
  swapWithId?: string;
  type: LeaveType;
  range: LeaveRange;
  status: LeaveStatus;
  conflicts: LeaveConflict[];
  note: string;
  decidedBy?: string;
  decidedAt?: string;
}

// ─── Salon hours ────────────────────────────────────────────────────────────

/** GET /schedule/salon-hours item — settings.dto's BusinessHourDto, as stored on the salon. */
export interface BusinessHoursDay {
  day: number; // 0=dimanche … 6=samedi
  isOpen: boolean;
  start: string; // 'HH:mm'
  end: string;
}

/**
 * GET/PATCH /settings/salon — the backend's Salon document has more fields than this
 * (`landing`, `contact`, `hours`, `location`, `status`, storefront-only concerns unrelated to
 * the owner surface); this covers only what UpdateSalonDto can write and hours.ts needs back.
 */
export interface Salon {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  taxRate: number;
  businessHours: BusinessHoursDay[];
}

// ─── Appointments (backoffice, unhydrated) ─────────────────────────────────

export type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';
export type AppointmentSource = 'online' | 'walkin' | 'phone';

/**
 * GET /appointments, GET /appointments/:id — raw Appointment document. `stylistId`, `clientId`
 * and `services` are bare ids (never populated by these two endpoints) — no stylist/client
 * name is available from this shape alone.
 */
export interface Appointment {
  _id: string;
  salonId: string;
  locationId?: string;
  stylistId: string;
  clientId: string;
  groupId: string;
  services: string[];
  start: string; // ISO
  startDay: string; // 'YYYY-MM-DD'
  end: string; // ISO
  status: AppointmentStatus;
  source: AppointmentSource;
  price: number;
  checkInCode?: string;
  deposit?: number;
  checkedInAt?: string;
}

// ─── Stock ──────────────────────────────────────────────────────────────────

/** Raw Product document. */
export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAt: number;
  supplier: string;
  barcode: string;
  notes: string;
  visibleLanding: boolean;
  promo: boolean;
  promoPercent: number;
  promoLabel: string;
  active: boolean;
  salesCount: number;
}

export type StockMoveType = 'in' | 'out';

/** Raw StockMove document. */
export interface StockMovement {
  _id: string;
  productId: string;
  type: StockMoveType;
  qty: number;
  date: string; // ISO
  note: string;
  createdBy?: string;
}

// ─── Sales (retail POS) ─────────────────────────────────────────────────────

export interface SaleLine {
  refId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface SaleDiscount {
  type: 'amount' | 'pct';
  value: number;
  computed: number;
}

export type SaleSource = 'pos' | 'order';

/** Raw Sale document. */
export interface Sale {
  _id: string;
  source: SaleSource;
  items: SaleLine[];
  subtotal: number;
  discount?: SaleDiscount;
  total: number;
  method?: 'cash' | 'card';
  stylistId?: string;
  paymentId?: string;
  orderId?: string;
  date: string; // ISO
  voided: boolean;
  voidedBy?: string;
  voidedAt?: string;
  stockRestored: boolean;
}

export interface BestSeller {
  refId: string;
  name: string;
  qty: number;
  revenue: number;
}

// ─── Caisse / payments ──────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card';
export type PaymentLineKind = 'service' | 'product';

export interface PaymentLine {
  kind: PaymentLineKind;
  refId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

/** Raw Payment document. */
export interface Payment {
  _id: string;
  appointmentId?: string;
  stylistId: string;
  items: PaymentLine[];
  amount: number;
  tip: number;
  commission: number;
  method: PaymentMethod;
  date: string; // ISO
  refunded: boolean;
  refundedBy?: string;
  refundedAt?: string;
}

// ─── Expenses ───────────────────────────────────────────────────────────────

/** Raw Expense document. */
export interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  note: string;
  createdBy?: string;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled';

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

/** Raw Order document. */
export interface Order {
  _id: string;
  clientId?: string;
  cartToken?: string;
  items: OrderLine[];
  delivery: boolean;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  pickupAt?: string;
  trackToken: string;
  date: string; // ISO
}

// ─── Owner HQ aggregate (GET /owner/hq) — shared by the ownerSalon store ────

export type TeamStatus = 'active' | 'off';

export interface OwnerTeamMember {
  id: string;
  name: string;
  initials: string;
  isPro: boolean;
  status: TeamStatus;
  todayCount: number;
}

export interface MySalon {
  id: string;
  name: string;
  address: string;
  hoursToday: string | null; // null = closed today
  isOpen: boolean;
  todayRevenue: number;
  revenueChangePct: number;
  bookingCount: number;
  barbersOn: number;
  barbersTotal: number;
  occupancyPct: number;
  team: OwnerTeamMember[];
}

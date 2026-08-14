import { format as formatDateFns } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const SALON_TZ = 'Africa/Tunis';

/**
 * The backend labels the salon's Africa/Tunis wall-clock time as if it were UTC (see
 * salon-backend's `dateAtMin` convention — an appointment's/slot's ISO `start`/`end`
 * already has the Tunis hour/minute baked into its UTC fields, it is not a real UTC
 * instant). formatSalonDate/formatSalonTime/salonDateKey format exactly those backend
 * timestamps, so they must read the raw UTC components directly and never run them through
 * a real timezone conversion — that would double-apply the Tunis offset and show a time an
 * hour off from what was actually booked.
 */
function asBackendLocal(iso: string | Date): Date {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
}

export function formatSalonDate(iso: string | Date, pattern = 'EEE, MMM d'): string {
  return formatDateFns(asBackendLocal(iso), pattern);
}

export function formatSalonTime(iso: string | Date): string {
  return formatDateFns(asBackendLocal(iso), 'HH:mm');
}

export function salonDateKey(iso: string | Date): string {
  return formatDateFns(asBackendLocal(iso), 'yyyy-MM-dd');
}

/**
 * The current instant, re-labeled the same way the backend labels its own timestamps
 * (real Africa/Tunis wall-clock time, written into the UTC fields). Use this — never a raw
 * `new Date()`/`Date.now()` — when deriving "today" or comparing "now" against a backend
 * timestamp, so both sides are speaking the same (mislabeled-but-consistent) convention.
 */
export function nowAsSalonTime(): Date {
  const wallClock = formatInTimeZone(new Date(), SALON_TZ, "yyyy-MM-dd'T'HH:mm:ss.SSS");
  return new Date(`${wallClock}Z`);
}

/**
 * Formats a genuine local Date — e.g. straight off a native date/time picker — as
 * 'YYYY-MM-DD' using its own local calendar fields. The opposite direction from
 * salonDateKey()/formatSalonDate(), which decode the backend's mislabeled-UTC convention on
 * an already-received timestamp: never feed a backend ISO string through this, it would read
 * the wrong day near a UTC/Tunis midnight boundary. Use it to turn date-picker output into the
 * 'YYYY-MM-DD' string leave-request ranges and schedule overrides expect as input.
 */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inverse of localDateKey() — seeds a date picker from a stored 'YYYY-MM-DD' string, at local midnight. */
export function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Formats a genuine local Date's wall-clock time as 'HH:mm' — the picker-input counterpart to
 * localDateKey(), for turning time-picker output into the 'HH:mm' string weekly/salon hours
 * expect.
 */
export function localTimeKey(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Inverse of localTimeKey() — seeds a time picker from a stored 'HH:mm' string, applied to `base`'s date (defaults to now). */
export function parseLocalTimeKey(hhmm: string, base: Date = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

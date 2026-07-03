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

import { formatInTimeZone } from 'date-fns-tz';

const SALON_TZ = 'Africa/Tunis';

export function formatSalonDate(iso: string | Date, pattern = 'EEE, MMM d'): string {
  return formatInTimeZone(iso, SALON_TZ, pattern);
}

export function formatSalonTime(iso: string | Date): string {
  return formatInTimeZone(iso, SALON_TZ, 'HH:mm');
}

export function salonDateKey(iso: string | Date): string {
  return formatInTimeZone(iso, SALON_TZ, 'yyyy-MM-dd');
}

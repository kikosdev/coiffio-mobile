import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'bb_guest_bookings';

export interface GuestBookingRef {
  appointmentId: string;
  manageToken?: string;
  salonName: string;
  serviceName: string;
  barberName: string;
  start: string; // ISO
  price: number;
}

async function readAll(): Promise<GuestBookingRef[]> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GuestBookingRef[];
  } catch {
    return [];
  }
}

async function writeAll(refs: GuestBookingRef[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(refs));
}

export async function saveGuestBooking(ref: GuestBookingRef): Promise<void> {
  const refs = await readAll();
  await writeAll([ref, ...refs.filter((r) => r.appointmentId !== ref.appointmentId)]);
}

export async function listGuestBookings(): Promise<GuestBookingRef[]> {
  const refs = await readAll();
  return refs.slice().sort((a, b) => b.start.localeCompare(a.start));
}

export async function removeGuestBooking(appointmentId: string): Promise<void> {
  const refs = await readAll();
  await writeAll(refs.filter((r) => r.appointmentId !== appointmentId));
}

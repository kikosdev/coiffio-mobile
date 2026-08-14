import { create } from 'zustand';
import { api } from '../api/client';
import { formatSalonTime } from '../utils/salonTime';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string; // ISO
  read: boolean;
};

interface RawNotification {
  _id: string;
  type: string;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
  date: string;
  read: boolean;
}

// Per-user notifications (dispatch()) don't carry precomputed title/body — only the
// shared POS broadcast feed (dispatchOnce()) does — so derive readable text from `type`.
function describe(n: RawNotification): { title: string; body: string } {
  if (n.title || n.body) return { title: n.title ?? 'Notification', body: n.body ?? '' };

  const start = typeof n.payload?.start === 'string' ? n.payload.start : undefined;
  const time = start ? formatSalonTime(start) : null;

  switch (n.type) {
    case 'appointment.created':
      return { title: 'New appointment', body: time ? `Booked for ${time}` : '' };
    case 'appointment.cancelled':
      return { title: 'Appointment cancelled', body: time ? `Was booked for ${time}` : '' };
    case 'order.created':
      return { title: 'New order', body: '' };
    case 'stock.low':
      return { title: 'Low stock', body: '' };
    case 'stock.out':
      return { title: 'Out of stock', body: '' };
    case 'sale.recorded':
      return { title: 'Sale recorded', body: '' };
    case 'leave.requested':
      return { title: 'Leave request', body: '' };
    default:
      return { title: n.type, body: '' };
  }
}

interface NotificationsState {
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  /** True once a first fetch has completed — lets several mounted screens share one load. */
  loaded: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

/**
 * État PARTAGÉ des notifications. Auparavant dans un `useState` local à `useNotifications`,
 * ce qui donnait une copie indépendante par écran : un événement socket reçu à un endroit ne
 * pouvait pas mettre à jour le badge d'un autre écran (la tab bar garde `hq` monté sous
 * l'écran de notifications). Un store unique est ce qui rend le temps réel visible partout.
 */
export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: true,
  error: null,
  loaded: false,

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await api.get<RawNotification[]>('/notifications');
      set({
        notifications: raw.map((n) => ({ id: n._id, ...describe(n), date: n.date, read: n.read })),
        isLoading: false,
        loaded: true,
      });
    } catch {
      set({ error: 'Could not load notifications.', isLoading: false, loaded: true });
    }
  },

  markRead: async (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      // best-effort — leave the optimistic update in place
    }
  },

  markAllRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    try {
      await api.post('/notifications/read-all');
    } catch {
      // best-effort
    }
  },

  // Appelé à la déconnexion : les notifications d'un compte ne doivent jamais rester
  // visibles pour le suivant (même raison que resetOwnerTenantCache).
  reset: () => set({ notifications: [], isLoading: true, error: null, loaded: false }),
}));

export function selectUnreadCount(s: NotificationsState): number {
  return s.notifications.filter((n) => !n.read).length;
}

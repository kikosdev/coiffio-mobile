import { useEffect } from 'react';
import { useNotificationsStore, selectUnreadCount, type AppNotification } from '../stores/notifications';

export type { AppNotification };

/**
 * Lit l'état PARTAGÉ des notifications (src/stores/notifications.ts). L'API publique est
 * inchangée par rapport à la version `useState` locale — les écrans consommateurs
 * (`(owner)/hq.tsx`, `app/notifications.tsx`, `(staff)/today.tsx`) n'ont rien à modifier —
 * mais tous les montages partagent désormais la MÊME liste. C'est ce qui permet au badge de
 * `hq` de bouger quand `useNotificationsRealtime` reçoit un événement ailleurs.
 */
export function useNotifications() {
  const notifications = useNotificationsStore((s) => s.notifications);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const error = useNotificationsStore((s) => s.error);
  const loaded = useNotificationsStore((s) => s.loaded);
  const refresh = useNotificationsStore((s) => s.refresh);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unreadCount = useNotificationsStore(selectUnreadCount);

  // Un seul chargement même si plusieurs écrans montés utilisent ce hook (la tab bar garde
  // `hq` monté sous l'écran de notifications). `refresh()` reste disponible pour forcer.
  useEffect(() => {
    if (!loaded) void refresh();
  }, [loaded, refresh]);

  return { notifications, unreadCount, isLoading, error, refresh, markRead, markAllRead };
}

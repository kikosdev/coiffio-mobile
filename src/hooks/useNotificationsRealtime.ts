import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from '../api/client';
import { TOKEN_KEY, useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

/**
 * Événements qui doivent rafraîchir la liste. Les noms sont ceux ÉMIS par le backend
 * (`SOCKET_EVENTS`, `notifications.service.dispatch`) — un nom qui diverge ne provoque pas
 * d'erreur, juste un silence, donc ils sont alignés sur l'existant `useAppointmentRealtime`.
 */
const NOTIFICATION_EVENTS = ['appointment.created', 'appointment.cancelled'] as const;

/**
 * Socket PARTAGÉ, au niveau module — pas une connexion par écran.
 *
 * `useAppointmentRealtime` ouvre un socket par instance de hook : le monter sur `hq` ET sur
 * l'écran notifications donnerait deux connexions simultanées (la tab bar garde `hq` monté
 * sous l'écran poussé), donc deux refetch par booking. Ici le compteur de références garantit
 * une seule connexion tant qu'au moins un écran l'utilise, et une déconnexion propre au
 * dernier démontage.
 *
 * Les rooms sont jointes CÔTÉ SERVEUR depuis le JWT (`handleConnection`) — dont
 * `role:{tenantId}:owner`, scopée par tenant. Le client ne demande à rejoindre aucune room :
 * il ne reçoit donc que les événements de son propre salon.
 */
let socket: Socket | null = null;
let refCount = 0;
let coalesceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * UN booking produit PLUSIEURS événements pour un même owner : le dispatch `role:{tenant}:owner`
 * ET le broadcast `salon:{id}` (destiné au POS, mais l'owner est dans cette room aussi). Sans
 * regroupement, chacun déclencherait son propre refetch — pas de doublon à l'écran (la liste est
 * remplacée, pas concaténée), mais deux requêtes pour rien. Ce délai les fusionne en un seul
 * rafraîchissement, tout en restant imperceptible.
 */
const COALESCE_MS = 300;

function handleEvent(): void {
  if (coalesceTimer) clearTimeout(coalesceTimer);
  coalesceTimer = setTimeout(() => {
    coalesceTimer = null;
    // Refetch plutôt qu'insertion optimiste : le serveur reste la source de vérité pour l'id,
    // l'état `read` et l'ordre. Le payload socket est un signal, pas la donnée d'affichage.
    void useNotificationsStore.getState().refresh();
  }, COALESCE_MS);
}

function teardown(): void {
  if (coalesceTimer) {
    clearTimeout(coalesceTimer);
    coalesceTimer = null;
  }
  if (!socket) return;
  NOTIFICATION_EVENTS.forEach((event) => socket?.off(event, handleEvent));
  socket.disconnect();
  socket = null;
}

/**
 * À monter une fois par surface (ex. `(owner)/_layout.tsx`) — pas dans chaque écran.
 */
export function useNotificationsRealtime(): void {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (status !== 'ready' || !userId) return;

    let cancelled = false;
    refCount += 1;

    void SecureStore.getItemAsync(TOKEN_KEY).then((token) => {
      // `cancelled` couvre le démontage pendant la lecture asynchrone du token : sans lui, un
      // socket serait créé après coup et ne serait plus jamais fermé.
      if (cancelled || !token || socket) return;
      socket = io(API_ORIGIN, { transports: ['websocket'], auth: { token } });
      NOTIFICATION_EVENTS.forEach((event) => socket?.on(event, handleEvent));
    });

    return () => {
      cancelled = true;
      refCount -= 1;
      if (refCount <= 0) {
        refCount = 0;
        teardown();
      }
    };
    // `userId` en dépendance : un changement de compte doit rouvrir un socket avec le
    // nouveau token, donc de nouvelles rooms.
  }, [status, userId]);
}

/** Ferme le socket partagé — appelé à la déconnexion, avant que le token ne disparaisse. */
export function disconnectNotificationsSocket(): void {
  refCount = 0;
  teardown();
}

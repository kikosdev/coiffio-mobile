import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../api/client';
import { TOKEN_KEY, useAuthStore } from '../stores/auth';

const APPOINTMENT_EVENTS = ['appointment.created', 'appointment.cancelled'] as const;

export function useAppointmentRealtime(onAppointmentChange: () => void) {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (status !== 'ready' || !userId) return;

    let cancelled = false;
    let socket: ReturnType<typeof io> | null = null;

    SecureStore.getItemAsync(TOKEN_KEY).then((token) => {
      if (cancelled || !token) return;

      socket = io(API_ORIGIN, {
        transports: ['websocket'],
        auth: { token },
      });

      APPOINTMENT_EVENTS.forEach((event) => {
        socket?.on(event, onAppointmentChange);
      });
    });

    return () => {
      cancelled = true;
      if (socket) {
        APPOINTMENT_EVENTS.forEach((event) => socket?.off(event, onAppointmentChange));
        socket.disconnect();
      }
    };
  }, [onAppointmentChange, status, userId]);
}

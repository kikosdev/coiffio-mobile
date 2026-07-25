import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../stores/auth';
import { useProfile } from '../stores/profile';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId;
}

async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F4A62A',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const finalStatus = existing.status === 'granted'
    ? existing.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;

  const id = projectId();
  if (!id) {
    if (__DEV__) console.warn('[push] Missing Expo projectId; cannot register Expo push token.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId: id });
  return token.data;
}

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);
  const updateExpoPushToken = useAuthStore((s) => s.updateExpoPushToken);
  const notificationsEnabled = useProfile((s) => s.notificationsEnabled);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;

    if (!notificationsEnabled) {
      updateExpoPushToken(null).catch(() => {});
      return;
    }

    registerForPushToken()
      .then((token) => {
        if (!cancelled) return updateExpoPushToken(token);
      })
      .catch((err) => {
        if (__DEV__) console.warn('[push] registration failed', err);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, notificationsEnabled, updateExpoPushToken]);
}

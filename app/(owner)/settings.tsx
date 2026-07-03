import { Fragment } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ProfileScreen, Card, Row, T, Eyebrow, Divider } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { ChevronRight } from 'lucide-react-native';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

const SETTINGS_ITEMS = [
  { label: 'Salon hours & services', sub: 'Edit hours, add/remove services', onPress: undefined },
  { label: 'Commission rules',       sub: 'Set % per service per barber', onPress: undefined },
  { label: 'Notifications',          sub: 'Bookings, payments, reports', onPress: undefined },
  { label: 'Account & security',     sub: 'Change password', onPress: () => router.push('/(owner)/change-password' as any) },
];

export default function OwnerSettings() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <ProfileScreen
      name={user?.name ?? ''}
      initials={initials(user?.name ?? '')}
      subtitle="Owner · BLACK BOX HQ"
    >
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Salon Settings</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl }}>
        {SETTINGS_ITEMS.map((item, i) => (
          <Fragment key={item.label}>
            <Pressable
              onPress={item.onPress}
              disabled={!item.onPress}
              style={({ pressed }) => ({ opacity: pressed && item.onPress ? 0.75 : 1 })}
            >
              <Row justify="space-between" style={{ padding: t.spacing.lg }}>
                <T variant="body" style={{ flex: 1 }}>{item.label}</T>
                <ChevronRight size={18} color={t.color.textMuted} />
              </Row>
            </Pressable>
            {i < SETTINGS_ITEMS.length - 1 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
          </Fragment>
        ))}
      </Card>
    </ProfileScreen>
  );
}

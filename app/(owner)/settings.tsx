import { Fragment, useState } from 'react';
import { Alert, Linking, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ProfileScreen, Card, Row, T, Eyebrow, Divider, ConfirmDialog } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { api, ApiError } from '../../src/api/client';
import { ChevronRight, Shield, Trash2 } from 'lucide-react-native';

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
  const deactivateAccount = useAuthStore((s) => s.deactivateAccount);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleOpenPrivacy = async () => {
    try {
      const config = await api.get<{ privacyPolicyUrl: string }>('/config/public');
      await Linking.openURL(config.privacyPolicyUrl);
    } catch {
      await Linking.openURL('https://coiffio.com/privacy');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setShowDeleteConfirm(false);
      await deactivateAccount();
      router.replace('/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to delete account.';
      Alert.alert('Delete account', message);
    }
  };

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

      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxl, marginBottom: 10 }}>Legal</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl }}>
        <Pressable onPress={handleOpenPrivacy} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Row justify="space-between" style={{ padding: t.spacing.lg }}>
            <Row gap={t.spacing.md} style={{ flex: 1 }}>
              <Shield size={18} color={t.color.goldWarm} />
              <T variant="body" style={{ flex: 1 }}>Politique de confidentialité</T>
            </Row>
            <ChevronRight size={18} color={t.color.textMuted} />
          </Row>
        </Pressable>
        <Divider style={{ marginHorizontal: t.spacing.lg }} />
        <Pressable onPress={() => setShowDeleteConfirm(true)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Row justify="space-between" style={{ padding: t.spacing.lg }}>
            <Row gap={t.spacing.md} style={{ flex: 1 }}>
              <Trash2 size={18} color={t.color.danger} />
              <T variant="body" style={{ flex: 1, color: t.color.danger }}>Delete account</T>
            </Row>
            <ChevronRight size={18} color={t.color.textMuted} />
          </Row>
        </Pressable>
      </Card>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete owner account?"
        message="This will deactivate your owner account. If you are the only active owner, the backend will block it until ownership is transferred."
        confirmLabel="Delete account"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </ProfileScreen>
  );
}

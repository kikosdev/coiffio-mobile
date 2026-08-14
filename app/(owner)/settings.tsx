import { Fragment, useState } from 'react';
import { Alert, Linking, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ProfileScreen, Card, Row, T, Eyebrow, Divider, ConfirmDialog, Badge } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { api, ApiError } from '../../src/api/client';
import { ChevronRight, Shield, Trash2, LogOut, UserRound } from 'lucide-react-native';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

interface SettingsItem {
  label: string;
  sub: string;
  onPress?: () => void;
}

// "Salon hours & services" now has a real destination (hours/salon.tsx, built later in the
// owner series) — wired below. Commission rules and a dedicated Notifications-preferences
// screen have no built destination anywhere in this app; left disabled with a "Bientôt" badge
// instead of an identical-looking-but-dead row (the mute-CTA these three used to be).
const SETTINGS_ITEMS: SettingsItem[] = [
  { label: 'Salon details',      sub: 'Name, address & contact',       onPress: () => router.push('/(owner)/salon-details' as never) },
  { label: 'Salon hours',        sub: 'Edit opening hours',            onPress: () => router.push('/(owner)/hours/salon' as never) },
  { label: 'Commission rules',   sub: 'Set % per service per barber' },
  { label: 'Notifications',      sub: 'Bookings, payments, reports' },
  { label: 'Account & security', sub: 'Change password',               onPress: () => router.push('/(owner)/change-password' as never) },
];

export default function OwnerSettings() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deactivateAccount = useAuthStore((s) => s.deactivateAccount);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // La surface owner n'avait AUCUNE déconnexion : la seule sortie de compte offerte était
  // "Delete account", qui désactive le compte. Deux actions de gravité opposée — d'où une
  // carte distincte, un libellé neutre et une modale non destructive, loin du bloc Legal.
  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(); // purge aussi le cache tenant owner (voir stores/auth.ts)
    router.replace('/');
  };

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
              style={({ pressed }) => ({ opacity: item.onPress ? (pressed ? 0.75 : 1) : 0.5 })}
            >
              <Row justify="space-between" style={{ padding: t.spacing.lg }}>
                <T variant="body" style={{ flex: 1 }}>{item.label}</T>
                {item.onPress ? (
                  <ChevronRight size={18} color={t.color.textMuted} />
                ) : (
                  <Badge variant="neutral">Bientôt</Badge>
                )}
              </Row>
            </Pressable>
            {i < SETTINGS_ITEMS.length - 1 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
          </Fragment>
        ))}
      </Card>

      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxl, marginBottom: 10 }}>Account</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl }}>
        <Pressable onPress={() => router.push('/(owner)/profile' as never)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Row justify="space-between" style={{ padding: t.spacing.lg }}>
            <Row gap={t.spacing.md} style={{ flex: 1 }}>
              <UserRound size={18} color={t.color.goldWarm} />
              <T variant="body" style={{ flex: 1 }}>My profile</T>
            </Row>
            <ChevronRight size={18} color={t.color.textMuted} />
          </Row>
        </Pressable>
        <Divider style={{ marginHorizontal: t.spacing.lg }} />
        <Pressable onPress={() => setShowLogoutConfirm(true)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <Row justify="space-between" style={{ padding: t.spacing.lg }}>
            <Row gap={t.spacing.md} style={{ flex: 1 }}>
              <LogOut size={18} color={t.color.textSecondary} />
              <T variant="body" style={{ flex: 1 }}>Log out</T>
            </Row>
            <ChevronRight size={18} color={t.color.textMuted} />
          </Row>
        </Pressable>
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
        visible={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to manage your salon."
        confirmLabel="Log out"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

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

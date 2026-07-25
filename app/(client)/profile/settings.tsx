import { useState } from 'react';
import {
  Alert, Linking, View, Text, ScrollView, Pressable, Switch, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { ConfirmDialog } from '../../../src/components/kit';
import { useProfile } from '../../../src/stores/profile';
import { useAuthStore } from '../../../src/stores/auth';
import { api, ApiError } from '../../../src/api/client';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} /><Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={11} width={16} height={9} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3.5 2" />
    </Svg>
  );
}

function LogOutIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />
      <Path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[styles.sectionLabel, { color: t.color.textMuted }]}>{children}</Text>;
}

function SettingsRow({
  icon, label, sub, onPress, showDivider, rightSlot,
}: {
  icon: React.ReactNode; label: string; sub?: string; onPress?: () => void;
  showDivider?: boolean; rightSlot?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderTopWidth: 1, borderTopColor: t.color.borderSubtle },
        { opacity: pressed && onPress ? 0.75 : 1 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowLabel, { color: t.color.textPrimary }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: t.color.textMuted }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {rightSlot ?? (onPress ? <ChevronRight color={t.color.textMuted} /> : null)}
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deactivateAccount = useAuthStore((s) => s.deactivateAccount);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
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
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <Text style={[styles.accountHint, { color: t.color.textMuted }]}>
            Signed in as {user.email || user.phone}
          </Text>
        ) : null}

        {/* ── ACCOUNT ── */}
        <SectionLabel>ACCOUNT</SectionLabel>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <SettingsRow
            icon={<UserIcon color={t.color.goldWarm} />}
            label="Update information"
            sub="Name, email"
            onPress={() => router.push('/(client)/profile/personal-info')}
          />
          <SettingsRow
            icon={<LockIcon color={t.color.goldWarm} />}
            label="Change password"
            showDivider
            onPress={() => router.push('/(client)/profile/change-password')}
          />
        </View>

        {/* ── NOTIFICATIONS ── */}
        <SectionLabel>NOTIFICATIONS</SectionLabel>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <SettingsRow
            icon={<BellIcon color={t.color.goldWarm} />}
            label="Push notifications"
            sub="Booking updates & reminders"
            rightSlot={
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={profile.setNotificationsEnabled}
                trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
                thumbColor={t.color.onGold}
                ios_backgroundColor={t.color.surfaceElevated}
              />
            }
          />
        </View>

        {/* ── ACTIVITY ── */}
        <SectionLabel>ACTIVITY</SectionLabel>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <SettingsRow
            icon={<ClockIcon color={t.color.goldWarm} />}
            label="Appointment history"
            sub="All your past visits"
            onPress={() => router.push({ pathname: '/(client)/appointments', params: { tab: 'history' } })}
          />
        </View>

        {/* ── LEGAL ── */}
        <SectionLabel>LEGAL</SectionLabel>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <SettingsRow
            icon={<ShieldIcon color={t.color.goldWarm} />}
            label="Politique de confidentialité"
            onPress={handleOpenPrivacy}
          />
          <SettingsRow
            icon={<TrashIcon color={t.color.danger} />}
            label="Delete account"
            sub="Deactivate this account"
            showDivider
            onPress={() => setShowDeleteConfirm(true)}
          />
        </View>

        {/* ── Log out ── */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: t.color.surfaceCard, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <LogOutIcon color={t.color.danger} />
          <Text style={[styles.logoutText, { color: t.color.danger }]}>Log out</Text>
        </Pressable>
      </ScrollView>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out?"
        message="You can sign back in any time."
        confirmLabel="Log out"
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete account?"
        message="This will deactivate your account and sign you out."
        confirmLabel="Delete account"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:        { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topTitle:    { fontSize: 15, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 12 },

  accountHint: { fontSize: 12, fontWeight: '500', marginBottom: 20 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  card:        { borderRadius: 18, overflow: 'hidden', marginBottom: 24 },

  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  iconBox:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:    { fontSize: 14, fontWeight: '600' },
  rowSub:      { fontSize: 11, fontWeight: '500', marginTop: 2 },

  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 16 },
  logoutText:  { fontSize: 14, fontWeight: '700' },
});

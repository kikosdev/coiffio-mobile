import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ConfirmDialog } from '../../src/components/kit';
import { useAuthStore } from '../../src/stores/auth';

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
function LogOutIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={[styles.sectionLabel, { color: t.color.textMuted }]}>{children}</Text>;
}

function SettingsRow({
  icon, label, sub, onPress, showDivider,
}: {
  icon: React.ReactNode; label: string; sub?: string; onPress: () => void; showDivider?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderTopWidth: 1, borderTopColor: t.color.borderSubtle },
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowLabel, { color: t.color.textPrimary }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: t.color.textMuted }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <ChevronRight color={t.color.textMuted} />
    </Pressable>
  );
}

export default function StaffSettingsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
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

        <SectionLabel>ACCOUNT</SectionLabel>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <SettingsRow
            icon={<UserIcon color={t.color.goldWarm} />}
            label="Update information"
            sub="Name, email, phone"
            onPress={() => router.push('/(staff)/personal-info' as any)}
          />
          <SettingsRow
            icon={<LockIcon color={t.color.goldWarm} />}
            label="Change password"
            showDivider
            onPress={() => router.push('/(staff)/change-password' as any)}
          />
        </View>

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
    </View>
  );
}

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

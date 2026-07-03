import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { ConfirmDialog } from '../../../src/components/kit';
import { useProfile } from '../../../src/stores/profile';
import { useAuthStore } from '../../../src/stores/auth';

// ── Icons ─────────────────────────────────────────────────────────────────────

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
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

function CreditCardIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={5} width={20} height={14} rx={3} /><Path d="M2 10h20" />
    </Svg>
  );
}

function HeartIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" />
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

function LogOutIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    profile.fetchProfile();
  }, []);

  const initials = profile.fullName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  // Local-only: picks a real photo from the device library, same as Personal Information's
  // "Change photo" — there's no backend avatar storage yet, so it doesn't sync across devices.
  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      profile.setAvatar(result.assets[0].uri);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.wordmark, { color: t.color.textPrimary }]}>PROFILE</Text>
        <Pressable hitSlop={12} onPress={() => router.push('/(client)/profile/settings')}>
          <GearIcon color={t.color.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity ── */}
        <View style={styles.identity}>
          <Pressable style={styles.avatarWrap} onPress={handleChangePhoto}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={[styles.avatar, { borderRadius: 44 }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: t.color.surfaceElevated }]}>
                <Text style={[styles.initials, { color: t.color.textPrimary }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: t.color.gold, borderColor: t.color.bgBase }]}>
              <PencilIcon color={t.color.onGold} />
            </View>
          </Pressable>
          <Text style={[styles.name, { color: t.color.textPrimary }]}>{profile.fullName}</Text>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{profile.visits}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Visits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.gold }]}>{profile.upcoming}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Upcoming</Text>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={[styles.menu, { backgroundColor: t.color.surfaceCard }]}>
          {/* Personal information */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push('/(client)/profile/personal-info')}
          >
            <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>
              <UserIcon color={t.color.goldWarm} />
            </View>
            <Text style={[styles.menuLabel, { color: t.color.textPrimary }]}>Personal information</Text>
            <ChevronRight color={t.color.textMuted} />
          </Pressable>

          {/* Payment methods */}
          <View style={[styles.menuRow, styles.menuDivider, { borderTopColor: t.color.borderSubtle }]}>
            <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>
              <CreditCardIcon color={t.color.goldWarm} />
            </View>
            <Text style={[styles.menuLabel, { color: t.color.textPrimary }]}>Payment methods</Text>
            <View style={[styles.soonChip, { backgroundColor: t.color.surfaceElevated }]}>
              <Text style={[styles.soonText, { color: t.color.textMuted }]}>Soon</Text>
            </View>
          </View>

          {/* Saved barbers */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, styles.menuDivider, { borderTopColor: t.color.borderSubtle, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => Alert.alert('Saved barbers', 'Favourites management coming in a future update.')}
          >
            <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>
              <HeartIcon color={t.color.goldWarm} />
            </View>
            <Text style={[styles.menuLabel, { color: t.color.textPrimary }]}>Saved barbers</Text>
            <ChevronRight color={t.color.textMuted} />
          </Pressable>

          {/* Settings (update info, password, notifications, history) */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, styles.menuDivider, { borderTopColor: t.color.borderSubtle, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => router.push('/(client)/profile/settings')}
          >
            <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>
              <GearIcon color={t.color.goldWarm} />
            </View>
            <Text style={[styles.menuLabel, { color: t.color.textPrimary }]}>Settings</Text>
            <ChevronRight color={t.color.textMuted} />
          </Pressable>

          {/* Log out */}
          <Pressable
            style={({ pressed }) => [styles.menuRow, styles.menuDivider, { borderTopColor: t.color.borderSubtle, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <View style={[styles.iconBox, { backgroundColor: t.color.surfaceInput }]}>
              <LogOutIcon color={t.color.danger} />
            </View>
            <Text style={[styles.menuLabel, { color: t.color.danger }]}>Log out</Text>
          </Pressable>
        </View>
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
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  wordmark:    { fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  scrollContent: { paddingTop: 4 },

  // Identity
  identity:    { alignItems: 'center', paddingTop: 22, paddingBottom: 4 },
  avatarWrap:  { position: 'relative' },
  avatar:      { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  initials:    { fontSize: 28, fontWeight: '800' },
  editBadge:   { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 21, fontWeight: '800', marginTop: 14 },
  tierPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  tierText:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // Stats
  statsRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginTop: 24 },
  statCard:    { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  statValue:   { fontSize: 21, fontWeight: '800' },
  statLabel:   { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Menu
  menu:        { marginHorizontal: 22, marginTop: 24, borderRadius: 18, overflow: 'hidden' },
  menuRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  menuDivider: { borderTopWidth: 1 },
  iconBox:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel:   { flex: 1, fontSize: 14, fontWeight: '600' },
  soonChip:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  soonText:    { fontSize: 11, fontWeight: '700' },
});

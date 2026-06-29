import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useMyProfile } from '../../src/hooks/staff/useMyProfile';
import { SurfaceSwitcher } from '../../src/components/kit';

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Svg>
  );
}
function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}
function StarIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
    </Svg>
  );
}
function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={11} width={18} height={11} rx={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export default function StaffProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();

  if (!profile) return null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: t.color.bgBase }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Cover placeholder ── */}
      <View style={[styles.cover, { backgroundColor: t.color.surfaceElevated }]}>
        <View style={[styles.coverOverlay, { backgroundColor: 'rgba(0,0,0,0.50)' }]} />
        {/* Top row inside cover */}
        <View style={[styles.coverTopRow, { paddingTop: insets.top + 6 }]}>
          <Text style={[styles.coverTitle, { color: t.color.textPrimary }]}>My profile</Text>
          <Pressable
            style={[styles.gearBtn, { backgroundColor: 'rgba(0,0,0,0.40)' }]}
            onPress={() => Alert.alert('Settings', 'Settings coming soon.')}
            hitSlop={10}
          >
            <GearIcon color={t.color.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* ── Avatar + name ── */}
      <View style={[styles.identityRow, { paddingHorizontal: 22 }]}>
        <View style={[styles.avatar, { backgroundColor: t.color.gold, borderColor: t.color.bgBase }]}>
          <Text style={[styles.avatarTxt, { color: t.color.onGold }]}>{profile.initials}</Text>
        </View>
        <View style={{ paddingBottom: 6, flex: 1 }}>
          <Text style={[styles.name, { color: t.color.textPrimary }]}>{profile.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <StarIcon color={t.color.gold} size={13} />
              <Text style={[styles.rating, { color: t.color.textPrimary }]}>{profile.rating}</Text>
            </View>
            {profile.isPro && (
              <Text style={[styles.proChip, { color: t.color.gold }]}>PRO BARBER</Text>
            )}
          </View>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{profile.stats.clients}</Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Clients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.textPrimary }]}>
            {profile.stats.cuts >= 1000 ? `${(profile.stats.cuts / 1000).toFixed(1)}k` : profile.stats.cuts}
          </Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Cuts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.textPrimary }]}>
            {profile.stats.yearsExp}<Text style={[styles.statUnit, { color: t.color.textMuted }]}>y</Text>
          </Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Experience</Text>
        </View>
      </View>

      {/* ── Quick link: Services ── */}
      <Pressable
        style={({ pressed }) => [styles.menuRow, { backgroundColor: t.color.surfaceCard, opacity: pressed ? 0.8 : 1 }]}
        onPress={() => router.push('/(staff)/services' as any)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuLabel, { color: t.color.textPrimary }]}>My services</Text>
          <Text style={[styles.menuSub, { color: t.color.textMuted }]}>Manage menu & accepting-bookings</Text>
        </View>
        <ChevronRight color={t.color.textMuted} />
      </Pressable>

      {/* ── Portfolio teaser (V2) ── */}
      <View style={[styles.portfolioSection]}>
        <View style={styles.portfolioHeader}>
          <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>PORTFOLIO</Text>
          <View style={[styles.soonBadge, { backgroundColor: t.color.surfaceElevated }]}>
            <Text style={[styles.soonTxt, { color: t.color.textMuted }]}>V2</Text>
          </View>
        </View>
        <View style={[styles.portfolioGrid]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.portfolioCell, { backgroundColor: t.color.surfaceElevated }]}>
              <LockIcon color={t.color.borderStrong} />
            </View>
          ))}
        </View>
        <Text style={[styles.portfolioNote, { color: t.color.textMuted }]}>
          Portfolio upload coming in V2.
        </Text>
      </View>

      <SurfaceSwitcher />
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },

  cover:          { height: 150, position: 'relative' },
  coverOverlay:   { position: 'absolute', inset: 0 } as any,
  coverTopRow:    { position: 'absolute', left: 22, right: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coverTitle:     { fontSize: 13, fontWeight: '700' },
  gearBtn:        { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  identityRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: -44, marginBottom: 16 },
  avatar:         { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  avatarTxt:      { fontSize: 24, fontWeight: '800' },
  name:           { fontSize: 19, fontWeight: '800' },
  rating:         { fontSize: 12, fontWeight: '600' },
  proChip:        { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 16 },
  statCard:       { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue:      { fontSize: 18, fontWeight: '800' },
  statUnit:       { fontSize: 11, fontWeight: '600' },
  statLabel:      { fontSize: 10, fontWeight: '600', marginTop: 2 },

  menuRow:        { marginHorizontal: 22, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  menuLabel:      { fontSize: 14, fontWeight: '700' },
  menuSub:        { fontSize: 11, fontWeight: '500', marginTop: 2 },

  portfolioSection:{ paddingHorizontal: 22 },
  portfolioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eyebrow:         { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  soonBadge:       { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  soonTxt:         { fontSize: 10, fontWeight: '800' },
  portfolioGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portfolioCell:   { width: '31%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  portfolioNote:   { fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 12 },
});

import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { dummyLastVisit, dummyNearbySalons } from '../../src/data/dummy';

// ── Icon helpers ─────────────────────────────────────────────────────────────

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

function MenuIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M4 9h16M4 15h16" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Path d="M21 21l-4-4" />
    </Svg>
  );
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
    </Svg>
  );
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <Circle cx={12} cy={10} r={2.3} />
    </Svg>
  );
}

function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
      <Path d="M9 4v13M15 7v13" />
    </Svg>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function ClientHome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bgBase }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.wordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
        <View style={styles.headerActions}>
          <BellIcon color={t.color.textPrimary} />
          <MenuIcon color={t.color.textPrimary} />
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingName, { color: t.color.textPrimary }]}>Hey, Michael 👋</Text>
        <Text style={[styles.greetingDate, { color: t.color.textSecondary }]}>{dateLabel}</Text>
      </View>

      {/* Search bar */}
      <Pressable
        onPress={() => router.push('/(client)/search')}
        style={[styles.searchBar, { backgroundColor: t.color.surfaceInput }]}
      >
        <SearchIcon color={t.color.textMuted} />
        <Text style={[styles.searchPlaceholder, { color: t.color.textMuted }]}>
          Search barbers, services…
        </Text>
      </Pressable>

      {/* ── LATEST VISIT ── */}
      <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>LATEST VISIT</Text>
      <View style={[styles.latestCard, { backgroundColor: t.color.surfaceInput }]}>
        <View style={[styles.barberAvatar, { backgroundColor: t.color.borderSubtle }]}>
          <Text style={[styles.avatarInitials, { color: t.color.textSecondary }]}>
            {dummyLastVisit.initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.barberName, { color: t.color.textPrimary }]}>
              {dummyLastVisit.barberName}
            </Text>
            {dummyLastVisit.isPro && (
              <View style={[styles.proBadge, { backgroundColor: t.color.gold }]}>
                <Text style={[styles.proBadgeText, { color: t.color.onGold }]}>PRO</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <StarIcon size={13} color={t.color.gold} />
            <Text style={[styles.ratingText, { color: t.color.textSecondary }]}>
              {dummyLastVisit.rating} ({dummyLastVisit.reviewCount})
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.bookBtn, { backgroundColor: t.color.bgSunken, borderColor: t.color.borderStrong }]}
        >
          <Text style={[styles.bookBtnText, { color: t.color.textPrimary }]}>Book</Text>
        </Pressable>
      </View>

      {/* ── NEARBY BARBERSHOP ── */}
      <View style={styles.nearbyHeader}>
        <Text style={[styles.eyebrow, styles.eyebrowInline, { color: t.color.textMuted }]}>
          NEARBY BARBERSHOP
        </Text>
        <Pressable
          onPress={() => router.push('/(client)/choose-location')}
          style={({ pressed }) => [
            styles.mapBtn,
            {
              backgroundColor: pressed ? t.color.surfaceCard : t.color.surfaceElevated,
              borderColor: t.color.tabBorder,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <MapIcon color={t.color.gold} />
          <Text style={[styles.mapBtnText, { color: t.color.textSecondary }]}>Map</Text>
        </Pressable>
      </View>
      <View style={styles.nearbyRow}>
        {dummyNearbySalons.map((salon) => (
          <View key={salon.id} style={[styles.nearbyCard, { backgroundColor: t.color.surfaceCard }]}>
            {/* Image placeholder */}
            <View style={styles.nearbyImgWrap}>
              <View style={[styles.nearbyImg, { backgroundColor: t.color.borderSubtle }]} />
              <View style={styles.ratingBadge}>
                <StarIcon size={11} color={t.color.gold} />
                <Text style={[styles.ratingBadgeText, { color: t.color.textPrimary }]}>
                  {salon.rating}
                </Text>
              </View>
            </View>
            {/* Card content */}
            <View style={styles.nearbyContent}>
              <Text style={[styles.openNow, { color: t.color.gold }]}>OPEN NOW</Text>
              <Text style={[styles.nearbyName, { color: t.color.textPrimary }]}>{salon.name}</Text>
              <View style={styles.distanceRow}>
                <MapPinIcon color={t.color.textSecondary} />
                <Text style={[styles.distanceText, { color: t.color.textSecondary }]}>
                  {salon.distanceKm} km
                </Text>
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/(client)/salon/[id]', params: { id: salon.id } })}
                style={[styles.bookNowBtn, { backgroundColor: t.color.textPrimary }]}
              >
                <Text style={[styles.bookNowText, { color: t.color.bgBase }]}>Book Now</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 4 },
  wordmark:        { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },
  headerActions:   { flexDirection: 'row', gap: 14, alignItems: 'center' },

  // Greeting
  greeting:        { paddingHorizontal: 22, paddingTop: 14 },
  greetingName:    { fontSize: 27, fontWeight: '800', lineHeight: 29 },
  greetingDate:    { fontSize: 13, fontWeight: '500', marginTop: 5 },

  // Search
  searchBar:       { marginTop: 14, marginHorizontal: 22, height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  searchPlaceholder: { fontSize: 14, fontWeight: '500' },

  // Section eyebrow
  eyebrow:         { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6, fontSize: 11, fontWeight: '800', letterSpacing: 1.54 },

  // Latest visit card
  latestCard:      { marginHorizontal: 22, borderRadius: 20, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  barberAvatar:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitials:  { fontSize: 14, fontWeight: '700' },
  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 7 },
  barberName:      { fontSize: 15, fontWeight: '700' },
  proBadge:        { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  proBadgeText:    { fontSize: 9, fontWeight: '800', letterSpacing: 0.36 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  ratingText:      { fontSize: 12, fontWeight: '600' },
  bookBtn:         { borderWidth: 1, borderRadius: 100, paddingHorizontal: 18, paddingVertical: 9, flexShrink: 0 },
  bookBtnText:     { fontSize: 13, fontWeight: '700' },

  // Nearby
  nearbyRow:       { flexDirection: 'row', gap: 12, paddingHorizontal: 22 },
  nearbyCard:      { flex: 1, borderRadius: 20, overflow: 'hidden' },
  nearbyImgWrap:   { padding: 8, paddingBottom: 0 },
  nearbyImg:       { width: '100%', height: 98, borderRadius: 14 },
  ratingBadge:     { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBadgeText: { fontSize: 11, fontWeight: '700' },
  nearbyContent:   { padding: 10, paddingHorizontal: 12, paddingBottom: 12 },
  openNow:         { fontSize: 9, fontWeight: '800', letterSpacing: 0.36 },
  nearbyName:      { fontSize: 14, fontWeight: '700', marginTop: 3 },
  distanceRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distanceText:    { fontSize: 11, fontWeight: '600' },
  bookNowBtn:      { borderRadius: 100, alignItems: 'center', paddingVertical: 9, marginTop: 10 },
  bookNowText:     { fontSize: 12, fontWeight: '700' },

  // Nearby header row
  nearbyHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 },
  eyebrowInline:   { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0 },
  mapBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  mapBtnText:      { fontSize: 12.5, fontWeight: '600' },
});

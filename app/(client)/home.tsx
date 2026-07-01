import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { useSettingsStore, RADIUS_OPTIONS_KM } from '../../src/stores/settings';
import { useHomeStore } from '../../src/stores/home';
import { NEARBY_THRESHOLD } from '../../src/config';

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

  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? 'Guest';

  const { status: locStatus, coords, request: requestLocation } = useUserLocation();
  const searchRadiusKm = useSettingsStore((s) => s.searchRadiusKm);
  const setSearchRadiusKm = useSettingsStore((s) => s.setSearchRadiusKm);

  const {
    latestVisit, loadingLatest, nearby, loadingNearby,
    salons, loadingSalons, salonsError, fetchLatestVisit, fetchNearby, fetchSalons,
  } = useHomeStore();

  useEffect(() => {
    fetchLatestVisit();
  }, [user, fetchLatestVisit]);

  // Decides the list-vs-Nearby switch below — Nearby's own geoloc fetch stays untouched.
  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  useEffect(() => {
    if (locStatus === 'granted' && coords) {
      fetchNearby(coords.lat, coords.lng, searchRadiusKm);
    }
  }, [locStatus, coords, searchRadiusKm, fetchNearby]);

  // NEARBY_THRESHOLD (SKILL_home_list_all_salons): while few salons exist, list them all —
  // no location friction. Nearby's geoloc UX re-activates automatically past the threshold.
  const useNearbyMode = !loadingSalons && salons.length > NEARBY_THRESHOLD;

  const barberInitials = latestVisit
    ? latestVisit.barber.name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
    : '';

  function handleBookBarber() {
    if (!latestVisit?.barber.id) return;
    router.push({ pathname: '/(client)/barber/[id]', params: { id: latestVisit.barber.id } });
  }

  function handleOpenSalon(salonId: string) {
    router.push({ pathname: '/(client)/salon/[id]', params: { id: salonId } });
  }

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
        <Text style={[styles.greetingName, { color: t.color.textPrimary }]}>Hey, {firstName} 👋</Text>
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

      {/* ── LATEST VISIT (hidden for guests) ── */}
      {user && (
        <>
          <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>LATEST VISIT</Text>
          {loadingLatest ? (
            <View style={[styles.latestCard, styles.latestSkeleton, { backgroundColor: t.color.surfaceInput }]} />
          ) : latestVisit ? (
            <View style={[styles.latestCard, { backgroundColor: t.color.surfaceInput }]}>
              <View style={[styles.barberAvatar, { backgroundColor: t.color.borderSubtle }]}>
                <Text style={[styles.avatarInitials, { color: t.color.textSecondary }]}>
                  {barberInitials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.barberName, { color: t.color.textPrimary }]}>
                    {latestVisit.barber.name}
                  </Text>
                  {latestVisit.barber.isPro && (
                    <View style={[styles.proBadge, { backgroundColor: t.color.gold }]}>
                      <Text style={[styles.proBadgeText, { color: t.color.onGold }]}>PRO</Text>
                    </View>
                  )}
                </View>
                {latestVisit.barber.rating != null && (
                  <View style={styles.ratingRow}>
                    <StarIcon size={13} color={t.color.gold} />
                    <Text style={[styles.ratingText, { color: t.color.textSecondary }]}>
                      {latestVisit.barber.rating.toFixed(1)} ({latestVisit.barber.reviewCount ?? 0})
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={handleBookBarber}
                style={[styles.bookBtn, { backgroundColor: t.color.bgSunken, borderColor: t.color.borderStrong }]}
              >
                <Text style={[styles.bookBtnText, { color: t.color.textPrimary }]}>Book</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.latestCard, styles.emptyCard, { backgroundColor: t.color.surfaceInput }]}>
              <Text style={[styles.emptyText, { color: t.color.textSecondary }]}>
                No visits yet — book your first appointment!
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── BARBERSHOPS / NEARBY BARBERSHOP ── */}
      <View style={styles.nearbyHeader}>
        <Text style={[styles.eyebrow, styles.eyebrowInline, { color: t.color.textMuted }]}>
          {useNearbyMode ? 'NEARBY BARBERSHOP' : 'BARBERSHOPS'}
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

      {useNearbyMode && (
      <>
      {locStatus === 'granted' && (
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS_KM.map((km) => {
            const active = km === searchRadiusKm;
            return (
              <Pressable
                key={km}
                onPress={() => setSearchRadiusKm(km)}
                style={[
                  styles.radiusPill,
                  {
                    backgroundColor: active ? t.color.gold : t.color.surfaceElevated,
                    borderColor: active ? t.color.gold : t.color.tabBorder,
                  },
                ]}
              >
                <Text style={[styles.radiusPillText, { color: active ? t.color.onGold : t.color.textSecondary }]}>
                  {km} km
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {locStatus === 'idle' && (
        <Pressable
          onPress={requestLocation}
          style={[styles.locationPrompt, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}
        >
          <MapPinIcon color={t.color.gold} />
          <Text style={[styles.locationPromptText, { color: t.color.textPrimary }]}>
            Enable location to find salons near you
          </Text>
        </Pressable>
      )}

      {locStatus === 'requesting' && (
        <View style={styles.nearbyRow}>
          <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
          <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
        </View>
      )}

      {(locStatus === 'denied' || locStatus === 'error') && (
        <View style={[styles.locationPrompt, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}>
          <MapPinIcon color={t.color.textMuted} />
          <Text style={[styles.locationPromptText, { color: t.color.textSecondary }]}>
            Location access denied — enable it in your device settings to see nearby salons.
          </Text>
        </View>
      )}

      {locStatus === 'granted' && (
        loadingNearby ? (
          <View style={styles.nearbyRow}>
            <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
            <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
          </View>
        ) : nearby.length === 0 ? (
          <View style={[styles.locationPrompt, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}>
            <Text style={[styles.locationPromptText, { color: t.color.textSecondary }]}>
              No salons found within {searchRadiusKm} km.
            </Text>
          </View>
        ) : (
          <View style={styles.nearbyRow}>
            {nearby.map((salon) => (
              <View key={salon.id} style={[styles.nearbyCard, { backgroundColor: t.color.surfaceCard }]}>
                <View style={styles.nearbyImgWrap}>
                  <View style={[styles.nearbyImg, { backgroundColor: t.color.borderSubtle }]} />
                  {salon.rating != null && (
                    <View style={styles.ratingBadge}>
                      <StarIcon size={11} color={t.color.gold} />
                      <Text style={[styles.ratingBadgeText, { color: t.color.textPrimary }]}>
                        {salon.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.nearbyContent}>
                  {salon.isOpen === true && (
                    <Text style={[styles.openNow, { color: t.color.gold }]}>OPEN NOW</Text>
                  )}
                  <Text style={[styles.nearbyName, { color: t.color.textPrimary }]}>{salon.name}</Text>
                  <View style={styles.distanceRow}>
                    <MapPinIcon color={t.color.textSecondary} />
                    <Text style={[styles.distanceText, { color: t.color.textSecondary }]}>
                      {salon.distanceKm != null ? `${salon.distanceKm} km` : 'Distance unavailable'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenSalon(salon.id)}
                    style={[styles.bookNowBtn, { backgroundColor: t.color.textPrimary }]}
                  >
                    <Text style={[styles.bookNowText, { color: t.color.bgBase }]}>View</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )
      )}
      </>
      )}

      {!useNearbyMode && (
        loadingSalons ? (
          <View style={styles.nearbyRow}>
            <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
            <View style={[styles.nearbyCard, styles.nearbySkeleton, { backgroundColor: t.color.surfaceCard }]} />
          </View>
        ) : salonsError ? (
          <Pressable
            onPress={fetchSalons}
            style={[styles.locationPrompt, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}
          >
            <Text style={[styles.locationPromptText, { color: t.color.textSecondary }]}>
              Couldn't load salons — tap to retry.
            </Text>
          </Pressable>
        ) : salons.length === 0 ? (
          <View style={[styles.locationPrompt, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}>
            <Text style={[styles.locationPromptText, { color: t.color.textSecondary }]}>
              No salons available yet.
            </Text>
          </View>
        ) : (
          <View style={styles.nearbyRow}>
            {salons.map((salon) => (
              <View key={salon.id} style={[styles.nearbyCard, { backgroundColor: t.color.surfaceCard }]}>
                <View style={styles.nearbyImgWrap}>
                  <View style={[styles.nearbyImg, { backgroundColor: t.color.borderSubtle }]} />
                  {salon.rating != null && (
                    <View style={styles.ratingBadge}>
                      <StarIcon size={11} color={t.color.gold} />
                      <Text style={[styles.ratingBadgeText, { color: t.color.textPrimary }]}>
                        {salon.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.nearbyContent}>
                  {salon.isOpen === true && (
                    <Text style={[styles.openNow, { color: t.color.gold }]}>OPEN NOW</Text>
                  )}
                  <Text style={[styles.nearbyName, { color: t.color.textPrimary }]}>{salon.name}</Text>
                  <View style={styles.distanceRow}>
                    <MapPinIcon color={t.color.textSecondary} />
                    <Text style={[styles.distanceText, { color: t.color.textSecondary }]} numberOfLines={1}>
                      {salon.address || 'Address unavailable'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenSalon(salon.id)}
                    style={[styles.bookNowBtn, { backgroundColor: t.color.textPrimary }]}
                  >
                    <Text style={[styles.bookNowText, { color: t.color.bgBase }]}>View</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )
      )}
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
  latestSkeleton:  { height: 74, opacity: 0.5 },
  emptyCard:       { paddingVertical: 18, paddingHorizontal: 16 },
  emptyText:       { fontSize: 13, fontWeight: '500' },
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

  // Location prompt / empty states
  locationPrompt:  { marginHorizontal: 22, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationPromptText: { flex: 1, fontSize: 12.5, fontWeight: '500', lineHeight: 18 },

  // Radius selector
  radiusRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingBottom: 12 },
  radiusPill:      { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  radiusPillText:  { fontSize: 12, fontWeight: '700' },

  // Nearby
  nearbyRow:       { flexDirection: 'row', gap: 12, paddingHorizontal: 22 },
  nearbyCard:      { flex: 1, borderRadius: 20, overflow: 'hidden' },
  nearbySkeleton:  { height: 190, opacity: 0.5 },
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

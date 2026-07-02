import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { fetchBookableStylists, type PublicStylist } from '../../../src/api/booking';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function MoreHorizontal({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Circle cx={6} cy={12} r={1.6} />
      <Circle cx={12} cy={12} r={1.6} />
      <Circle cx={18} cy={12} r={1.6} />
    </Svg>
  );
}

function HeartIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type Tab = 'portfolio' | 'reviews';

export default function BarberProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, salonId, salonName } = useLocalSearchParams<{ id: string; salonId: string; salonName: string }>();
  const draft = useBookingDraft();

  const [barber, setBarber] = useState<PublicStylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('portfolio');
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    fetchBookableStylists()
      .then((team) => setBarber(team.find((s) => s.id === id) ?? null))
      .catch(() => setBarber(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    // Barber-first path (SKILL_fix_mobile_booking_barber_availability): preselecting the real
    // staff id here is what lets services.tsx skip the redundant "Choose your stylist" step.
    draft.init(salonId ?? '', barber?.id ?? '', {
      barberName: barber?.name ?? '',
      salonName: salonName ?? '',
    });
    router.push('/(client)/booking/services');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={[styles.heroImg, { backgroundColor: t.color.surfaceCard }]} />
          <Pressable
            onPress={() => router.back()}
            style={[styles.circleBtn, { top: insets.top + 12, left: 20 }]}
            hitSlop={8}
          >
            <ChevronLeft color={t.color.textPrimary} />
          </Pressable>
          <Pressable
            style={[styles.circleBtn, { top: insets.top + 12, right: 20 }]}
            hitSlop={8}
          >
            <MoreHorizontal color={t.color.textPrimary} />
          </Pressable>
        </View>

        {/* ── Header block ── */}
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.barberName, { color: t.color.textPrimary }]}>
                {loading ? '…' : barber?.name ?? 'Stylist not found'}
              </Text>
              {/* Rating/reviews omitted: no real data source yet, never fabricated */}
              {barber && (barber.title || barber.role) && (
                <Text style={[styles.roleText, { color: t.color.textSecondary }]}>
                  {barber.title || barber.role}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => setIsFav((v) => !v)}
              style={[styles.favBtn, { backgroundColor: t.color.surfaceElevated }]}
              hitSlop={8}
            >
              <HeartIcon color={isFav ? t.color.gold : t.color.textSecondary} filled={isFav} />
            </Pressable>
          </View>
          {barber?.bio ? (
            <Text style={[styles.bioText, { color: t.color.textMuted }]}>{barber.bio}</Text>
          ) : null}
        </View>

        {/* ── Tab pills ── */}
        <View style={styles.tabsRow}>
          {(['portfolio', 'reviews'] as Tab[]).map((t_) => (
            <Pressable
              key={t_}
              onPress={() => setTab(t_)}
              style={[
                styles.tabPill,
                { backgroundColor: tab === t_ ? t.color.textPrimary : t.color.surfaceElevated },
              ]}
            >
              <Text
                style={[
                  styles.tabPillText,
                  { color: tab === t_ ? t.color.bgBase : t.color.textSecondary },
                ]}
              >
                {t_.charAt(0).toUpperCase() + t_.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tab content (stubs) ── */}
        <View style={styles.comingSoon}>
          <Text style={[styles.comingSoonText, { color: t.color.textMuted }]}>Coming soon</Text>
        </View>
      </ScrollView>

      {/* ── Fixed CTA ── */}
      <View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: t.color.bgBase,
            borderTopColor: t.color.borderSubtle,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: t.color.textPrimary, opacity: pressed || loading ? 0.88 : 1 },
          ]}
          disabled={loading}
          onPress={handleBook}
        >
          <Text style={[styles.ctaBtnText, { color: t.color.bgBase }]}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  hero:           { height: 220, position: 'relative' },
  heroImg:        { ...StyleSheet.absoluteFill },
  circleBtn:      {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBlock:    { paddingHorizontal: 20, marginTop: 18 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barberName:     { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  roleText:       { fontSize: 13, fontWeight: '600', marginTop: 6 },
  bioText:        { fontSize: 13, fontWeight: '400', lineHeight: 19, marginTop: 10 },
  favBtn:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tabsRow:        { flexDirection: 'row', gap: 8, marginTop: 18, paddingHorizontal: 20 },
  tabPill:        { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 100 },
  tabPillText:    { fontSize: 13, fontWeight: '700' },
  comingSoon:     { alignItems: 'center', paddingTop: 60 },
  comingSoonText: { fontSize: 15, fontWeight: '600' },
  ctaContainer:   { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  ctaBtn:         { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:     { fontSize: 15, fontWeight: '700' },
});

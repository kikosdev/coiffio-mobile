import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { dummyBarberProfiles, dummySalonProfiles } from '../../../src/data/dummy';

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

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type Tab = 'portfolio' | 'reviews';

export default function BarberProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, salonId } = useLocalSearchParams<{ id: string; salonId: string }>();
  const draft = useBookingDraft();

  const barber = dummyBarberProfiles.find((b) => b.id === id) ?? dummyBarberProfiles[0];
  const salon  = dummySalonProfiles.find((s) => s.id === salonId);

  const [tab, setTab] = useState<Tab>('portfolio');
  const [isFav, setIsFav] = useState(false);

  const handleBook = () => {
    draft.init(salonId ?? '', barber.id, {
      barberName: barber.name,
      salonName: salon?.name ?? '',
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
              <Text style={[styles.barberName, { color: t.color.textPrimary }]}>{barber.name}</Text>
              <View style={styles.subRow}>
                <StarIcon size={14} color={t.color.gold} />
                <Text style={[styles.ratingText, { color: t.color.textSecondary }]}>
                  {barber.rating} ({barber.reviews})
                </Text>
                {barber.isPro && (
                  <>
                    <Text style={[styles.subDot, { color: t.color.textMuted }]}>·</Text>
                    <Text style={[styles.proBadge, { color: t.color.gold }]}>PRO BARBER</Text>
                  </>
                )}
              </View>
            </View>
            <Pressable
              onPress={() => setIsFav((v) => !v)}
              style={[styles.favBtn, { backgroundColor: t.color.surfaceElevated }]}
              hitSlop={8}
            >
              <HeartIcon color={isFav ? t.color.gold : t.color.textSecondary} filled={isFav} />
            </Pressable>
          </View>
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
            { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
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
  heroImg:        { ...StyleSheet.absoluteFillObject },
  circleBtn:      {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBlock:    { paddingHorizontal: 20, marginTop: 18 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barberName:     { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  subRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText:     { fontSize: 13, fontWeight: '600' },
  subDot:         { fontSize: 13 },
  proBadge:       { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
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

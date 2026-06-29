import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { dummySalonProfiles } from '../../../src/data/dummy';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
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

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <Circle cx={12} cy={10} r={2.3} />
    </Svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Circle cx={7} cy={7} r={1.5} />
    </Svg>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, variant, t }: { label: string; variant: 'gold' | 'dark'; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.badge, { backgroundColor: variant === 'gold' ? t.color.gold : t.color.borderStrong }]}>
      <Text style={[styles.badgeText, { color: variant === 'gold' ? t.color.onGold : t.color.textPrimary }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 4;

export default function SalonProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFav, setIsFav] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const salon = dummySalonProfiles.find((s) => s.id === id) ?? dummySalonProfiles[0];

  const visibleBarbers = salon.barbers.slice(0, MAX_VISIBLE);
  const extraCount = salon.barbers.length - MAX_VISIBLE;

  const goToBarber = (barberId: string) => {
    router.push({ pathname: '/(client)/barber/[id]', params: { id: barberId, salonId: salon.id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
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
          onPress={() => setIsFav((v) => !v)}
          style={[styles.circleBtn, { top: insets.top + 12, right: 20 }]}
          hitSlop={8}
        >
          <HeartIcon color={isFav ? t.color.gold : t.color.textPrimary} filled={isFav} />
        </Pressable>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={[styles.salonName, { color: t.color.textPrimary }]} numberOfLines={1}>
            {salon.name}
          </Text>
          <Badge label={salon.isOpen ? 'OPEN' : 'CLOSED'} variant={salon.isOpen ? 'gold' : 'dark'} t={t} />
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <StarIcon size={14} color={t.color.gold} />
          <Text style={[styles.metaText, { color: t.color.textSecondary }]}>
            {salon.rating} ({salon.reviews})
          </Text>
          <Text style={[styles.metaSep, { color: t.color.textMuted }]}>·</Text>
          <MapPinIcon color={t.color.textMuted} />
          <Text style={[styles.metaText, { color: t.color.textSecondary }]}>{salon.distanceKm} km</Text>
          <Text style={[styles.metaSep, { color: t.color.textMuted }]}>·</Text>
          <TagIcon color={t.color.textMuted} />
          <Text style={[styles.metaText, { color: t.color.textSecondary }]}>from ${salon.priceFrom}</Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: t.color.textMuted }]}>{salon.description}</Text>

        {/* OUR BARBERS */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>OUR BARBERS</Text>
        <View style={styles.barbersRow}>
          {visibleBarbers.map((b) => (
            <Pressable
              key={b.id}
              style={({ pressed }) => [styles.barberItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => goToBarber(b.id)}
            >
              <View style={[styles.avatarCircle, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}>
                <Text style={[styles.avatarInitials, { color: t.color.gold }]}>{b.initials}</Text>
              </View>
              <Text style={[styles.barberFirstName, { color: t.color.textSecondary }]} numberOfLines={1}>
                {b.name.split(' ')[0]}
              </Text>
            </Pressable>
          ))}
          {extraCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.barberItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => setSheetOpen(true)}
            >
              <View style={[styles.avatarCircle, { backgroundColor: t.color.surfaceElevated, borderColor: t.color.borderSubtle }]}>
                <Text style={[styles.avatarMore, { color: t.color.textSecondary }]}>+{extraCount}</Text>
              </View>
              <Text style={[styles.barberFirstName, { color: t.color.textMuted }]}>More</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* ── Fixed CTA ── */}
      <View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: t.color.borderSubtle,
            backgroundColor: t.color.bgBase,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={[styles.ctaBtnText, { color: t.color.bgBase }]}>Choose a Barber</Text>
        </Pressable>
      </View>

      {/* ── Barber picker bottom sheet ── */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.color.surfaceCard,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: t.color.borderStrong }]} />
          <Text style={[styles.sheetTitle, { color: t.color.textPrimary }]}>Choose a Barber</Text>
          {salon.barbers.map((b, i) => (
            <Pressable
              key={b.id}
              style={({ pressed }) => [
                styles.sheetItem,
                {
                  borderBottomColor: t.color.borderSubtle,
                  borderBottomWidth: i < salon.barbers.length - 1 ? 1 : 0,
                  backgroundColor: pressed ? t.color.surfaceElevated : 'transparent',
                },
              ]}
              onPress={() => {
                setSheetOpen(false);
                goToBarber(b.id);
              }}
            >
              <View style={[styles.sheetAvatar, { backgroundColor: t.color.surfaceElevated }]}>
                <Text style={[styles.sheetAvatarText, { color: t.color.gold }]}>{b.initials}</Text>
              </View>
              <Text style={[styles.sheetItemName, { color: t.color.textPrimary }]}>{b.name}</Text>
              <ChevronRight color={t.color.textMuted} />
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },

  // Hero
  hero:            { height: 220, position: 'relative' },
  heroImg:         { ...StyleSheet.absoluteFillObject },
  circleBtn:       {
    position: 'absolute',
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Scroll content
  scrollContent:   { paddingHorizontal: 20, paddingTop: 18 },

  // Title row
  titleRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  salonName:       { flex: 1, fontSize: 24, fontWeight: '700', lineHeight: 28 },

  // Badge
  badge:           { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  badgeText:       { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  // Meta row
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  metaText:        { fontSize: 13, fontWeight: '600' },
  metaSep:         { fontSize: 13, marginHorizontal: 2 },

  // Description
  description:     { fontSize: 14, lineHeight: 21, marginTop: 14 },

  // Barbers section
  eyebrow:         { fontSize: 11, fontWeight: '800', letterSpacing: 1.54, marginTop: 24, marginBottom: 14 },
  barbersRow:      { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  barberItem:      { alignItems: 'center', gap: 7, width: 56 },
  avatarCircle:    { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:  { fontSize: 15, fontWeight: '700' },
  avatarMore:      { fontSize: 13, fontWeight: '700' },
  barberFirstName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // CTA
  ctaContainer:    { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  ctaBtn:          { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:      { fontSize: 15, fontWeight: '700' },

  // Bottom sheet
  overlay:         { flex: 1 },
  sheet:           { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  sheetItem:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderRadius: 8 },
  sheetAvatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sheetAvatarText: { fontSize: 14, fontWeight: '700' },
  sheetItemName:   { flex: 1, fontSize: 15, fontWeight: '600' },
});

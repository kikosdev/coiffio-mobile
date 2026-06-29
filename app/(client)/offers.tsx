import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../src/stores/bookingDraft';
import { dummyPacks } from '../../src/data/dummy';
import { formatMoney } from '../../src/utils/formatMoney';

// ── Icons ─────────────────────────────────────────────────────────────────────

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

function CopyIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

function UsersIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function GiftIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 12v10H4V12" />
      <Path d="M22 7H2v5h20V7z" />
      <Path d="M12 22V7" />
      <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 3" />
    </Svg>
  );
}

function ScissorsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={3} />
      <Circle cx={6} cy={18} r={3} />
      <Path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </Svg>
  );
}

// ── Static offers ─────────────────────────────────────────────────────────────

const STATIC_OFFERS = [
  { id: 'o1', title: 'Bring a friend',  sub: '15% off when you book a duo',       icon: 'users',  code: 'FRIEND' },
  { id: 'o2', title: 'Loyalty reward',  sub: '6th cut is on the house',            icon: 'gift',   code: null },
  { id: 'o3', title: 'Happy hours',     sub: '20% off, weekdays before noon',      icon: 'clock',  code: null },
];

const HERO_CODE = 'FRESH';

function OfferIcon({ icon, color }: { icon: string; color: string }) {
  if (icon === 'users') return <UsersIcon color={color} />;
  if (icon === 'gift')  return <GiftIcon color={color} />;
  return <ClockIcon color={color} />;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OffersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleUseCode = (code: string) => {
    draft.setPendingPromo(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    Alert.alert('Code saved', `"${code}" will be pre-filled at checkout.`);
  };

  const handleBookPack = (packId: string) => {
    const pack = dummyPacks.find((p) => p.id === packId);
    if (!pack) return;
    draft.applyPack(pack);
    router.push('/(client)/booking/datetime');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bgBase }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.wordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
        <BellIcon color={t.color.textPrimary} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Offers</Text>
        <Text style={[styles.titleSub, { color: t.color.textMuted }]}>Save on your next fresh cut</Text>
      </View>

      {/* ── Hero promo card ── */}
      <LinearGradient
        colors={[t.color.gold, t.color.goldWarm]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={[styles.heroEyebrow, { color: t.color.onGold }]}>FIRST VISIT</Text>
        <Text style={[styles.heroDiscount, { color: t.color.onGold }]}>30% OFF</Text>
        <Text style={[styles.heroSub, { color: t.color.onGold }]}>Any service with a PRO barber</Text>
        <Pressable
          style={[styles.codeBtn, { backgroundColor: t.color.bgBase }]}
          onPress={() => handleUseCode(HERO_CODE)}
        >
          <CopyIcon color={t.color.gold} />
          <Text style={[styles.codeBtnText, { color: t.color.textPrimary }]}>
            {copiedCode === HERO_CODE ? 'Saved!' : `USE CODE · ${HERO_CODE}`}
          </Text>
        </Pressable>
      </LinearGradient>

      {/* ── Offer list ── */}
      <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>ALL OFFERS</Text>
      <View style={styles.offerList}>
        {STATIC_OFFERS.map((o) => (
          <Pressable
            key={o.id}
            style={({ pressed }) => [
              styles.offerCard,
              {
                backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard,
              },
            ]}
            onPress={() => o.code && handleUseCode(o.code)}
          >
            <View style={[styles.offerIcon, { backgroundColor: t.color.goldSoft }]}>
              <OfferIcon icon={o.icon} color={t.color.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offerTitle, { color: t.color.textPrimary }]}>{o.title}</Text>
              <Text style={[styles.offerSub, { color: t.color.textMuted }]}>{o.sub}</Text>
              {o.code && (
                <Text style={[styles.offerCode, { color: t.color.gold }]}>CODE: {o.code}</Text>
              )}
            </View>
            <ChevronRight color={t.color.textMuted} />
          </Pressable>
        ))}
      </View>

      {/* ── Packs section ── */}
      <Text style={[styles.eyebrow, { color: t.color.textMuted, marginTop: 28 }]}>PACKS</Text>
      <View style={styles.offerList}>
        {dummyPacks.map((pack) => (
          <View key={pack.id} style={[styles.packCard, { backgroundColor: t.color.surfaceCard }]}>
            <View style={styles.packHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.packTitleRow}>
                  <Text style={[styles.packName, { color: t.color.textPrimary }]}>{pack.name}</Text>
                  {pack.badge && (
                    <View style={[styles.packBadge, { backgroundColor: t.color.goldSoft }]}>
                      <Text style={[styles.packBadgeText, { color: t.color.gold }]}>{pack.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.packDesc, { color: t.color.textMuted }]}>{pack.description}</Text>
              </View>
            </View>
            <View style={styles.packMeta}>
              <View style={styles.packMetaLeft}>
                <ScissorsIcon color={t.color.textMuted} />
                <Text style={[styles.packMetaText, { color: t.color.textSecondary }]}>
                  {pack.durationMin} min
                </Text>
              </View>
              <View style={styles.packMetaRight}>
                <Text style={[styles.packPrice, { color: t.color.textPrimary }]}>
                  {formatMoney(pack.price)}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.bookPackBtn,
                    { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
                  ]}
                  onPress={() => handleBookPack(pack.id)}
                >
                  <Text style={[styles.bookPackText, { color: t.color.bgBase }]}>Book this pack</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 4 },
  wordmark:      { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },
  titleBlock:    { paddingHorizontal: 22, paddingTop: 14, marginBottom: 18 },
  title:         { fontSize: 27, fontWeight: '800', lineHeight: 29 },
  titleSub:      { fontSize: 13, fontWeight: '500', marginTop: 4 },

  // Hero card
  heroCard:      { marginHorizontal: 22, borderRadius: 18, padding: 22, marginBottom: 24 },
  heroEyebrow:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.54, marginBottom: 6 },
  heroDiscount:  { fontSize: 38, fontWeight: '700', lineHeight: 42 },
  heroSub:       { fontSize: 13, fontWeight: '500', marginTop: 4, marginBottom: 16 },
  codeBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  codeBtnText:   { fontSize: 13, fontWeight: '700' },

  eyebrow:       { paddingHorizontal: 22, fontSize: 11, fontWeight: '800', letterSpacing: 1.54, marginBottom: 10 },

  // Offer list
  offerList:     { paddingHorizontal: 22, gap: 10 },
  offerCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 14 },
  offerIcon:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  offerTitle:    { fontSize: 15, fontWeight: '700' },
  offerSub:      { fontSize: 12, fontWeight: '500', marginTop: 2 },
  offerCode:     { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },

  // Packs
  packCard:      { borderRadius: 18, padding: 16 },
  packHeader:    { marginBottom: 12 },
  packTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  packName:      { fontSize: 16, fontWeight: '700' },
  packBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  packBadgeText: { fontSize: 10, fontWeight: '800' },
  packDesc:      { fontSize: 13, fontWeight: '400', lineHeight: 19 },
  packMeta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packMetaLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packMetaText:  { fontSize: 13, fontWeight: '600' },
  packMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packPrice:     { fontSize: 16, fontWeight: '700' },
  bookPackBtn:   { borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9 },
  bookPackText:  { fontSize: 13, fontWeight: '700' },
});

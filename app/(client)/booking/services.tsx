import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { fetchCatalog, type BookService } from '../../../src/api/booking';
import { formatMoney } from '../../../src/utils/formatMoney';

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

function Scissors({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={3} />
      <Circle cx={6} cy={18} r={3} />
      <Path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </Svg>
  );
}

function Trash({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ServicesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();
  const [catalog, setCatalog] = useState<BookService[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  const salonSlug = draft.salonSlug;

  useEffect(() => {
    if (!salonSlug) {
      // A missing slug is a broken navigation, not an empty catalog — surface it as an error.
      setCatalogError(true);
      setCatalogLoading(false);
      return;
    }
    setCatalogLoading(true);
    setCatalogError(false);
    fetchCatalog(salonSlug)
      .then(setCatalog)
      .catch(() => {
        setCatalog([]);
        setCatalogError(true);
      })
      .finally(() => setCatalogLoading(false));
  }, [salonSlug]);

  const canContinue = draft.services.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topWordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
        <MoreHorizontal color={t.color.textPrimary} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Your services</Text>
        <Text style={[styles.subtitle, { color: t.color.textMuted }]}>
          {draft.services.length} selected{draft.barberName ? ` · ${draft.barberName}` : ''}
        </Text>

        {catalogLoading ? (
          <Text style={[styles.catalogueMeta, { color: t.color.textMuted, paddingVertical: 20 }]}>Loading services…</Text>
        ) : catalogError ? (
          <Text style={[styles.catalogueMeta, { color: t.color.textSecondary, paddingVertical: 20 }]}>
            Couldn't load this salon's services. Go back and reopen the salon.
          </Text>
        ) : catalog.length === 0 ? (
          <Text style={[styles.catalogueMeta, { color: t.color.textSecondary, paddingVertical: 20 }]}>
            Ce salon n'a pas encore de services.
          </Text>
        ) : (
          catalog.map((s) => {
            const selected = draft.services.some((ds) => ds.id === s._id);
            return (
              <Pressable
                key={s._id}
                style={({ pressed }) => [
                  styles.serviceCard,
                  {
                    backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard,
                    borderColor: selected ? t.color.gold : t.color.borderSubtle,
                  },
                ]}
                onPress={() => {
                  if (selected) draft.removeService(s._id);
                  else draft.addService({ id: s._id, name: s.name, desc: s.category, durationMin: s.durationMin, price: s.price });
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: selected ? t.color.gold : t.color.goldSoft }]}>
                  {selected ? <CheckIcon color={t.color.onGold} /> : <Scissors color={t.color.gold} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.name}</Text>
                  <Text style={[styles.serviceMeta, { color: t.color.textMuted }]}>
                    {s.category} · {s.durationMin} min
                  </Text>
                </View>
                <Text style={[styles.servicePrice, { color: selected ? t.color.gold : t.color.textPrimary }]}>
                  {formatMoney(s.price)}
                </Text>
                {selected && <Trash color={t.color.textMuted} />}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* ── Footer ── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: t.color.bgBase,
            borderTopColor: t.color.borderSubtle,
          },
        ]}
      >
        <View style={styles.footerSummary}>
          <Text style={[styles.footerLabel, { color: t.color.textMuted }]}>
            Subtotal · {draft.totalDurationMin()} min
          </Text>
          <Text style={[styles.footerAmount, { color: t.color.textPrimary }]}>
            {formatMoney(draft.servicesSubtotal())}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            {
              backgroundColor: canContinue ? t.color.textPrimary : t.color.surfaceElevated,
              opacity: pressed && canContinue ? 0.88 : 1,
            },
          ]}
          disabled={!canContinue}
          onPress={() =>
            // Barber-first (came from a barber profile "Book"): stylist is already real and
            // preselected, so skip the redundant "Choose your stylist" step.
            router.push(draft.barberId ? '/(client)/booking/datetime' : '/(client)/booking/stylist')
          }
        >
          <Text style={[styles.ctaBtnText, { color: canContinue ? t.color.bgBase : t.color.textMuted }]}>
            Continue
          </Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  topBar:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topWordmark:     { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },
  scrollContent:   { paddingHorizontal: 20, paddingTop: 4 },
  title:           { fontSize: 28, fontWeight: '700', marginTop: 14 },
  subtitle:        { fontSize: 13, fontWeight: '500', marginTop: 5, marginBottom: 18 },

  serviceCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 16, padding: 14, marginTop: 10 },
  iconBox:         { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceName:     { fontSize: 16, fontWeight: '700' },
  serviceMeta:     { fontSize: 12, fontWeight: '500', marginTop: 3 },
  servicePrice:    { fontSize: 16, fontWeight: '700', flexShrink: 0 },

  footer:          { paddingHorizontal: 20, paddingTop: 14, gap: 12, borderTopWidth: 1 },
  footerSummary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel:     { fontSize: 13, fontWeight: '500' },
  footerAmount:    { fontSize: 22, fontWeight: '700' },
  ctaBtn:          { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:      { fontSize: 15, fontWeight: '700' },

  catalogueMeta:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

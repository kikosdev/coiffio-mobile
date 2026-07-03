import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
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

function Plus({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
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
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [catalog, setCatalog] = useState<BookService[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, []);

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

        {/* Service rows */}
        {draft.services.map((s) => (
          <View key={s.id} style={[styles.serviceRow, { backgroundColor: t.color.surfaceCard }]}>
            <View style={[styles.iconBox, { backgroundColor: t.color.goldSoft }]}>
              <Scissors color={t.color.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.name}</Text>
              <Text style={[styles.serviceMeta, { color: t.color.textMuted }]}>
                {s.desc} · {s.durationMin} min
              </Text>
            </View>
            <Text style={[styles.servicePrice, { color: t.color.textPrimary }]}>
              {formatMoney(s.price)}
            </Text>
            <Pressable onPress={() => draft.removeService(s.id)} hitSlop={10}>
              <Trash color={t.color.textMuted} />
            </Pressable>
          </View>
        ))}

        {/* Add another service */}
        <Pressable
          style={[styles.addBtn, { borderColor: t.color.borderStrong }]}
          onPress={() => setCatalogueOpen(true)}
        >
          <Plus color={t.color.textSecondary} />
          <Text style={[styles.addBtnText, { color: t.color.textSecondary }]}>
            Add another service
          </Text>
        </Pressable>
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

      {/* ── Catalogue bottom sheet ── */}
      <Modal
        visible={catalogueOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCatalogueOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setCatalogueOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: t.color.surfaceCard, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: t.color.borderStrong }]} />
          <Text style={[styles.sheetTitle, { color: t.color.textPrimary }]}>Add a service</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {catalogLoading ? (
              <Text style={[styles.catalogueMeta, { color: t.color.textMuted, paddingVertical: 20 }]}>Loading…</Text>
            ) : (
              catalog.map((s) => {
                const alreadyAdded = draft.services.some((ds) => ds.id === s._id);
                return (
                  <Pressable
                    key={s._id}
                    style={({ pressed }) => [
                      styles.catalogueItem,
                      {
                        borderBottomColor: t.color.borderSubtle,
                        backgroundColor: pressed ? t.color.surfaceElevated : 'transparent',
                        opacity: alreadyAdded ? 0.45 : 1,
                      },
                    ]}
                    disabled={alreadyAdded}
                    onPress={() => {
                      draft.addService({ id: s._id, name: s.name, desc: s.category, durationMin: s.durationMin, price: s.price });
                      setCatalogueOpen(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.catalogueName, { color: t.color.textPrimary }]}>{s.name}</Text>
                      <Text style={[styles.catalogueMeta, { color: t.color.textMuted }]}>
                        {s.durationMin} min · {formatMoney(s.price)}
                      </Text>
                    </View>
                    {alreadyAdded && <CheckIcon color={t.color.gold} />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
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

  serviceRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 14, marginTop: 10 },
  iconBox:         { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceName:     { fontSize: 16, fontWeight: '700' },
  serviceMeta:     { fontSize: 12, fontWeight: '500', marginTop: 3 },
  servicePrice:    { fontSize: 16, fontWeight: '700', flexShrink: 0 },

  addBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, marginTop: 14 },
  addBtnText:      { fontSize: 14, fontWeight: '600' },

  footer:          { paddingHorizontal: 20, paddingTop: 14, gap: 12, borderTopWidth: 1 },
  footerSummary:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel:     { fontSize: 13, fontWeight: '500' },
  footerAmount:    { fontSize: 22, fontWeight: '700' },
  ctaBtn:          { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:      { fontSize: 15, fontWeight: '700' },

  overlay:         { flex: 1 },
  sheet:           { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '70%' },
  sheetHandle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  catalogueItem:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  catalogueName:   { fontSize: 15, fontWeight: '600' },
  catalogueMeta:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useDayCaisse } from '../../src/hooks/staff/useDayCaisse';
import { useMyServices, StaffService } from '../../src/hooks/staff/useMyServices';
import { formatMoney } from '../../src/utils/formatMoney';

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}
function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}
function XIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

// ── POS Sheet ─────────────────────────────────────────────────────────────────

interface POSSheetProps {
  visible: boolean;
  onClose: () => void;
  services: StaffService[];
  onRingUp: (serviceId: string, serviceName: string, amountTnd: number) => void;
}

function POSSheet({ visible, onClose, services, onRingUp }: POSSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = services.find((s) => s.id === selectedId);

  function handleEncaisser() {
    if (!selected) return;
    Alert.alert(
      'Encaisser',
      `${selected.name} — ${formatMoney(selected.priceTnd)}\nMéthode : Cash`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            onRingUp(selected.id, selected.name, selected.priceTnd);
            setSelectedId(null);
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.sheetPanel, { backgroundColor: t.color.surfaceCard, paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: t.color.textPrimary }]}>Encaisser</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <XIcon color={t.color.textMuted} />
            </Pressable>
          </View>

          {/* Service picker */}
          <Text style={[styles.sheetEyebrow, { color: t.color.textMuted }]}>CHOISIR UN SERVICE</Text>
          <View style={styles.sheetServices}>
            {services.map((s) => {
              const picked = s.id === selectedId;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedId(s.id)}
                  style={[
                    styles.servicePickRow,
                    {
                      backgroundColor: picked ? t.color.goldSoft : t.color.surfaceElevated,
                      borderColor: picked ? t.color.gold : t.color.borderSubtle,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.servicePickName, { color: picked ? t.color.gold : t.color.textPrimary }]}>{s.name}</Text>
                    <Text style={[styles.servicePickDur, { color: t.color.textMuted }]}>{s.durationMin} min</Text>
                  </View>
                  <Text style={[styles.servicePickPrice, { color: picked ? t.color.gold : t.color.textPrimary }]}>
                    {formatMoney(s.priceTnd)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Method — cash only */}
          <View style={[styles.methodRow, { backgroundColor: t.color.surfaceElevated }]}>
            <Text style={[styles.methodLabel, { color: t.color.textPrimary }]}>Méthode</Text>
            <View style={[styles.cashBadge, { backgroundColor: t.color.goldSoft }]}>
              <Text style={[styles.cashBadgeTxt, { color: t.color.gold }]}>CASH</Text>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.encaisserBtn,
              {
                backgroundColor: selected ? t.color.gold : t.color.surfaceElevated,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleEncaisser}
            disabled={!selected}
          >
            <Text style={[styles.encaisserTxt, { color: selected ? t.color.onGold : t.color.textMuted }]}>
              {selected ? `Encaisser · ${formatMoney(selected.priceTnd)}` : 'Sélectionner un service'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StaffCaisse() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data, addSale, refresh } = useDayCaisse();
  const { data: servicesData } = useMyServices();
  const [posVisible, setPosVisible] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const { date, totalTnd, servicesTotalTnd, productsTotalTnd, cashTnd, entries } = data;
  const dateLabel = format(parseISO(date), 'EEEE, d MMMM');

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={[styles.title, { color: t.color.textPrimary }]}>Caisse</Text>
          <Text style={[styles.subtitle, { color: t.color.textMuted }]}>{dateLabel}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.earningsLink, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push('/(staff)/earnings' as any)}
        >
          <Text style={[styles.earningsLinkTxt, { color: t.color.gold }]}>Mes gains</Text>
          <ChevronRight color={t.color.gold} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat cards ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.gold }]}>{formatMoney(totalTnd)}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Total jour</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{formatMoney(servicesTotalTnd)}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Services</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{formatMoney(cashTnd)}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Cash</Text>
          </View>
        </View>

        {/* ── Sales list ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>VENTES DU JOUR · {entries.length}</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTxt, { color: t.color.textMuted }]}>Aucune vente enregistrée.</Text>
          </View>
        ) : (
          <View style={styles.salesList}>
            {entries.map((e) => (
              <View key={e.id} style={[styles.saleRow, { backgroundColor: t.color.surfaceCard }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.saleName, { color: t.color.textPrimary }]}>{e.clientName}</Text>
                  <Text style={[styles.saleService, { color: t.color.textMuted }]}>{e.service}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.saleAmount, { color: t.color.textPrimary }]}>{formatMoney(e.amountTnd)}</Text>
                  <Text style={[styles.saleTime, { color: t.color.textMuted }]}>{e.time} · cash</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Encaisser FAB ── */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 16, paddingHorizontal: 22 }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, { backgroundColor: t.color.gold, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => setPosVisible(true)}
        >
          <PlusIcon color={t.color.onGold} />
          <Text style={[styles.fabTxt, { color: t.color.onGold }]}>Encaisser</Text>
        </Pressable>
      </View>

      {/* ── POS Sheet ── */}
      <POSSheet
        visible={posVisible}
        onClose={() => setPosVisible(false)}
        services={servicesData.services}
        onRingUp={(serviceId, serviceName, amount) => addSale(serviceId, serviceName, amount)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 10 },
  title:           { fontSize: 27, fontWeight: '800' },
  subtitle:        { fontSize: 12, fontWeight: '500', marginTop: 1 },
  earningsLink:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  earningsLinkTxt: { fontSize: 13, fontWeight: '700' },

  statsRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 4 },
  statCard:        { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue:       { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  statLabel:       { fontSize: 10, fontWeight: '600', marginTop: 3 },

  eyebrow:         { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, paddingHorizontal: 22, marginTop: 22, marginBottom: 10 },

  salesList:       { paddingHorizontal: 22, gap: 8 },
  saleRow:         { borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center' },
  saleName:        { fontSize: 14, fontWeight: '700' },
  saleService:     { fontSize: 12, fontWeight: '500', marginTop: 2 },
  saleAmount:      { fontSize: 15, fontWeight: '800' },
  saleTime:        { fontSize: 11, fontWeight: '500' },

  emptyWrap:       { alignItems: 'center', paddingTop: 32 },
  emptyTxt:        { fontSize: 14, fontWeight: '500' },

  fabWrap:         { position: 'absolute', left: 0, right: 0 },
  fab:             { borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  fabTxt:          { fontSize: 15, fontWeight: '700' },

  // POS Sheet
  sheetOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.50)' },
  sheetPanel:      { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 20 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle:      { fontSize: 18, fontWeight: '800' },
  sheetEyebrow:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 },
  sheetServices:   { gap: 8, marginBottom: 16 },
  servicePickRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, padding: 12 },
  servicePickName: { fontSize: 14, fontWeight: '700' },
  servicePickDur:  { fontSize: 11, fontWeight: '500', marginTop: 1 },
  servicePickPrice:{ fontSize: 14, fontWeight: '800' },
  methodRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 13, marginBottom: 16 },
  methodLabel:     { fontSize: 14, fontWeight: '600' },
  cashBadge:       { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cashBadgeTxt:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  encaisserBtn:    { borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  encaisserTxt:    { fontSize: 15, fontWeight: '700' },
});

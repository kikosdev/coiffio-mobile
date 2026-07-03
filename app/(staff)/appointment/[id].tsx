import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO, addMinutes, parse } from 'date-fns';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAppointment } from '../../../src/hooks/staff/useAppointment';
import { formatMoney } from '../../../src/utils/formatMoney';

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}
function PhoneIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.1 9.6a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
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

function actionLabel(state: string) {
  if (state === 'waiting')  return 'Start service';
  if (state === 'in_chair') return 'Mark as done';
  return 'Completed';
}

function stateColor(state: string, t: ReturnType<typeof useTheme>) {
  if (state === 'done')     return t.color.success;
  if (state === 'in_chair') return t.color.gold;
  return t.color.textMuted;
}

export default function AppointmentDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: appt, isLoading, error, advanceState } = useAppointment(id ?? '');
  const [advancing, setAdvancing] = useState(false);

  if (!appt) {
    return (
      <View style={[styles.root, { backgroundColor: t.color.bgBase, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.color.textMuted }}>
          {isLoading ? 'Loading…' : error ?? 'Appointment not found.'}
        </Text>
      </View>
    );
  }

  const dateLabel = format(parseISO(appt.date), 'EEE, d MMM');
  const startParsed = parse(appt.startTime, 'HH:mm', parseISO(appt.date));
  const endParsed   = addMinutes(startParsed, appt.durationMin);
  const timeRange   = `${format(startParsed, 'HH:mm')}–${format(endParsed, 'HH:mm')}`;

  async function handleAdvance() {
    if (appt!.state === 'done' || advancing) return;
    setAdvancing(true);
    try {
      await advanceState();
    } catch {
      Alert.alert('Could not update', 'Something went wrong recording this checkout. Please try again.');
    } finally {
      setAdvancing(false);
    }
  }

  function handleReschedule() {
    Alert.alert('Reschedule', 'Reschedule flow coming in a future update.');
  }

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Appointment</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Client card ── */}
        <View style={[styles.clientCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={[styles.clientAvatar, { backgroundColor: t.color.gold }]}>
            <Text style={[styles.clientInitials, { color: t.color.onGold }]}>{appt.clientInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.clientName, { color: t.color.textPrimary }]}>{appt.clientName}</Text>
              {appt.visitCount >= 5 && <StarIcon color={t.color.gold} size={14} />}
            </View>
            <Text style={[styles.clientSub, { color: t.color.textMuted }]}>
              {appt.visitCount >= 5 ? 'Regular' : 'Client'} · {appt.visitCount} visit{appt.visitCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <Pressable
            style={[styles.callBtn, { backgroundColor: t.color.textPrimary }]}
            hitSlop={8}
            onPress={() => Alert.alert('Call', `Calling ${appt.clientName}…\n${appt.phone}`)}
          >
            <PhoneIcon color={t.color.bgBase} />
          </Pressable>
        </View>

        {/* ── Date / Time ── */}
        <View style={styles.metaRow}>
          <View style={[styles.metaCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.metaLabel, { color: t.color.textMuted }]}>DATE</Text>
            <Text style={[styles.metaValue, { color: t.color.textPrimary }]}>{dateLabel}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.metaLabel, { color: t.color.textMuted }]}>TIME</Text>
            <Text style={[styles.metaValue, { color: t.color.textPrimary }]}>{timeRange}</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.metaLabel, { color: t.color.textMuted }]}>STATUS</Text>
            <Text style={[styles.metaValue, { color: stateColor(appt.state, t) }]}>
              {appt.state === 'waiting' ? 'Upcoming' : appt.state === 'in_chair' ? 'In chair' : 'Done'}
            </Text>
          </View>
        </View>

        {/* ── Services ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>SERVICES</Text>
        <View style={styles.serviceList}>
          {appt.services.map((s, i) => (
            <View key={i} style={[styles.serviceRow, { backgroundColor: t.color.surfaceCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.name}</Text>
                <Text style={[styles.serviceDur, { color: t.color.textMuted }]}>{s.durationMin} min</Text>
              </View>
              <Text style={[styles.servicePrice, { color: t.color.textPrimary }]}>{formatMoney(s.priceTnd)}</Text>
            </View>
          ))}
        </View>

        {/* ── Note ── */}
        {appt.note && (
          <View style={[styles.noteBlock, { backgroundColor: t.color.goldSoft }]}>
            <Text style={[styles.noteText, { color: t.color.goldWarm }]}>
              <Text style={{ color: t.color.gold, fontWeight: '700' }}>Note · </Text>
              {appt.note}
            </Text>
          </View>
        )}

        {/* ── Total ── */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: t.color.textMuted }]}>Total · {appt.state === 'done' ? 'paid' : 'cash'}</Text>
          <Text style={[styles.totalAmount, { color: t.color.textPrimary }]}>{formatMoney(appt.totalTnd)}</Text>
        </View>
      </ScrollView>

      {/* ── Action buttons ── */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, { backgroundColor: t.color.surfaceElevated, opacity: pressed ? 0.75 : 1 }]}
          onPress={handleReschedule}
        >
          <Text style={[styles.btnSecondaryTxt, { color: t.color.textPrimary }]}>Reschedule</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            {
              backgroundColor: appt.state === 'done' ? t.color.successBg : t.color.textPrimary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleAdvance}
          disabled={appt.state === 'done' || advancing}
        >
          <Text style={[styles.btnPrimaryTxt, { color: appt.state === 'done' ? t.color.success : t.color.bgBase }]}>
            {advancing ? 'Saving…' : actionLabel(appt.state)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 },
  topTitle:       { fontSize: 15, fontWeight: '700' },

  clientCard:     { margin: 22, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  clientAvatar:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  clientInitials: { fontSize: 18, fontWeight: '800' },
  clientName:     { fontSize: 17, fontWeight: '800' },
  clientSub:      { fontSize: 12, fontWeight: '500', marginTop: 2 },
  callBtn:        { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  metaRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 4 },
  metaCard:       { flex: 1, borderRadius: 16, padding: 13 },
  metaLabel:      { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  metaValue:      { fontSize: 13, fontWeight: '700', marginTop: 5 },

  eyebrow:        { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, paddingHorizontal: 22, marginTop: 20, marginBottom: 10 },

  serviceList:    { paddingHorizontal: 22, gap: 9 },
  serviceRow:     { borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  serviceName:    { fontSize: 14, fontWeight: '600' },
  serviceDur:     { fontSize: 11, fontWeight: '500', marginTop: 2 },
  servicePrice:   { fontSize: 15, fontWeight: '800' },

  noteBlock:      { marginHorizontal: 22, marginTop: 14, borderRadius: 14, padding: 13 },
  noteText:       { fontSize: 12, lineHeight: 18, fontWeight: '500' },

  totalRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 20 },
  totalLabel:     { fontSize: 14, fontWeight: '600' },
  totalAmount:    { fontSize: 24, fontWeight: '800' },

  actions:        { paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', gap: 10 },
  btnSecondary:   { flex: 1, borderRadius: 100, paddingVertical: 15, alignItems: 'center' },
  btnSecondaryTxt:{ fontSize: 14, fontWeight: '700' },
  btnPrimary:     { flex: 1.4, borderRadius: 100, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryTxt:  { fontSize: 14, fontWeight: '700' },
});

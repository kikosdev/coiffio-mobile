import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { useAppointments } from '../../../src/stores/appointments';
import { useAuthStore } from '../../../src/stores/auth';
import { saveGuestBooking } from '../../../src/storage/guestBookings';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';
import { formatMoney } from '../../../src/utils/formatMoney';

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 3" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

function fallbackBookingCode(id: string): string {
  const numeric = parseInt(id.slice(-6), 16) % 1000;
  return `B${String(numeric).padStart(3, '0')}`;
}

export default function ConfirmationScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();
  const user = useAuthStore((s) => s.user);
  const result = draft.result;

  const serviceNames = draft.services.map((s) => s.name);

  const bookingRef = result ? result.checkInCode ?? fallbackBookingCode(result._id) : '—';
  const dateLabel = result ? formatSalonDate(result.start) : '—';
  const timeLabel = result ? formatSalonTime(result.start) : '—';
  const amountDue = result ? result.price : draft.total();

  // Guests have no account — persist a local reference so the Bookings tab can show it.
  useEffect(() => {
    if (user || !result) return;
    saveGuestBooking({
      appointmentId: result._id,
      manageToken: result.manageToken,
      salonName: draft.salonName,
      serviceName: serviceNames.join(' · '),
      barberName: draft.barberName,
      start: result.start,
      price: result.price,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?._id]);

  useEffect(() => {
    if (!user || !result) return;
    useAppointments.getState().fetchUpcoming().catch(() => {});
  }, [result?._id, user]);

  const handleAddToCalendar = () => {
    // V1 stub — replace with expo-calendar when installed
    Alert.alert('Calendar', `"${serviceNames[0]}" with ${draft.barberName} added to your calendar.`);
  };

  const handleBackToHome = () => {
    draft.reset();
    router.replace('/(client)/home');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Check circle ── */}
        <View style={styles.checkWrap}>
          <View style={[styles.checkCircle, { backgroundColor: t.color.gold }]}>
            <CheckIcon color={t.color.onGold} />
          </View>
          <View style={[styles.checkGlow, { backgroundColor: t.color.goldSoft }]} />
        </View>

        <Text style={[styles.headline, { color: t.color.textPrimary }]}>Booking confirmed</Text>
        <Text style={[styles.subtext, { color: t.color.textMuted }]}>
          Your spot with {draft.barberName} is locked in.{'\n'}A reminder will hit your phone.
        </Text>

        {/* ── Recap card ── */}
        <View style={[styles.recapCard, { backgroundColor: t.color.surfaceCard }]}>
          {/* Barber row */}
          <View style={styles.barberRow}>
            <Text style={[styles.recapBarber, { color: t.color.textPrimary }]}>{draft.barberName}</Text>
          </View>
          <Text style={[styles.recapSalon, { color: t.color.textMuted }]}>{draft.salonName}</Text>

          <View style={[styles.divider, { backgroundColor: t.color.borderSubtle }]} />

          {/* Services */}
          <View style={styles.recapRow}>
            <Text style={[styles.recapKey, { color: t.color.textMuted }]}>Services</Text>
            <Text style={[styles.recapVal, { color: t.color.textPrimary }]} numberOfLines={2}>
              {serviceNames.join(' · ')}
            </Text>
          </View>

          {/* Date & time */}
          <View style={styles.recapRow}>
            <View style={styles.recapKeyRow}>
              <CalendarIcon color={t.color.textMuted} />
              <Text style={[styles.recapKey, { color: t.color.textMuted }]}>Date & time</Text>
            </View>
            <Text style={[styles.recapVal, { color: t.color.textPrimary }]}>
              {dateLabel} · {timeLabel}
            </Text>
          </View>

          {/* To pay */}
          <View style={styles.recapRow}>
            <Text style={[styles.recapKey, { color: t.color.textMuted }]}>To pay</Text>
            <Text style={[styles.recapVal, { color: t.color.textPrimary }]}>
              {formatMoney(amountDue)} · cash
            </Text>
          </View>
        </View>

        {/* ── Ref pill ── */}
        <View style={[styles.refPill, { backgroundColor: t.color.surfaceElevated }]}>
          <Text style={[styles.refText, { color: t.color.textSecondary }]}>
            {bookingRef}  ·  show this to your barber
          </Text>
        </View>

        {!user && result?.manageToken && (
          <Text style={[styles.trackingNote, { color: t.color.textMuted }]}>
            Keep this code to manage or cancel this booking from this device.
          </Text>
        )}

        {/* ── CTAs ── */}
        <Pressable
          style={({ pressed }) => [
            styles.calBtn,
            { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleAddToCalendar}
        >
          <CalendarIcon color={t.color.bgBase} />
          <Text style={[styles.calBtnText, { color: t.color.bgBase }]}>Add to calendar</Text>
        </Pressable>

        <Pressable onPress={handleBackToHome} style={styles.homeBtn}>
          <Text style={[styles.homeBtnText, { color: t.color.textSecondary }]}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  scrollContent: { alignItems: 'center', paddingHorizontal: 24 },

  // Check circle
  checkWrap:     { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 },
  checkCircle:   { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  checkGlow:     { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.6 },

  headline:      { fontSize: 26, fontWeight: '700', marginTop: 20, textAlign: 'center' },
  subtext:       { fontSize: 14, fontWeight: '400', lineHeight: 21, marginTop: 10, textAlign: 'center' },

  // Recap card
  recapCard:     { width: '100%', borderRadius: 18, padding: 18, marginTop: 24 },
  barberRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapBarber:   { fontSize: 16, fontWeight: '700' },
  recapSalon:    { fontSize: 13, fontWeight: '500', marginTop: 3 },
  divider:       { height: 1, marginVertical: 14 },
  recapRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingVertical: 5 },
  recapKeyRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recapKey:      { fontSize: 13, fontWeight: '500', flexShrink: 0 },
  recapVal:      { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },

  // Ref pill
  refPill:       { borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  refText:       { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  trackingNote:  { fontSize: 12, fontWeight: '500', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },

  // CTAs
  calBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 100, height: 56, paddingHorizontal: 32, marginTop: 24 },
  calBtnText:    { fontSize: 15, fontWeight: '700' },
  homeBtn:       { marginTop: 16, paddingVertical: 10 },
  homeBtnText:   { fontSize: 14, fontWeight: '600' },
});

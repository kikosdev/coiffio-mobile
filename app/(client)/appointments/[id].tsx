import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parse } from 'date-fns';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAppointments, type AppointmentStatus } from '../../../src/stores/appointments';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { resolveSalonSlug } from '../../../src/api/salons';
import { formatMoney } from '../../../src/utils/formatMoney';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" /><Path d="M16 6l-4-4-4 4M12 2v13" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

function HeartIcon({ color, filled }: { color: string; filled?: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" />
    </Svg>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const t = useTheme();
  const MAP: Record<AppointmentStatus, { bg: string; color: string; label: string }> = {
    confirmed: { bg: t.color.successSoft, color: t.color.success, label: 'CONFIRMED' },
    pending:   { bg: t.color.surfaceElevated, color: t.color.goldWarm, label: 'PENDING' },
    completed: { bg: t.color.surfaceElevated, color: t.color.textMuted, label: 'DONE' },
    cancelled: { bg: t.color.dangerSoft, color: t.color.danger, label: 'CANCELLED' },
    noshow:    { bg: t.color.dangerSoft, color: t.color.danger, label: 'NO SHOW' },
  };
  const { bg, color, label } = MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AppointmentDetailScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useAppointments();
  const draft = useBookingDraft();
  const appt = store.byId(id);

  if (!appt) {
    return (
      <View style={[styles.root, { backgroundColor: t.color.bgBase, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: t.color.textMuted }}>Appointment not found</Text>
      </View>
    );
  }

  const dateObj = parse(appt.date, 'yyyy-MM-dd', new Date());
  const monthLabel = format(dateObj, 'MMM').toUpperCase();
  const dayLabel = format(dateObj, 'd');
  const weekdayLabel = format(dateObj, 'EEEE');

  const handleShare = () => {
    Alert.alert('Share', `Booking ${appt.ref} — ${format(dateObj, 'EEE MMM d')} at ${appt.startTime}`);
  };

  const handleReschedule = async () => {
    const slug = await resolveSalonSlug(appt.salon.id);
    if (!slug) {
      Alert.alert('Could not start booking', 'This salon is unavailable right now.');
      return;
    }
    draft.init({ id: appt.salon.id, slug }, appt.barber.id, {
      barberName: appt.barber.name,
      salonName: appt.salon.name,
    });
    appt.services.forEach((s) => {
      draft.addService({ id: s.id, name: s.name, desc: '', durationMin: appt.durationMin, price: s.price });
    });
    router.push('/(client)/booking/datetime');
  };

  const initials = appt.barber.name.split(' ').map((w) => w[0]).join('').slice(0, 2);

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Appointment</Text>
        <Pressable onPress={handleShare} hitSlop={12}>
          <ShareIcon color={t.color.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Barber bloc ── */}
        <View style={styles.barberBloc}>
          <View style={[styles.avatar, { backgroundColor: t.color.surfaceElevated }]}>
            <Text style={[styles.avatarText, { color: t.color.textPrimary }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={[styles.barberName, { color: t.color.textPrimary }]}>{appt.barber.name}</Text>
              {appt.barber.isPro && (
                <View style={[styles.proBadge, { backgroundColor: t.color.gold }]}>
                  <Text style={[styles.proBadgeText, { color: t.color.onGold }]}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.salonLabel, { color: t.color.textMuted }]}>
              {appt.salon.name}{appt.salon.distanceKm != null ? ` · ${appt.salon.distanceKm} km` : ''}
            </Text>
          </View>
        </View>

        {/* ── Date card ── */}
        <View style={[styles.dateCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={[styles.dateBox, { backgroundColor: t.color.bgBase }]}>
            <Text style={[styles.dateMonth, { color: t.color.gold }]}>{monthLabel}</Text>
            <Text style={[styles.dateDay, { color: t.color.textPrimary }]}>{dayLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.weekday, { color: t.color.textPrimary }]}>
              {weekdayLabel} · {appt.startTime}
            </Text>
            <Text style={[styles.arrive, { color: t.color.textMuted }]}>
              Arrive 5 min early · {appt.durationMin} min total
            </Text>
          </View>
          <StatusBadge status={appt.status} />
        </View>

        {/* ── Services ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>SERVICES</Text>
        <View style={[styles.servicesCard, { backgroundColor: t.color.surfaceCard }]}>
          {appt.services.map((s, i) => (
            <View key={i} style={[styles.serviceLine, i > 0 && { marginTop: 8 }]}>
              <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.name}</Text>
              <Text style={[styles.servicePrice, { color: t.color.textPrimary }]}>{formatMoney(s.price)}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: t.color.borderSubtle }]} />
          <View style={styles.totalLine}>
            <Text style={[styles.paidLabel, { color: t.color.textMuted }]}>Payé · Espèces</Text>
            <Text style={[styles.totalAmount, { color: t.color.textPrimary }]}>{formatMoney(appt.amountDue)}</Text>
          </View>
        </View>

        {/* ── Check-in card ── */}
        <View style={[styles.checkInCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={styles.qrBox}>
            <QRCode
              value={appt.checkInCode}
              size={52}
              color={t.color.bgBase}
              backgroundColor="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkInTitle, { color: t.color.textPrimary }]}>Check-in code</Text>
            <Text style={[styles.checkInRef, { color: t.color.textPrimary }]}>#{appt.ref}</Text>
            <Text style={[styles.checkInSub, { color: t.color.textMuted }]}>Show this on arrival</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed CTA ── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16, backgroundColor: t.color.bgBase, borderTopColor: t.color.borderSubtle },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.rescheduleBtn,
            { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleReschedule}
        >
          <Text style={[styles.rescheduleBtnText, { color: t.color.bgBase }]}>Reschedule</Text>
        </Pressable>
        <Pressable
          style={[styles.favBtn, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}
          hitSlop={8}
        >
          <HeartIcon color={t.color.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topTitle:    { fontSize: 15, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 14 },

  // Barber bloc
  barberBloc:  { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 },
  avatar:      { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:  { fontSize: 17, fontWeight: '700' },
  barberName:  { fontSize: 18, fontWeight: '800' },
  proBadge:    { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '800' },
  salonLabel:  { fontSize: 12, fontWeight: '500', marginTop: 3 },

  // Date card
  dateCard:    { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dateBox:     { borderRadius: 13, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', flexShrink: 0 },
  dateMonth:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dateDay:     { fontSize: 22, fontWeight: '800', lineHeight: 26, marginTop: 2 },
  weekday:     { fontSize: 15, fontWeight: '700' },
  arrive:      { fontSize: 12, fontWeight: '500', marginTop: 3 },

  // Badge
  badge:     { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 9, fontWeight: '800' },

  // Services
  eyebrow:     { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },
  servicesCard: { borderRadius: 18, padding: 16, marginBottom: 16 },
  serviceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceName: { fontSize: 13, fontWeight: '600' },
  servicePrice: { fontSize: 13, fontWeight: '700' },
  divider:     { height: 1, marginVertical: 12 },
  totalLine:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paidLabel:   { fontSize: 13, fontWeight: '500' },
  totalAmount: { fontSize: 17, fontWeight: '800' },

  // Check-in
  checkInCard:  { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  qrBox:        { width: 64, height: 64, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkInTitle: { fontSize: 13, fontWeight: '700' },
  checkInRef:   { letterSpacing: 1.5, fontSize: 15, fontWeight: '600', marginTop: 4 },
  checkInSub:   { fontSize: 11, fontWeight: '500', marginTop: 3 },

  // Footer
  footer:       { paddingHorizontal: 18, paddingTop: 14, flexDirection: 'row', gap: 9, borderTopWidth: 1 },
  rescheduleBtn: { flex: 1, borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  rescheduleBtnText: { fontSize: 14, fontWeight: '700' },
  favBtn:       { width: 54, height: 56, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

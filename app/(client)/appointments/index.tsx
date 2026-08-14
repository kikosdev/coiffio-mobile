import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, StyleSheet } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parse, differenceInCalendarDays } from 'date-fns';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useAppointments, type Appointment, type AppointmentStatus } from '../../../src/stores/appointments';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { resolveSalonSlug } from '../../../src/api/salons';
import { useAuthStore } from '../../../src/stores/auth';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';
import { listGuestBookings, type GuestBookingRef } from '../../../src/storage/guestBookings';

// ── Icons ─────────────────────────────────────────────────────────────────────

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

function StarFill({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
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

// ── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: max }).map((_, i) => (
        <StarFill key={i} color={i < value ? '#F2B233' : t.color.borderStrong} size={11} />
      ))}
    </View>
  );
}

// ── NextVisitCard (first confirmed upcoming) ──────────────────────────────────

function NextVisitCard({ appt }: { appt: Appointment }) {
  const t = useTheme();
  const store = useAppointments();
  const draft = useBookingDraft();
  const daysUntil = differenceInCalendarDays(
    parse(appt.date, 'yyyy-MM-dd', new Date()),
    new Date()
  );
  const dateLabel = format(parse(appt.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d');
  const serviceStr = appt.services.map((s) => s.name).join(' · ');

  const handleCancel = () => {
    Alert.alert(
      'Cancel appointment?',
      'This action cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await store.cancelAppointment(appt.id);
            } catch {
              Alert.alert('Could not cancel', 'Please try again.');
            }
          },
        },
      ]
    );
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

  return (
    <View style={[styles.nextCard, { backgroundColor: t.color.surfaceCard, borderColor: t.color.gold }]}>
      <View style={[styles.nextAccent, { backgroundColor: t.color.gold }]} />
      <View style={styles.nextHeader}>
        <Text style={[styles.nextEyebrow, { color: t.color.gold }]}>
          NEXT VISIT · IN {daysUntil} {daysUntil === 1 ? 'DAY' : 'DAYS'}
        </Text>
        <StatusBadge status={appt.status} />
      </View>
      <View style={styles.barberRow}>
        <View style={[styles.avatarSm, { backgroundColor: t.color.surfaceElevated }]}>
          <Text style={[styles.avatarSmText, { color: t.color.textPrimary }]}>
            {appt.barber.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </Text>
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
          <Text style={[styles.serviceStr, { color: t.color.textMuted }]}>{serviceStr}</Text>
        </View>
      </View>
      <View style={[styles.datePill, { backgroundColor: t.color.bgBase }]}>
        <CalendarIcon color={t.color.gold} />
        <Text style={[styles.datePillDate, { color: t.color.textPrimary }]}>{dateLabel}</Text>
        <Text style={[styles.datePillDot, { color: t.color.borderStrong }]}>·</Text>
        <Text style={[styles.datePillTime, { color: t.color.gold }]}>{appt.startTime} – {appt.endTime}</Text>
      </View>
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.rescheduleBtn, { backgroundColor: t.color.textPrimary }]}
          onPress={handleReschedule}
        >
          <Text style={[styles.rescheduleBtnText, { color: t.color.bgBase }]}>Reschedule</Text>
        </Pressable>
        <Pressable
          style={[styles.cancelBtn, { borderColor: t.color.borderStrong }]}
          onPress={handleCancel}
        >
          <Text style={[styles.cancelBtnText, { color: t.color.textSecondary }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── UpcomingRow ────────────────────────────────────────────────────────────────

function UpcomingRow({ appt }: { appt: Appointment }) {
  const t = useTheme();
  const dateLabel = format(parse(appt.date, 'yyyy-MM-dd', new Date()), 'MMM d · EEEE');
  const serviceStr = appt.services.map((s) => s.name).join(' · ');
  return (
    <Pressable
      style={({ pressed }) => [styles.upcomingRow, { backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard }]}
      onPress={() => router.push({ pathname: '/(client)/appointments/[id]', params: { id: appt.id } })}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.upcomingTop}>
          <Text style={[styles.upcomingDate, { color: t.color.textMuted }]}>{dateLabel.toUpperCase()}</Text>
          <StatusBadge status={appt.status} />
        </View>
        <View style={styles.upcomingBottom}>
          <View style={[styles.avatarSm, { backgroundColor: t.color.surfaceElevated }]}>
            <Text style={[styles.avatarSmText, { color: t.color.textPrimary }]}>
              {appt.barber.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.upcomingBarber, { color: t.color.textPrimary }]}>{appt.barber.name}</Text>
            <Text style={[styles.upcomingService, { color: t.color.textMuted }]}>
              {serviceStr} · {appt.startTime}
            </Text>
          </View>
          <ChevronRight color={t.color.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

// ── HistoryRow ────────────────────────────────────────────────────────────────

function HistoryRow({ appt }: { appt: Appointment }) {
  const t = useTheme();
  const draft = useBookingDraft();
  const dateLabel = format(parse(appt.date, 'yyyy-MM-dd', new Date()), 'MMM d');
  const serviceStr = appt.services.map((s) => s.name).join(' · ');

  const handleBookAgain = async () => {
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
      draft.addService({ id: s.id, name: s.name, desc: '', durationMin: 30, price: s.price });
    });
    router.push('/(client)/booking/datetime');
  };

  return (
    <View style={[styles.historyRow, { backgroundColor: t.color.surfaceCard }]}>
      <View style={styles.historyTop}>
        <View style={[styles.avatarSm, { backgroundColor: t.color.surfaceElevated }]}>
          <Text style={[styles.avatarSmText, { color: t.color.textPrimary }]}>
            {appt.barber.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.historyBarber, { color: t.color.textPrimary }]}>{appt.barber.name}</Text>
          <Text style={[styles.historyService, { color: t.color.textMuted }]}>
            {serviceStr} · {dateLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.historyAmount, { color: t.color.textPrimary }]}>{formatMoney(appt.amountDue)}</Text>
          {appt.rating != null
            ? <StarRating value={appt.rating} />
            : <Text style={[styles.notRated, { color: t.color.textMuted }]}>Not rated</Text>
          }
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.bookAgainBtn, { backgroundColor: t.color.goldSoft, opacity: pressed ? 0.8 : 1 }]}
        onPress={handleBookAgain}
      >
        <Text style={[styles.bookAgainText, { color: t.color.gold }]}>Book again</Text>
      </Pressable>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const store = useAppointments();
  const user = useAuthStore((s) => s.user);
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'upcoming' | 'history'>(initialTab === 'history' ? 'history' : 'upcoming');
  const [guestBookings, setGuestBookings] = useState<GuestBookingRef[]>([]);
  const [guestLoading, setGuestLoading] = useState(true);

  const loadGuestBookings = useCallback(() => {
    setGuestLoading(true);
    return listGuestBookings()
      .then(setGuestBookings)
      .catch(() => setGuestBookings([]))
      .finally(() => setGuestLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    store.fetchUpcoming();
    store.fetchHistory();
  }, [user]);

  // Refetch on focus too — e.g. right after completing a booking and navigating back here.
  useFocusEffect(useCallback(() => {
    if (!user) {
      loadGuestBookings();
      return;
    }
    store.fetchUpcoming();
    store.fetchHistory();
  }, [user, loadGuestBookings]));

  useEffect(() => {
    if (user) return;
    loadGuestBookings();
  }, [user, loadGuestBookings]);

  const handleRefresh = useCallback(() => {
    if (!user) return loadGuestBookings();
    return Promise.all([store.fetchUpcoming(), store.fetchHistory()]).then(() => undefined);
  }, [user, store, loadGuestBookings]);

  const upcomingList = store.upcoming();
  const historyList = store.history();
  const nextVisit = upcomingList[0] ?? null;
  const otherUpcoming = upcomingList.slice(1);

  const totalSpent = store.totalSpentThisYear();
  const completed = store.completedCount();

  // Guests are never blocked from booking — only the "sign in for history/sync" nudge is gated.
  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={guestLoading} onRefresh={handleRefresh} tintColor={t.color.gold} />}
        >
          <Text style={[styles.title, { color: t.color.textPrimary }]}>Appointments</Text>

          {guestLoading ? (
            <Text style={[styles.empty, { color: t.color.textMuted }]}>Loading…</Text>
          ) : guestBookings.length === 0 ? (
            <View style={styles.guestEmpty}>
              <Text style={[styles.empty, { color: t.color.textMuted }]}>
                Sign in to sync your bookings across devices, or reserve now as a guest.
              </Text>
              <Pressable
                style={[styles.guestLoginBtn, { backgroundColor: t.color.gold }]}
                onPress={() => router.push('/(auth)/login?role=client' as never)}
              >
                <Text style={[styles.guestLoginText, { color: t.color.onGold }]}>Sign in</Text>
              </Pressable>
              <Pressable
                style={[styles.guestGuestBtn, { borderColor: t.color.borderStrong }]}
                onPress={() => router.push('/(client)/booking/services')}
              >
                <Text style={[styles.guestGuestText, { color: t.color.textPrimary }]}>Reserve as guest</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {guestBookings.map((b) => (
                <View key={b.appointmentId} style={[styles.upcomingRow, { backgroundColor: t.color.surfaceCard }]}>
                  <View style={styles.upcomingTop}>
                    <Text style={[styles.upcomingDate, { color: t.color.textMuted }]}>
                      {formatSalonDate(b.start, 'MMM d · EEEE').toUpperCase()}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: t.color.successSoft }]}>
                      <Text style={[styles.badgeText, { color: t.color.success }]}>CONFIRMED</Text>
                    </View>
                  </View>
                  <Text style={[styles.upcomingBarber, { color: t.color.textPrimary }]}>{b.barberName || b.salonName}</Text>
                  <Text style={[styles.upcomingService, { color: t.color.textMuted }]}>
                    {b.serviceName} · {formatSalonTime(b.start)}
                  </Text>
                  <Text style={[styles.historyAmount, { color: t.color.textPrimary, marginTop: 6 }]}>{formatMoney(b.price)}</Text>
                </View>
              ))}
              <Pressable
                style={[styles.guestGuestBtn, { borderColor: t.color.borderStrong }]}
                onPress={() => router.push('/(client)/booking/services')}
              >
                <Text style={[styles.guestGuestText, { color: t.color.textPrimary }]}>Book again</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={store.loadingUpcoming || store.loadingHistory} onRefresh={handleRefresh} tintColor={t.color.gold} />}
      >
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Appointments</Text>

        {/* ── Toggle ── */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.togglePill, tab === 'upcoming' && { backgroundColor: t.color.textPrimary }]}
            onPress={() => setTab('upcoming')}
          >
            <Text style={[styles.toggleText, { color: tab === 'upcoming' ? t.color.bgBase : t.color.textMuted }]}>Upcoming</Text>
          </Pressable>
          <Pressable
            style={[styles.togglePill, tab === 'history' && { backgroundColor: t.color.textPrimary }]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.toggleText, { color: tab === 'history' ? t.color.bgBase : t.color.textMuted }]}>History</Text>
          </Pressable>
        </View>

        {tab === 'upcoming' ? (
          <>
            {store.loadingUpcoming ? (
              <Text style={[styles.empty, { color: t.color.textMuted }]}>Loading…</Text>
            ) : upcomingList.length === 0 ? (
              <Text style={[styles.empty, { color: t.color.textMuted }]}>No upcoming appointments</Text>
            ) : (
              <>
                {nextVisit && <NextVisitCard appt={nextVisit} />}
                {otherUpcoming.map((a) => <UpcomingRow key={a.id} appt={a} />)}
              </>
            )}
          </>
        ) : (
          <>
            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: t.color.surfaceCard }]}>
              <View>
                <Text style={[styles.summaryLabel, { color: t.color.textMuted }]}>Total spent this year</Text>
                <Text style={[styles.summaryValue, { color: t.color.textPrimary }]}>{formatMoney(totalSpent)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.summaryLabel, { color: t.color.textMuted }]}>Completed</Text>
                <Text style={[styles.summaryValue, { color: t.color.textPrimary }]}>{completed}</Text>
              </View>
            </View>

            {store.loadingHistory ? (
              <Text style={[styles.empty, { color: t.color.textMuted }]}>Loading…</Text>
            ) : historyList.length === 0 ? (
              <Text style={[styles.empty, { color: t.color.textMuted }]}>No past appointments</Text>
            ) : (
              historyList.map((a) => <HistoryRow key={a.id} appt={a} />)
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { paddingHorizontal: 22 },
  title:   { fontSize: 27, fontWeight: '800', marginBottom: 14 },
  empty:   { fontSize: 14, fontWeight: '500', marginTop: 32, textAlign: 'center' },

  guestEmpty:    { alignItems: 'center', paddingTop: 40 },
  guestLoginBtn: { marginTop: 20, borderRadius: 100, paddingVertical: 13, paddingHorizontal: 28 },
  guestLoginText: { fontSize: 14, fontWeight: '700' },
  guestGuestBtn: { marginTop: 12, borderRadius: 100, paddingVertical: 13, paddingHorizontal: 28, borderWidth: 1 },
  guestGuestText: { fontSize: 14, fontWeight: '700' },

  // Toggle
  toggleRow:  { flexDirection: 'row', gap: 8, marginBottom: 18 },
  togglePill: { borderRadius: 100, paddingHorizontal: 20, paddingVertical: 9 },
  toggleText: { fontSize: 13, fontWeight: '700' },

  // StatusBadge
  badge:     { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800' },

  // PRO badge
  proBadge:     { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  proBadgeText: { fontSize: 8, fontWeight: '800' },

  // Avatar small (initials)
  avatarSm:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarSmText: { fontSize: 14, fontWeight: '700' },

  // NextVisitCard
  nextCard:    { borderRadius: 22, padding: 15, marginBottom: 13, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  nextAccent:  { position: 'absolute', top: 0, left: 0, width: 4, bottom: 0 },
  nextHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  nextEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  barberRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  barberName:  { fontSize: 15, fontWeight: '700' },
  serviceStr:  { fontSize: 12, fontWeight: '500', marginTop: 2 },
  datePill:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 12 },
  datePillDate: { fontSize: 13, fontWeight: '600' },
  datePillDot: { fontSize: 13 },
  datePillTime: { fontSize: 13, fontWeight: '700' },
  actionRow:   { flexDirection: 'row', gap: 9 },
  rescheduleBtn:  { flex: 1, borderRadius: 100, paddingVertical: 11, alignItems: 'center' },
  rescheduleBtnText: { fontSize: 13, fontWeight: '700' },
  cancelBtn:   { flex: 1, borderRadius: 100, paddingVertical: 11, alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },

  // UpcomingRow
  upcomingRow:    { borderRadius: 22, padding: 15, marginBottom: 11 },
  upcomingTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  upcomingDate:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  upcomingBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upcomingBarber: { fontSize: 15, fontWeight: '700' },
  upcomingService: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Summary
  summaryCard:  { borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 22, fontWeight: '800' },

  // HistoryRow
  historyRow:    { borderRadius: 18, padding: 13, marginBottom: 11 },
  historyTop:    { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 11 },
  historyBarber: { fontSize: 14, fontWeight: '700' },
  historyService: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  notRated:      { fontSize: 10, fontWeight: '600', marginTop: 3 },
  bookAgainBtn:  { borderRadius: 100, paddingVertical: 9, alignItems: 'center' },
  bookAgainText: { fontSize: 12, fontWeight: '700' },
});

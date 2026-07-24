import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTodayBoard, TodayState } from '../../src/hooks/staff/useTodayBoard';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useAppointmentRealtime } from '../../src/hooks/useAppointmentRealtime';
import { useAuthStore } from '../../src/stores/auth';
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
function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}
// ── Helpers ───────────────────────────────────────────────────────────────────

function stateDot(state: TodayState, t: ReturnType<typeof useTheme>) {
  const map: Record<TodayState, string> = {
    done:     t.color.success,
    in_chair: t.color.gold,
    waiting:  t.color.borderStrong,
  };
  return map[state];
}

function stateLabel(state: TodayState) {
  if (state === 'done')     return 'Done';
  if (state === 'in_chair') return 'In chair';
  return 'Upcoming';
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StaffToday() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data, error, advanceState, refresh } = useTodayBoard();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const user = useAuthStore((s) => s.user);

  // Refetch whenever this tab regains focus, so a booking made elsewhere shows up
  // without needing an app restart.
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useAppointmentRealtime(useCallback(() => {
    refresh();
    refreshNotifications();
  }, [refresh, refreshNotifications]));

  const { date, appointments } = data;
  const done      = appointments.filter((a) => a.state === 'done');
  const inChair   = appointments.filter((a) => a.state === 'in_chair');
  const waiting   = appointments.filter((a) => a.state === 'waiting');
  const nextUp    = inChair[0] ?? waiting[0] ?? null;
  const restOfDay = appointments.filter((a) => a.id !== nextUp?.id && a.state !== 'done');

  const todayEarnings  = done.reduce((s, a) => s + a.totalTnd, 0);
  const bookedMin      = appointments.reduce((s, a) => s + a.durationMin, 0);
  const bookedHours    = (bookedMin / 60).toFixed(1);
  const clientsToday   = new Set(appointments.map((a) => a.clientId)).size;
  const staffName      = user?.name ?? '';
  const staffInitials  = staffName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const dateLabel = format(parseISO(date), 'EEEE, d MMMM');

  function goAppt(id: string) {
    router.push(`/(staff)/appointment/${id}` as any);
  }

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <View style={[styles.avatarCircle, { backgroundColor: t.color.gold }]}>
          <Text style={[styles.avatarInitials, { color: t.color.onGold }]}>{staffInitials}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[styles.greeting, { color: t.color.textMuted }]}>Good morning</Text>
          <Text style={[styles.staffName, { color: t.color.textPrimary }]}>{staffName}</Text>
        </View>
        <Pressable
          style={[styles.bellWrap, { backgroundColor: t.color.surfaceInput }]}
          onPress={() => router.push('/notifications')}
        >
          <BellIcon color={t.color.textPrimary} />
          {unreadCount > 0 && (
            <View style={[styles.bellDot, { backgroundColor: t.color.gold, borderColor: t.color.bgBase }]} />
          )}
        </Pressable>
      </View>

      {error ? (
        <Pressable
          style={[styles.errorBanner, { backgroundColor: t.color.surfaceCard, borderColor: t.color.gold }]}
          onPress={() => refresh()}
        >
          <Text style={[styles.errorText, { color: t.color.textPrimary }]}>{error}</Text>
          <Text style={[styles.errorRetry, { color: t.color.gold }]}>Tap to retry</Text>
        </Pressable>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Earnings hero ── */}
        <LinearGradient
          colors={[t.color.gold, t.color.goldDeep]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.heroCard}
        >
          <View style={[styles.heroCircle, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
          <Text style={[styles.heroEyebrow, { color: t.color.onGold }]}>TODAY'S EARNINGS</Text>
          <View style={styles.heroAmountRow}>
            <Text style={[styles.heroAmount, { color: t.color.onGold }]}>{formatMoney(todayEarnings)}</Text>
          </View>
          <Text style={[styles.heroSub, { color: t.color.onGold }]}>
            {done.length} of {appointments.length} booked · {waiting.length} slot{waiting.length !== 1 ? 's' : ''} left
          </Text>
        </LinearGradient>

        {/* ── Stat cards ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>
              {done.length}<Text style={[styles.statOf, { color: t.color.textMuted }]}>/{appointments.length}</Text>
            </Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Appointments</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>
              {bookedHours}<Text style={[styles.statOf, { color: t.color.textMuted }]}>h</Text>
            </Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Booked time</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{clientsToday}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Clients</Text>
          </View>
        </View>

        {/* ── Next up ── */}
        {nextUp ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.color.textMuted }]}>NEXT UP</Text>
              <Text style={[styles.sectionBadge, { color: t.color.gold }]}>
                at {nextUp.startTime}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.nextCard, { backgroundColor: t.color.surfaceElevated, borderColor: t.color.borderSubtle, opacity: pressed ? 0.88 : 1 }]}
              onPress={() => goAppt(nextUp.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={[styles.nextAvatar, { backgroundColor: t.color.gold }]}>
                  <Text style={[styles.nextAvatarTxt, { color: t.color.onGold }]}>{nextUp.clientInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextName, { color: t.color.textPrimary }]}>{nextUp.clientName}</Text>
                  <Text style={[styles.nextService, { color: t.color.textMuted }]}>
                    {nextUp.services.map((s) => s.name).join(' + ')} · {nextUp.durationMin} min
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.nextTime, { color: t.color.gold }]}>{nextUp.startTime}</Text>
                <Text style={[styles.nextState, { color: nextUp.state === 'in_chair' ? t.color.gold : t.color.textMuted }]}>
                  {stateLabel(nextUp.state)}
                </Text>
              </View>
            </Pressable>
          </>
        ) : null}

        {/* ── Rest of today ── */}
        {restOfDay.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.color.textMuted }]}>REST OF TODAY</Text>
              <Text style={[styles.sectionBadge, { color: t.color.textMuted }]}>{restOfDay.length} left</Text>
            </View>
            <View style={styles.restList}>
              {restOfDay.map((a) => (
                <Pressable
                  key={a.id}
                  style={({ pressed }) => [styles.restRow, { opacity: pressed ? 0.75 : 1 }]}
                  onPress={() => goAppt(a.id)}
                >
                  <Text style={[styles.restTime, { color: t.color.textMuted }]}>{a.startTime}</Text>
                  <View style={[styles.restCard, { backgroundColor: t.color.surfaceCard }]}>
                    <Text style={[styles.restName, { color: t.color.textPrimary }]}>
                      {a.clientName} · {a.services.map((s) => s.name).join(' + ')}
                    </Text>
                  </View>
                  <View style={[styles.restDot, { backgroundColor: stateDot(a.state, t) }]} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ── Done today ── */}
        {done.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.color.textMuted }]}>COMPLETED</Text>
              <Text style={[styles.sectionBadge, { color: t.color.success }]}>{done.length} done</Text>
            </View>
            <View style={styles.restList}>
              {done.map((a) => (
                <Pressable
                  key={a.id}
                  style={({ pressed }) => [styles.restRow, { opacity: pressed ? 0.75 : 1 }]}
                  onPress={() => goAppt(a.id)}
                >
                  <Text style={[styles.restTime, { color: t.color.textMuted }]}>{a.startTime}</Text>
                  <View style={[styles.restCard, { backgroundColor: t.color.surfaceCard }]}>
                    <Text style={[styles.restName, { color: t.color.textMuted }]}>
                      {a.clientName} · {a.services.map((s) => s.name).join(' + ')}
                    </Text>
                  </View>
                  <View style={[styles.restDot, { backgroundColor: t.color.success }]} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:           { flex: 1 },
  topBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 10 },
  avatarCircle:   { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 14, fontWeight: '800' },
  greeting:       { fontSize: 11, fontWeight: '500' },
  staffName:      { fontSize: 16, fontWeight: '800' },
  bellWrap:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot:        { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, borderWidth: 2 },

  errorBanner:    { marginHorizontal: 22, marginBottom: 10, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText:      { fontSize: 12, fontWeight: '600', flex: 1, paddingRight: 8 },
  errorRetry:     { fontSize: 12, fontWeight: '800' },

  heroCard:       { marginHorizontal: 22, marginTop: 14, borderRadius: 24, padding: 18, overflow: 'hidden' },
  heroCircle:     { position: 'absolute', right: -15, bottom: -25, width: 120, height: 120, borderRadius: 60 },
  heroEyebrow:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.0 },
  heroAmountRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 6 },
  heroAmount:     { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  heroChangeBadge:{ borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  heroChangeTxt:  { fontSize: 12, fontWeight: '700' },
  heroSub:        { fontSize: 12, fontWeight: '600', marginTop: 8 },

  statsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginTop: 14 },
  statCard:       { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  statValue:      { fontSize: 20, fontWeight: '800' },
  statOf:         { fontSize: 13, fontWeight: '600' },
  statLabel:      { fontSize: 10, fontWeight: '600', marginTop: 2 },

  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 22, marginBottom: 10 },
  sectionTitle:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  sectionBadge:   { fontSize: 12, fontWeight: '700' },

  nextCard:       { marginHorizontal: 22, borderRadius: 20, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextAvatar:     { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  nextAvatarTxt:  { fontSize: 16, fontWeight: '800' },
  nextName:       { fontSize: 15, fontWeight: '700' },
  nextService:    { fontSize: 12, fontWeight: '500', marginTop: 3 },
  nextTime:       { fontSize: 15, fontWeight: '800' },
  nextState:      { fontSize: 11, fontWeight: '600' },

  restList:       { paddingHorizontal: 22, gap: 8 },
  restRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restTime:       { fontSize: 12, fontWeight: '700', width: 38 },
  restCard:       { flex: 1, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 12 },
  restName:       { fontSize: 13, fontWeight: '600' },
  restDot:        { width: 8, height: 8, borderRadius: 4 },
});

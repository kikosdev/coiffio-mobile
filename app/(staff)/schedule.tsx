import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useSchedule, ScheduleSlotState } from '../../src/hooks/staff/useSchedule';
import { formatMoney } from '../../src/utils/formatMoney';
import { salonDateKey, nowAsSalonTime } from '../../src/utils/salonTime';

const TODAY = salonDateKey(nowAsSalonTime());

function slotBorderColor(state: ScheduleSlotState, t: ReturnType<typeof useTheme>) {
  const map: Record<ScheduleSlotState, string> = {
    confirmed: t.color.gold,
    completed: t.color.success,
    cancelled: t.color.borderStrong,
  };
  return map[state];
}

export default function StaffSchedule() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data, refresh } = useSchedule();
  const { weekDates, slots, dayWindows } = data;

  const [selectedDate, setSelectedDate] = useState(TODAY);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const daySlots = slots.filter((s) => s.date === selectedDate);

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Schedule</Text>
        <Text style={[styles.subtitle, { color: t.color.textMuted }]}>
          {format(parseISO(selectedDate), 'EEEE, d MMMM')}
        </Text>
      </View>

      {/* ── Week strip ── */}
      <View style={styles.weekStripRow}>
        {weekDates.map((d) => {
          const isSelected = d === selectedDate;
          const isToday    = d === TODAY;
          const parsed     = parseISO(d);
          const dayAbbr    = format(parsed, 'EEE').toUpperCase();
          const dayNum     = format(parsed, 'd');
          const count      = slots.filter((s) => s.date === d).length;

          return (
            <Pressable
              key={d}
              onPress={() => setSelectedDate(d)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: isSelected ? t.color.gold : t.color.surfaceCard,
                  borderColor: isSelected ? t.color.gold : t.color.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.dayAbbr, { color: isSelected ? t.color.onGold : t.color.textMuted }]}>
                {dayAbbr}
              </Text>
              <Text style={[styles.dayNum, { color: isSelected ? t.color.onGold : t.color.textPrimary }]}>
                {dayNum}
              </Text>
              {isToday && !isSelected && (
                <View style={[styles.todayDot, { backgroundColor: t.color.gold }]} />
              )}
              {count > 0 && (
                <Text style={[styles.dayCount, { color: isSelected ? t.color.onGold : t.color.textMuted }]}>
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Slots ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.slotList, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {dayWindows[selectedDate] === null ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTxt, { color: t.color.textMuted }]}>Not working today.</Text>
          </View>
        ) : daySlots.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTxt, { color: t.color.textMuted }]}>No appointments for this day.</Text>
          </View>
        ) : (
          daySlots.map((s) => (
            <View key={s.id} style={styles.slotRow}>
              <Text style={[styles.slotTime, { color: t.color.textMuted }]}>{s.startTime}</Text>
              <View
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: t.color.surfaceCard,
                    borderLeftColor: slotBorderColor(s.state, t),
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotClient, { color: t.color.textPrimary }]}>{s.clientName}</Text>
                  <Text style={[styles.slotService, { color: t.color.textMuted }]}>
                    {s.service} · {s.durationMin}m · {formatMoney(s.priceTnd)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingHorizontal: 22, paddingBottom: 8 },
  title:        { fontSize: 27, fontWeight: '800' },
  subtitle:     { fontSize: 13, fontWeight: '500', marginTop: 2 },

  weekStripRow: { flexDirection: 'row', paddingHorizontal: 22, gap: 8, paddingTop: 6, marginBottom: 20 },
  dayCell:      { height: 68, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, minWidth: 52 },
  dayAbbr:      { fontSize: 10, fontWeight: '700' },
  dayNum:       { fontSize: 18, fontWeight: '800', marginTop: 2 },
  dayCount:     { fontSize: 10, fontWeight: '600', marginTop: 2 },
  todayDot:     { width: 5, height: 5, borderRadius: 3, marginTop: 2 },

  slotList:     { paddingHorizontal: 22, paddingTop: 4, gap: 10 },
  slotRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  slotTime:     { fontSize: 11, fontWeight: '700', width: 36, paddingTop: 14 },
  slotCard:     { flex: 1, borderLeftWidth: 3, borderRadius: 13, borderTopLeftRadius: 3, borderBottomLeftRadius: 3, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotClient:   { fontSize: 13, fontWeight: '700' },
  slotService:  { fontSize: 11, fontWeight: '500', marginTop: 2 },

  emptyWrap:    { alignItems: 'center', paddingTop: 48 },
  emptyTxt:     { fontSize: 14, fontWeight: '500' },
});

import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Dimensions, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  format, addMonths, startOfMonth, getDaysInMonth,
  getDay, startOfDay, isBefore, parse,
} from 'date-fns';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { getMockAvailability } from '../../../src/data/dummy';

const WIN_W = Dimensions.get('window').width;
const TIME_PILL_W = Math.floor((WIN_W - 40 - 20) / 3); // 3 columns, paddingH=20, gap=10×2

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
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

// ── Screen ────────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DateTimeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const displayMonth = addMonths(startOfMonth(new Date()), monthOffset);
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth() + 1;
  const monthLabel = format(displayMonth, 'MMMM yyyy');
  const daysCount = getDaysInMonth(displayMonth);

  // Calendar grid cells (null = blank spacer)
  const cells = useMemo(() => {
    const firstDow = getDay(new Date(year, month - 1, 1));
    const leading = (firstDow + 6) % 7; // Mon-first
    const all: (number | null)[] = [
      ...Array(leading).fill(null),
      ...Array.from({ length: daysCount }, (_, i) => i + 1),
    ];
    while (all.length % 7 !== 0) all.push(null);
    return all;
  }, [year, month, daysCount]);

  // Split cells into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const availability = useMemo(
    () => getMockAvailability(draft.barberId ?? 'b1', year, month),
    [draft.barberId, year, month]
  );

  const timeSlots = selectedDate ? (availability[selectedDate] ?? []) : [];

  const handleMonthPrev = () => {
    if (monthOffset === 0) return;
    setMonthOffset((o) => o - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };
  const handleMonthNext = () => {
    setMonthOffset((o) => o + 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };
  const handleDayPress = (day: number) => {
    const d = new Date(year, month - 1, day);
    const str = format(d, 'yyyy-MM-dd');
    setSelectedDate(str);
    setSelectedTime(null);
  };

  const canConfirm = !!(selectedDate && selectedTime);

  const ctaLabel = canConfirm && selectedDate && selectedTime
    ? `Confirm — ${format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEE d')}, ${selectedTime}`
    : 'Select date & time';

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    draft.setSlot(selectedDate, selectedTime);
    router.push('/(client)/booking/payment');
  };

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Date & time</Text>

        {/* ── Calendar card ── */}
        <View style={[styles.calCard, { backgroundColor: t.color.surfaceCard }]}>
          {/* Month row */}
          <View style={styles.monthRow}>
            <Text style={[styles.monthLabel, { color: t.color.textPrimary }]}>{monthLabel}</Text>
            <View style={styles.monthNav}>
              <Pressable onPress={handleMonthPrev} hitSlop={10} style={{ opacity: monthOffset === 0 ? 0.3 : 1 }}>
                <ChevronLeft color={t.color.textPrimary} />
              </Pressable>
              <Pressable onPress={handleMonthNext} hitSlop={10}>
                <ChevronRight color={t.color.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Week day headers */}
          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((d, i) => (
              <Text key={i} style={[styles.weekDay, { color: t.color.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.calRow}>
              {row.map((day, di) => {
                if (day === null) return <View key={di} style={styles.dayCell} />;
                const d = new Date(year, month - 1, day);
                const dateStr = format(d, 'yyyy-MM-dd');
                const isActive = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                const isPast = isBefore(d, today);
                const isUnavailable = !availability[dateStr];
                const disabled = isPast || isUnavailable;
                return (
                  <Pressable
                    key={di}
                    style={[styles.dayCell, { opacity: disabled ? 0.3 : 1 }]}
                    disabled={disabled}
                    onPress={() => handleDayPress(day)}
                  >
                    <View style={[
                      styles.dayCellInner,
                      isActive && { backgroundColor: t.color.textPrimary, borderRadius: 20 },
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        { color: isActive ? t.color.bgBase : t.color.textPrimary },
                      ]}>
                        {day}
                      </Text>
                      {isToday && !isActive && (
                        <View style={[styles.todayDot, { backgroundColor: t.color.gold }]} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Available time ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>AVAILABLE TIME</Text>

        {timeSlots.length === 0 ? (
          <Text style={[styles.noSlots, { color: t.color.textMuted }]}>
            {selectedDate ? 'No available slots for this day' : 'Select a date above'}
          </Text>
        ) : (
          <View style={styles.timeGrid}>
            {timeSlots.map((slot) => {
              const isActive = selectedTime === slot.time;
              return (
                <Pressable
                  key={slot.time}
                  disabled={!slot.available}
                  onPress={() => setSelectedTime(slot.time)}
                  style={[
                    styles.timePill,
                    {
                      width: TIME_PILL_W,
                      backgroundColor: isActive ? t.color.textPrimary : t.color.surfaceElevated,
                      opacity: slot.available ? 1 : 0.35,
                    },
                  ]}
                >
                  <Text style={[styles.timePillText, { color: isActive ? t.color.bgBase : t.color.textSecondary }]}>
                    {slot.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Fixed CTA ── */}
      <View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: t.color.bgBase,
            borderTopColor: t.color.borderSubtle,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            {
              backgroundColor: canConfirm ? t.color.textPrimary : t.color.surfaceElevated,
              opacity: pressed && canConfirm ? 0.88 : 1,
            },
          ]}
          disabled={!canConfirm}
          onPress={handleConfirm}
        >
          <Text style={[styles.ctaBtnText, { color: canConfirm ? t.color.bgBase : t.color.textMuted }]}>
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topWordmark:   { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  title:         { fontSize: 28, fontWeight: '700', marginTop: 14, marginBottom: 18 },

  // Calendar
  calCard:       { borderRadius: 16, padding: 18 },
  monthRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthLabel:    { fontSize: 16, fontWeight: '700' },
  monthNav:      { flexDirection: 'row', gap: 16, alignItems: 'center' },
  weekHeader:    { flexDirection: 'row', marginBottom: 6 },
  weekDay:       { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calRow:        { flexDirection: 'row' },
  dayCell:       { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCellInner:  { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dayNum:        { fontSize: 14, fontWeight: '500' },
  todayDot:      { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 1 },

  // Time
  eyebrow:       { fontSize: 11, fontWeight: '800', letterSpacing: 1.54, marginTop: 22, marginBottom: 12 },
  noSlots:       { fontSize: 14, fontWeight: '500' },
  timeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timePill:      { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  timePillText:  { fontSize: 14, fontWeight: '600' },

  // CTA
  ctaContainer:  { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  ctaBtn:        { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:    { fontSize: 15, fontWeight: '700' },
});

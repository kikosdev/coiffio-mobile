import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useMyEarnings } from '../../src/hooks/staff/useMyEarnings';
import { formatMoney } from '../../src/utils/formatMoney';
import { EarningPeriod } from '../../src/data/staff/earnings';

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

const PERIODS: { key: EarningPeriod; label: string }[] = [
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year' },
];

export default function StaffEarnings() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<EarningPeriod>('week');
  const { data } = useMyEarnings(period);

  const maxBar = Math.max(...data.chartBars.map((b) => b.valueTnd), 1);

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Earnings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period total ── */}
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={[styles.periodLabel, { color: t.color.textMuted }]}>
            {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
            <Text style={[styles.totalAmount, { color: t.color.textPrimary }]}>{formatMoney(data.totalTnd)}</Text>
            <View style={[styles.changeBadge, { backgroundColor: t.color.goldSoft }]}>
              <Text style={[styles.changeTxt, { color: t.color.gold }]}>▲ {data.changePct}%</Text>
            </View>
          </View>
        </View>

        {/* ── Period picker ── */}
        <View style={styles.periodPicker}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.periodBtn,
                  { backgroundColor: active ? t.color.textPrimary : t.color.surfaceInput },
                ]}
              >
                <Text style={[styles.periodBtnTxt, { color: active ? t.color.bgBase : t.color.textMuted }]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Chart ── */}
        <View style={[styles.chartCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={styles.chartBars}>
            {data.chartBars.map((b, i) => {
              const pct = b.valueTnd > 0 ? (b.valueTnd / maxBar) * 100 : 0;
              const isT  = b.isToday;
              return (
                <View key={i} style={styles.barCol}>
                  {isT && (
                    <Text style={[styles.barTooltip, { color: t.color.gold }]}>
                      {formatMoney(b.valueTnd)}
                    </Text>
                  )}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${pct}%`,
                          backgroundColor: isT ? t.color.gold : t.color.surfaceElevated,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: isT ? t.color.textPrimary : t.color.textMuted, fontWeight: isT ? '700' : '600' }]}>
                    {b.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── By service ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>BY SERVICE</Text>
        <View style={styles.serviceBreakdown}>
          {data.byService.map((s, i) => (
            <View key={i} style={{ gap: 6 }}>
              <View style={styles.serviceRow}>
                <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.service}</Text>
                <Text style={[styles.serviceTotal, { color: t.color.textPrimary }]}>{formatMoney(s.totalTnd)}</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: t.color.surfaceElevated }]}>
                <View style={[styles.progressFill, { width: `${s.pct}%`, backgroundColor: t.color.gold }]} />
              </View>
              <Text style={[styles.serviceCount, { color: t.color.textMuted }]}>{s.count} services</Text>
            </View>
          ))}
        </View>

        {/* ── Next payout teaser (V2) ── */}
        <View style={[styles.payoutTeaser, { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.payoutLabel, { color: t.color.textMuted }]}>Next payout · V2</Text>
            <Text style={[styles.payoutSub, { color: t.color.textMuted }]}>Cash-out will be available in a future update.</Text>
          </View>
          <View style={[styles.v2Chip, { backgroundColor: t.color.surfaceElevated }]}>
            <Text style={[styles.v2ChipTxt, { color: t.color.textMuted }]}>SOON</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1 },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 },
  topTitle:         { fontSize: 22, fontWeight: '800' },

  periodLabel:      { fontSize: 12, fontWeight: '600' },
  totalAmount:      { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  changeBadge:      { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 5 },
  changeTxt:        { fontSize: 12, fontWeight: '700' },

  periodPicker:     { flexDirection: 'row', gap: 8, paddingHorizontal: 22, marginTop: 16 },
  periodBtn:        { flex: 1, borderRadius: 100, paddingVertical: 9, alignItems: 'center' },
  periodBtnTxt:     { fontSize: 12, fontWeight: '700' },

  chartCard:        { marginHorizontal: 22, marginTop: 16, borderRadius: 20, padding: 16 },
  chartBars:        { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 8 },
  barCol:           { flex: 1, alignItems: 'center', gap: 6 },
  barTrack:         { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar:              { width: '100%', borderRadius: 7 },
  barTooltip:       { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  barLabel:         { fontSize: 10 },

  eyebrow:          { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, paddingHorizontal: 22, marginTop: 22, marginBottom: 12 },

  serviceBreakdown: { paddingHorizontal: 22, gap: 16 },
  serviceRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceName:      { fontSize: 13, fontWeight: '600' },
  serviceTotal:     { fontSize: 13, fontWeight: '800' },
  progressTrack:    { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 3 },
  serviceCount:     { fontSize: 11, fontWeight: '500' },

  payoutTeaser:     { marginHorizontal: 22, marginTop: 24, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.6 },
  payoutLabel:      { fontSize: 14, fontWeight: '700' },
  payoutSub:        { fontSize: 11, fontWeight: '500', marginTop: 2 },
  v2Chip:           { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  v2ChipTxt:        { fontSize: 10, fontWeight: '800' },
});

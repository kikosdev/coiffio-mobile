import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useMyServices } from '../../src/hooks/staff/useMyServices';
import { formatMoney } from '../../src/utils/formatMoney';

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}
function GripIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M5 9h14M5 15h14" />
    </Svg>
  );
}

export default function StaffServices() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data, toggleAcceptingBookings } = useMyServices();
  const { services, acceptingBookings } = data;

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Services</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Accepting bookings toggle ── */}
        <View style={[styles.toggleCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: t.color.textPrimary }]}>Accepting bookings</Text>
            <Text style={[styles.toggleSub, { color: t.color.textMuted }]}>
              {acceptingBookings ? "You're visible to clients" : 'Your calendar is closed'}
            </Text>
          </View>
          <Switch
            value={acceptingBookings}
            onValueChange={toggleAcceptingBookings}
            trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
            thumbColor={t.color.textPrimary}
            ios_backgroundColor={t.color.surfaceElevated}
          />
        </View>

        {/* ── Services list ── */}
        <View style={styles.eyebrowRow}>
          <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>YOUR MENU · {services.length}</Text>
        </View>

        <View style={styles.serviceList}>
          {services.map((s) => (
            <View key={s.id} style={[styles.serviceRow, { backgroundColor: t.color.surfaceCard }]}>
              <GripIcon color={t.color.borderStrong} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceName, { color: t.color.textPrimary }]}>{s.name}</Text>
                <Text style={[styles.serviceDur, { color: t.color.textMuted }]}>{s.durationMin} min</Text>
              </View>
              <Text style={[styles.servicePrice, { color: t.color.textPrimary }]}>{formatMoney(s.priceTnd)}</Text>
            </View>
          ))}
        </View>

        {/* Prices read-only note */}
        <Text style={[styles.footerNote, { color: t.color.textMuted }]}>
          Prices are set by the salon owner and cannot be changed here.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  topTitle:    { fontSize: 22, fontWeight: '800' },

  toggleCard:  { marginHorizontal: 22, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggleSub:   { fontSize: 11, fontWeight: '500', marginTop: 2 },

  eyebrowRow:  { paddingHorizontal: 22, marginTop: 22, marginBottom: 10 },
  eyebrow:     { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },

  serviceList: { paddingHorizontal: 22, gap: 9 },
  serviceRow:  { borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceName: { fontSize: 14, fontWeight: '700' },
  serviceDur:  { fontSize: 11, fontWeight: '500', marginTop: 2 },
  servicePrice:{ fontSize: 15, fontWeight: '800' },

  footerNote:  { fontSize: 11, fontWeight: '500', textAlign: 'center', marginHorizontal: 22, marginTop: 20, lineHeight: 16 },
});

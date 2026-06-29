import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useMyClient } from '../../../src/hooks/staff/useMyClients';
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

export default function ClientDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useMyClient(id ?? '');

  if (!client) {
    return (
      <View style={[styles.root, { backgroundColor: t.color.bgBase, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.color.textMuted }}>Client not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>{client.name}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity ── */}
        <View style={[styles.identityCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={[styles.avatar, { backgroundColor: t.color.gold }]}>
            <Text style={[styles.avatarTxt, { color: t.color.onGold }]}>{client.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.clientName, { color: t.color.textPrimary }]}>{client.name}</Text>
              {client.isRegular && <StarIcon color={t.color.gold} size={14} />}
            </View>
            <Text style={[styles.clientSub, { color: t.color.textMuted }]}>
              {client.isRegular ? 'Regular' : 'Client'} · {client.visitCount} visits
            </Text>
            <Text style={[styles.clientPhone, { color: t.color.textMuted }]}>{client.phone}</Text>
          </View>
          <Pressable
            style={[styles.callBtn, { backgroundColor: t.color.textPrimary }]}
            hitSlop={8}
            onPress={() => Alert.alert('Call', `Calling ${client.name}…\n${client.phone}`)}
          >
            <PhoneIcon color={t.color.bgBase} />
          </Pressable>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{client.visitCount}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Visits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.gold }]}>{formatMoney(client.totalSpentTnd)}</Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Total spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
            <Text style={[styles.statValue, { color: t.color.textPrimary }]}>
              {format(parseISO(client.lastVisitDate), 'd MMM')}
            </Text>
            <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Last visit</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {client.notes && (
          <>
            <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>NOTE</Text>
            <View style={[styles.noteBlock, { backgroundColor: t.color.goldSoft }]}>
              <Text style={[styles.noteTxt, { color: t.color.goldWarm }]}>{client.notes}</Text>
            </View>
          </>
        )}

        {/* ── Visit history ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>VISIT HISTORY</Text>
        <View style={styles.historyList}>
          {client.recentVisits.map((v, i) => (
            <View key={i} style={[styles.historyRow, { backgroundColor: t.color.surfaceCard }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyService, { color: t.color.textPrimary }]}>{v.serviceName}</Text>
                <Text style={[styles.historyDate, { color: t.color.textMuted }]}>
                  {format(parseISO(v.date), 'd MMMM yyyy')}
                </Text>
              </View>
              <Text style={[styles.historyPrice, { color: t.color.textPrimary }]}>{formatMoney(v.priceTnd)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 },
  topTitle:      { fontSize: 15, fontWeight: '700' },

  identityCard:  { margin: 22, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:        { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 18, fontWeight: '800' },
  clientName:    { fontSize: 17, fontWeight: '800' },
  clientSub:     { fontSize: 12, fontWeight: '500', marginTop: 2 },
  clientPhone:   { fontSize: 12, fontWeight: '500', marginTop: 1 },
  callBtn:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  statsRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 4 },
  statCard:      { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue:     { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statLabel:     { fontSize: 10, fontWeight: '600', marginTop: 2 },

  eyebrow:       { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, paddingHorizontal: 22, marginTop: 22, marginBottom: 10 },

  noteBlock:     { marginHorizontal: 22, borderRadius: 14, padding: 13 },
  noteTxt:       { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  historyList:   { paddingHorizontal: 22, gap: 8 },
  historyRow:    { borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center' },
  historyService:{ fontSize: 14, fontWeight: '600' },
  historyDate:   { fontSize: 11, fontWeight: '500', marginTop: 2 },
  historyPrice:  { fontSize: 14, fontWeight: '800' },
});

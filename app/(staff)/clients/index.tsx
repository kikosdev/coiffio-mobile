import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useMyClients } from '../../../src/hooks/staff/useMyClients';
import { formatMoney } from '../../../src/utils/formatMoney';

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4-4" />
    </Svg>
  );
}
function StarIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
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

export default function StaffClients() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data } = useMyClients(search);
  const { clients, stats } = data;

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Clients</Text>
      </View>

      {/* ── Search ── */}
      <View style={[styles.searchWrap, { backgroundColor: t.color.surfaceInput }]}>
        <SearchIcon color={t.color.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: t.color.textPrimary }]}
          placeholder="Search clients"
          placeholderTextColor={t.color.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.textPrimary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.gold }]}>{stats.regulars}</Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>Regulars</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.statValue, { color: t.color.textPrimary }]}>+{stats.thisWeek}</Text>
          <Text style={[styles.statLabel, { color: t.color.textMuted }]}>This week</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>
          {search ? `RÉSULTATS · ${clients.length}` : 'REGULARS'}
        </Text>

        {clients.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTxt, { color: t.color.textMuted }]}>No clients found.</Text>
          </View>
        ) : (
          clients.map((c) => (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.clientRow, { backgroundColor: t.color.surfaceCard, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push(`/(staff)/clients/${c.id}` as any)}
            >
              <View style={[styles.avatar, { backgroundColor: t.color.surfaceElevated }]}>
                <Text style={[styles.avatarTxt, { color: t.color.gold }]}>{c.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.clientName, { color: t.color.textPrimary }]}>{c.name}</Text>
                  {c.isRegular && <StarIcon color={t.color.gold} size={12} />}
                </View>
                <Text style={[styles.clientSub, { color: t.color.textMuted }]}>
                  {c.visitCount} visits · last {format(parseISO(c.lastVisitDate), 'd MMM')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.clientSpent, { color: t.color.gold }]}>{formatMoney(c.totalSpentTnd)}</Text>
                <ChevronRight color={t.color.textMuted} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingHorizontal: 22, paddingBottom: 12 },
  title:      { fontSize: 27, fontWeight: '800' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, marginBottom: 14, borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchInput:{ flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },

  statsRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 4 },
  statCard:   { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue:  { fontSize: 20, fontWeight: '800' },
  statLabel:  { fontSize: 10, fontWeight: '600', marginTop: 2 },

  list:       { paddingHorizontal: 22, gap: 10 },
  eyebrow:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 2, marginTop: 14 },

  clientRow:  { borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 15, fontWeight: '800' },
  clientName: { fontSize: 14, fontWeight: '700' },
  clientSub:  { fontSize: 11, fontWeight: '500', marginTop: 2 },
  clientSpent:{ fontSize: 13, fontWeight: '800' },

  emptyWrap:  { alignItems: 'center', paddingTop: 32 },
  emptyTxt:   { fontSize: 14, fontWeight: '500' },
});

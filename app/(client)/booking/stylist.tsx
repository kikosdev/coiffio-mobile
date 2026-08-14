import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { fetchBookableStylists, type PublicStylist } from '../../../src/api/booking';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
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

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StylistScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();

  const [team, setTeam] = useState<PublicStylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(draft.barberId);

  const serviceIds = useMemo(() => draft.services.map((s) => s.id), [draft.services]);

  useEffect(() => {
    if (serviceIds.length === 0) {
      router.replace('/(client)/booking/services');
    }
  }, []);

  useEffect(() => {
    if (serviceIds.length === 0) return;
    if (!draft.salonSlug) { setTeam([]); setLoadError(true); setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    fetchBookableStylists(draft.salonSlug)
      .then(setTeam)
      // A failed request is NOT the same state as "no stylists eligible" — conflating them
      // hides real outages behind a dead-end empty list.
      .catch(() => { setTeam([]); setLoadError(true); })
      .finally(() => setLoading(false));
  }, [draft.salonSlug, serviceIds.join(','), retryTick]);

  const canContinue = !!selectedId;

  const handleContinue = () => {
    const chosen = team.find((s) => s.id === selectedId);
    if (!chosen) return;
    draft.setStylist(chosen.id, chosen.name);
    router.push('/(client)/booking/datetime');
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
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Choose your stylist</Text>
        <Text style={[styles.subtitle, { color: t.color.textMuted }]}>
          {draft.services.length} service{draft.services.length === 1 ? '' : 's'} selected
        </Text>

        {loading ? (
          <Text style={[styles.empty, { color: t.color.textMuted }]}>Loading…</Text>
        ) : loadError ? (
          <View>
            <Text style={[styles.empty, { color: t.color.textMuted }]}>
              Couldn't load stylists. Check your connection and try again.
            </Text>
            <Pressable onPress={() => setRetryTick((n) => n + 1)} hitSlop={8}>
              <Text style={[styles.empty, { color: t.color.gold, fontWeight: '700' }]}>Retry</Text>
            </Pressable>
          </View>
        ) : team.length === 0 ? (
          <Text style={[styles.empty, { color: t.color.textMuted }]}>No stylists available for these services right now.</Text>
        ) : (
          team.map((s) => {
            const isActive = selectedId === s.id;
            return (
              <Pressable
                key={s.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: t.color.surfaceCard,
                    borderColor: isActive ? t.color.gold : 'transparent',
                  },
                ]}
                onPress={() => setSelectedId(s.id)}
              >
                <View style={[styles.avatar, { backgroundColor: s.color || t.color.surfaceElevated }]}>
                  <Text style={[styles.avatarText, { color: t.color.onGold }]}>{s.name[0]}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: t.color.textPrimary }]}>{s.name}</Text>
                  <Text style={[styles.role, { color: t.color.textMuted }]} numberOfLines={1}>
                    {s.title || s.role}
                  </Text>
                  {!!s.bio && (
                    <Text style={[styles.bio, { color: t.color.textMuted }]} numberOfLines={2}>
                      {s.bio}
                    </Text>
                  )}
                </View>
                {isActive && (
                  <View style={[styles.checkDot, { backgroundColor: t.color.gold }]}>
                    <CheckIcon color={t.color.onGold} />
                  </View>
                )}
              </Pressable>
            );
          })
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
              backgroundColor: canContinue ? t.color.textPrimary : t.color.surfaceElevated,
              opacity: pressed && canContinue ? 0.88 : 1,
            },
          ]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Text style={[styles.ctaBtnText, { color: canContinue ? t.color.bgBase : t.color.textMuted }]}>
            Continue
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
  title:         { fontSize: 28, fontWeight: '700', marginTop: 14 },
  subtitle:      { fontSize: 13, fontWeight: '500', marginTop: 5, marginBottom: 18 },
  empty:         { fontSize: 14, fontWeight: '500', marginTop: 24, textAlign: 'center' },

  card:          { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 14, marginTop: 10, borderWidth: 1.5 },
  avatar:        { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:    { fontSize: 16, fontWeight: '700' },
  name:          { fontSize: 15, fontWeight: '700' },
  role:          { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bio:           { fontSize: 12, fontWeight: '400', marginTop: 4, lineHeight: 16 },
  checkDot:      { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  ctaContainer:  { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  ctaBtn:        { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:    { fontSize: 15, fontWeight: '700' },
});

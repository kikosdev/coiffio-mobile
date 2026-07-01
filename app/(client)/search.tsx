import { useEffect, useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Avatar, Badge, Eyebrow } from '../../src/components/kit';
import { useSearchStore } from '../../src/stores/search';
import { Search as SearchIcon, Scissors, Palette, User, Sparkles, Baby, Tag } from 'lucide-react-native';

const CATEGORY_ICON: Record<string, typeof Scissors> = {
  HAIRCUT: Scissors,
  COLOR: Palette,
  BEARD: User,
  TREATMENT: Sparkles,
  KIDS: Baby,
};

function categoryIcon(category: string) {
  return CATEGORY_ICON[category.toUpperCase()] ?? Tag;
}

export default function ClientSearch() {
  const t = useTheme();
  const [query, setQuery] = useState('');

  const { categories, hits, barbers, loadingLanding, fetchLanding, searchServices } = useSearchStore();

  useEffect(() => {
    fetchLanding();
  }, [fetchLanding]);

  useEffect(() => {
    const timer = setTimeout(() => searchServices(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchServices]);

  const isSearching = query.trim().length >= 2;
  const filteredBarbers = barbers.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen>
      <ScreenHeader title="Search" subtitle="Find barbers & services" />

      {/* Search input */}
      <View style={{
        marginHorizontal: t.spacing.xxl,
        marginBottom: t.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.color.surfaceInput,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        borderColor: t.color.borderSubtle,
        paddingHorizontal: t.spacing.md,
        gap: 8,
      }}>
        <SearchIcon size={18} color={t.color.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search barbers, services…"
          placeholderTextColor={t.color.textMuted}
          autoCapitalize="none"
          style={{ flex: 1, color: t.color.textPrimary, fontSize: 14, paddingVertical: 14 }}
        />
      </View>

      {/* Services — Browse (chips, no price) */}
      {!isSearching && (
        <>
          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Services</Eyebrow>
          <View style={{
            paddingHorizontal: t.spacing.xxl, marginBottom: 24,
            flexDirection: 'row', flexWrap: 'wrap', gap: 8,
          }}>
            {categories.map((c) => {
              const Icon = categoryIcon(c.category);
              return (
                <Card
                  key={c.category}
                  style={{ paddingVertical: 10, paddingHorizontal: 14 }}
                  onPress={() => router.push({ pathname: '/(client)/search-offerings', params: { category: c.category } })}
                >
                  <Row gap={8}>
                    <Icon size={15} color={t.color.gold} />
                    <T variant="body">{c.category}</T>
                    <Badge variant="neutral">{c.serviceCount}</Badge>
                  </Row>
                </Card>
              );
            })}
            {!loadingLanding && categories.length === 0 && (
              <T variant="caption">No services published yet.</T>
            )}
          </View>
        </>
      )}

      {/* Services — Search results (no price — A2) */}
      {isSearching && (
        <>
          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Services</Eyebrow>
          <View style={{ paddingHorizontal: t.spacing.xxl, gap: 8, marginBottom: 24 }}>
            {hits.map((h) => (
              <Card
                key={h.name}
                style={{ padding: t.spacing.md }}
                onPress={() => router.push({ pathname: '/(client)/search-offerings', params: { name: h.name } })}
              >
                <Row justify="space-between">
                  <View style={{ flex: 1 }}>
                    <T variant="body">{h.name}</T>
                    <T variant="small" style={{ marginTop: 3 }}>
                      {h.salonCount} {h.salonCount === 1 ? 'salon' : 'salons'}
                    </T>
                  </View>
                  {h.durationMin != null && <T variant="small">{h.durationMin} min</T>}
                </Row>
              </Card>
            ))}
            {hits.length === 0 && <T variant="caption">No services found.</T>}
          </View>
        </>
      )}

      {/* Barbers — availability only (A3, no rating) */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Barbers</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {filteredBarbers.map((b) => (
          <Card
            key={b.staffId}
            style={{ padding: t.spacing.md }}
            onPress={() => router.push({ pathname: '/(client)/barber/[id]', params: { id: b.staffId } })}
          >
            <Row justify="space-between">
              <Row gap={12}>
                <Avatar initials={b.initials} size={46} />
                <View>
                  <Row gap={6}>
                    <T variant="body">{b.name}</T>
                    {b.isPro && <Badge variant="pro">PRO</Badge>}
                  </Row>
                  {!!b.title && <T variant="small" style={{ marginTop: 2 }}>{b.title}</T>}
                  {/* PAS d'étoile / note — aucune source en base (A3) */}
                </View>
              </Row>
              <Badge variant={b.isAvailable ? 'success' : 'neutral'}>
                {b.isAvailable ? 'Available' : 'Off today'}
              </Badge>
            </Row>
          </Card>
        ))}
        {!loadingLanding && filteredBarbers.length === 0 && (
          <T variant="caption">No barbers found.</T>
        )}
      </View>
    </Screen>
  );
}

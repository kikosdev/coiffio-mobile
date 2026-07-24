import { useEffect, useMemo, useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Avatar, Badge, Eyebrow } from '../../src/components/kit';
import { useSearchStore } from '../../src/stores/search';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { formatMoney } from '../../src/utils/formatMoney';
import { Search as SearchIcon, Scissors, Palette, User, Sparkles, Baby, Tag, MapPin, X } from 'lucide-react-native';

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const { status: locStatus, coords, request: requestLocation } = useUserLocation();

  const {
    categories, hits, barbers, offerings, loadingLanding, loadingOfferings,
    fetchLanding, searchServices, fetchOfferings,
  } = useSearchStore();

  useEffect(() => {
    fetchLanding();
  }, [fetchLanding]);

  useEffect(() => {
    const timer = setTimeout(() => searchServices(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchServices]);

  const hasFilters = selectedCategories.length > 0 || selectedNames.length > 0;

  useEffect(() => {
    if (!hasFilters) return;
    if (locStatus === 'idle') requestLocation();
  }, [hasFilters, locStatus, requestLocation]);

  useEffect(() => {
    if (!hasFilters) return;
    fetchOfferings(
      { categories: selectedCategories, names: selectedNames },
      coords?.lat,
      coords?.lng,
    );
  }, [coords, fetchOfferings, hasFilters, selectedCategories, selectedNames]);

  const isSearching = query.trim().length >= 2;
  const filteredBarbers = barbers.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
  const selectedCount = selectedCategories.length + selectedNames.length;
  const selectedLabels = useMemo(() => [...selectedCategories, ...selectedNames], [selectedCategories, selectedNames]);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  }

  function toggleName(name: string) {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedNames([]);
  }

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
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderColor: selectedCategories.includes(c.category) ? t.color.gold : t.color.borderSubtle,
                    borderWidth: 1,
                  }}
                  onPress={() => toggleCategory(c.category)}
                >
                  <Row gap={8}>
                    <Icon size={15} color={t.color.gold} />
                    <T variant="body">{c.category}</T>
                    <Badge variant="neutral">{c.serviceCount}</Badge>
                    {selectedCategories.includes(c.category) && <X size={13} color={t.color.gold} />}
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
                style={{
                  padding: t.spacing.md,
                  borderColor: selectedNames.includes(h.name) ? t.color.gold : t.color.borderSubtle,
                  borderWidth: 1,
                }}
                onPress={() => toggleName(h.name)}
              >
                <Row justify="space-between">
                  <View style={{ flex: 1 }}>
                    <T variant="body">{h.name}</T>
                    <T variant="small" style={{ marginTop: 3 }}>
                      {h.salonCount} {h.salonCount === 1 ? 'salon' : 'salons'}
                    </T>
                  </View>
                  <Row gap={8}>
                    {h.durationMin != null && <T variant="small">{h.durationMin} min</T>}
                    {selectedNames.includes(h.name) && <X size={14} color={t.color.gold} />}
                  </Row>
                </Row>
              </Card>
            ))}
            {hits.length === 0 && <T variant="caption">No services found.</T>}
          </View>
        </>
      )}

      {hasFilters && (
        <>
          <Row
            justify="space-between"
            style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}
          >
            <Eyebrow>Filtered salons</Eyebrow>
            <Card style={{ paddingVertical: 7, paddingHorizontal: 10 }} onPress={clearFilters}>
              <Row gap={6}>
                <X size={13} color={t.color.textSecondary} />
                <T variant="small">Clear {selectedCount}</T>
              </Row>
            </Card>
          </Row>
          <View style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 24 }}>
            <T variant="small" style={{ marginBottom: 10 }}>
              {selectedLabels.join(' + ')}
            </T>
            <View style={{ gap: 10 }}>
              {offerings.map((o) => (
                <Card
                  key={o.salonId}
                  style={{ padding: t.spacing.md }}
                  onPress={() => router.push({ pathname: '/(client)/salon/[id]', params: { id: o.salonId } })}
                >
                  <Row justify="space-between">
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Row gap={6}>
                        <T variant="body">{o.name}</T>
                        {o.isOpen === true && <Badge variant="success">Open</Badge>}
                      </Row>
                      {!!o.serviceName && (
                        <T variant="small" style={{ marginTop: 3 }} numberOfLines={1}>
                          {o.serviceName}
                        </T>
                      )}
                      <Row gap={4} style={{ marginTop: 4 }}>
                        <MapPin size={11} color={t.color.textSecondary} />
                        <T variant="small">
                          {o.distanceKm != null ? `${o.distanceKm} km` : 'Distance unavailable'}
                        </T>
                        {o.durationMin != null && <T variant="small"> · {o.durationMin} min</T>}
                      </Row>
                    </View>
                    {o.price != null && <T variant="label" color={t.color.gold}>{formatMoney(o.price)}</T>}
                  </Row>
                </Card>
              ))}
              {loadingOfferings && <T variant="caption">Loading salons…</T>}
              {!loadingOfferings && offerings.length === 0 && (
                <T variant="caption">No salons match all selected services.</T>
              )}
            </View>
          </View>
        </>
      )}

      {/* Barbers — availability only (A3, no rating) */}
      {!hasFilters && (
        <>
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
        </>
      )}
    </Screen>
  );
}

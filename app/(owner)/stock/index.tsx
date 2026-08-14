import React, { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Badge } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as stockApi from '../../../src/api/owner/stock';
import { Product } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';

type StatusFilter = 'all' | 'low' | 'out';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'low', label: 'Stock bas' },
  { value: 'out', label: 'Rupture' },
];

function isLow(p: Product): boolean {
  return p.stock > 0 && p.stock <= p.lowStockAt;
}
function isOut(p: Product): boolean {
  return p.stock <= 0;
}

function openDetail(p: Product): void {
  router.push({ pathname: '/(owner)/stock/[id]', params: { id: p._id, product: JSON.stringify(p) } } as never);
}

function ProductRow({ p }: { p: Product }): React.JSX.Element {
  const t = useTheme();
  const low = isLow(p);
  const out = isOut(p);

  return (
    <Card style={{ padding: 0, overflow: 'hidden', flexDirection: 'row' }} onPress={() => openDetail(p)}>
      {(low || out) && <View style={{ width: 4, backgroundColor: out ? t.color.danger : t.color.pending }} />}
      <View style={{ flex: 1, padding: t.spacing.md }}>
        <Row justify="space-between">
          <View style={{ flex: 1 }}>
            <T variant="body" numberOfLines={1}>{p.name}</T>
            {p.category ? <T variant="small" color={t.color.textMuted} style={{ marginTop: 1 }}>{p.category}</T> : null}
          </View>
          <T variant="label">{formatMoney(p.price)}</T>
        </Row>
        <Row justify="space-between" style={{ marginTop: 6 }}>
          <Row gap={6}>
            <T variant="small" color={t.color.textSecondary}>{p.stock} en stock</T>
            {out && <Badge variant="danger">Rupture</Badge>}
            {!out && low && <Badge variant="pending">Bas</Badge>}
          </Row>
          <TouchableOpacity
            hitSlop={8}
            onPress={() => router.push({ pathname: '/(owner)/stock/restock', params: { id: p._id, product: JSON.stringify(p) } } as never)}
            style={{
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: t.color.surfaceElevated,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={15} color={t.color.gold} />
          </TouchableOpacity>
        </Row>
      </View>
    </Card>
  );
}

export default function OwnerStock(): React.JSX.Element {
  const t = useTheme();
  const resource = useResource(() => stockApi.listProducts(), []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<string | null>(null);

  const all = resource.data ?? [];
  const totalCount = all.length;
  const lowCount = all.filter(isLow).length;
  const outCount = all.filter(isOut).length;
  const categories = Array.from(new Set(all.map((p) => p.category).filter((c) => c.length > 0))).sort();

  const searchLower = search.trim().toLowerCase();
  const filtered = all.filter((p) => {
    if (searchLower && !p.name.toLowerCase().includes(searchLower)) return false;
    if (status === 'low' && !isLow(p)) return false;
    if (status === 'out' && !isOut(p)) return false;
    if (category && p.category !== category) return false;
    return true;
  });

  const inputStyle = {
    backgroundColor: t.color.surfaceCard,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderSubtle,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: t.color.textPrimary,
    fontSize: 14,
    fontFamily: t.typography.family.sansMedium,
    flex: 1,
  };

  return (
    // scroll=false + our own inner ScrollView: the FAB below must stay pinned to the screen,
    // not scroll away with the list — Screen's default `scroll` wraps children in a
    // ScrollView, which would position an absolute child relative to the scrolling content.
    <Screen scroll={false}>
      <ScreenHeader title="Stock" subtitle="Produits & inventaire" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxxl + 72 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary — derived from the already-fetched list, no extra call */}
        <Card style={{ padding: t.spacing.md }}>
          <Row justify="space-between">
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle">{totalCount}</T>
              <T variant="small" color={t.color.textMuted}>Produits</T>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle" color={lowCount > 0 ? t.color.pending : t.color.textPrimary}>{lowCount}</T>
              <T variant="small" color={t.color.textMuted}>Bas</T>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle" color={outCount > 0 ? t.color.danger : t.color.textPrimary}>{outCount}</T>
              <T variant="small" color={t.color.textMuted}>Rupture</T>
            </View>
          </Row>
        </Card>

        {/* Search */}
        <Row gap={8} style={{ alignItems: 'center' }}>
          <Search size={16} color={t.color.textMuted} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
          <TextInput
            style={[inputStyle, { paddingLeft: 36 }]}
            placeholder="Rechercher un produit"
            placeholderTextColor={t.color.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </Row>

        {/* Status filter */}
        <Row gap={8}>
          {STATUS_FILTERS.map((f) => {
            const selected = status === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setStatus(f.value)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: t.radius.md, alignItems: 'center',
                  backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                  borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                }}
              >
                <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{f.label}</T>
              </TouchableOpacity>
            );
          })}
        </Row>

        {/* Category chips */}
        {categories.length > 0 && (
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={() => setCategory(null)}
              style={{
                paddingVertical: 6, paddingHorizontal: 12, borderRadius: t.radius.pill,
                backgroundColor: category === null ? t.color.surfaceElevated : t.color.surfaceCard,
                borderWidth: 1, borderColor: t.color.borderSubtle,
              }}
            >
              <T variant="small" color={t.color.textSecondary}>Toutes catégories</T>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(category === c ? null : c)}
                style={{
                  paddingVertical: 6, paddingHorizontal: 12, borderRadius: t.radius.pill,
                  backgroundColor: category === c ? t.color.surfaceElevated : t.color.surfaceCard,
                  borderWidth: 1, borderColor: category === c ? t.color.gold : t.color.borderSubtle,
                }}
              >
                <T variant="small" color={category === c ? t.color.gold : t.color.textSecondary}>{c}</T>
              </TouchableOpacity>
            ))}
          </Row>
        )}

        <ResourceView state={resource} emptyLabel="Aucun produit pour le moment.">
          {() => (
            <View style={{ gap: 10 }}>
              {filtered.length === 0 ? (
                <T variant="small" color={t.color.textMuted}>Aucun résultat pour ces filtres.</T>
              ) : (
                filtered.map((p) => <ProductRow key={p._id} p={p} />)
              )}
            </View>
          )}
        </ResourceView>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(owner)/stock/new' as never)}
        style={{
          position: 'absolute', right: t.spacing.xxl, bottom: t.spacing.xxl,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: t.color.gold,
          alignItems: 'center', justifyContent: 'center',
          elevation: 6,
        }}
      >
        <Plus size={26} color={t.color.onGold} />
      </TouchableOpacity>
    </Screen>
  );
}

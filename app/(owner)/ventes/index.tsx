import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Eyebrow, Badge } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as salesApi from '../../../src/api/owner/sales';
import { Sale } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';

type Period = 'day' | 'week' | 'month';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];

const METHOD_LABEL: Record<string, string> = { cash: 'Espèces', card: 'Carte' };

function openDetail(saleId: string): void {
  router.push(('/(owner)/ventes/' + saleId) as never);
}

function SaleRow({ sale }: { sale: Sale }): React.JSX.Element {
  const t = useTheme();
  const unitCount = sale.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Card style={{ padding: t.spacing.md }} onPress={() => openDetail(sale._id)}>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <T variant="body">{formatSalonDate(sale.date, 'd MMM')} · {formatSalonTime(sale.date)}</T>
          <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>
            {unitCount} article{unitCount > 1 ? 's' : ''} · {sale.method ? METHOD_LABEL[sale.method] ?? sale.method : '—'}
          </T>
        </View>
        <Row gap={8}>
          {sale.voided && <Badge variant="neutral">Annulée</Badge>}
          <T variant="label" color={sale.voided ? t.color.textMuted : t.color.textPrimary}>{formatMoney(sale.total)}</T>
        </Row>
      </Row>
    </Card>
  );
}

export default function OwnerVentes(): React.JSX.Element {
  const t = useTheme();
  const [period, setPeriod] = useState<Period>('day');

  const resource = useResource(async () => {
    const [sales, bestSellers] = await Promise.all([
      salesApi.list({ period }),
      salesApi.bestSellers({ period, limit: 5 }),
    ]);
    return { sales, bestSellers };
  }, [period]);

  const activeSales = (resource.data?.sales ?? []).filter((s) => !s.voided);
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const txnCount = activeSales.length;
  const unitsSold = activeSales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.qty, 0), 0);
  const avgBasket = txnCount > 0 ? totalRevenue / txnCount : 0;

  const bestSellers = resource.data?.bestSellers ?? [];
  const maxRevenue = Math.max(1, ...bestSellers.map((b) => b.revenue));

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Ventes" subtitle="Ventes retail au comptoir" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, paddingBottom: t.spacing.xxxl + 72 }}
        showsVerticalScrollIndicator={false}
      >
        <Row gap={8}>
          {PERIODS.map((p) => {
            const selected = period === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPeriod(p.value)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: t.radius.md, alignItems: 'center',
                  backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                  borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                }}
              >
                <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{p.label}</T>
              </TouchableOpacity>
            );
          })}
        </Row>

        <ResourceView state={resource} emptyLabel="Aucune vente sur cette période.">
          {() => (
            <>
              {/* Hero */}
              <Card style={{ padding: t.spacing.lg }}>
                <Eyebrow>CA retail</Eyebrow>
                <T variant="hero" style={{ marginTop: 4 }}>{formatMoney(totalRevenue)}</T>
                <Row gap={0} style={{ marginTop: 14 }}>
                  <View style={{ flex: 1 }}>
                    <T variant="subtitle">{txnCount}</T>
                    <T variant="small" color={t.color.textMuted}>Ventes</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="subtitle">{unitsSold}</T>
                    <T variant="small" color={t.color.textMuted}>Unités</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(avgBasket)}</T>
                    <T variant="small" color={t.color.textMuted}>Panier moyen</T>
                  </View>
                </Row>
              </Card>

              {/* Best-sellers */}
              {bestSellers.length > 0 && (
                <View>
                  <Eyebrow style={{ marginBottom: 10 }}>Meilleures ventes</Eyebrow>
                  <View style={{ gap: 12 }}>
                    {bestSellers.map((b) => (
                      <View key={b.refId}>
                        <Row justify="space-between" style={{ marginBottom: 6 }}>
                          <T variant="body" numberOfLines={1} style={{ flex: 1 }}>{b.name}</T>
                          <T variant="small" color={t.color.textSecondary}>{b.qty} u · {formatMoney(b.revenue)}</T>
                        </Row>
                        <View style={{ height: 8, backgroundColor: t.color.surfaceElevated, borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{
                            height: 8, width: `${Math.round((b.revenue / maxRevenue) * 100)}%`,
                            backgroundColor: t.color.gold, borderRadius: 4,
                          }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* History */}
              <View>
                <Eyebrow style={{ marginBottom: 10 }}>Historique</Eyebrow>
                <View style={{ gap: 8 }}>
                  {(resource.data?.sales ?? []).map((s) => <SaleRow key={s._id} sale={s} />)}
                </View>
              </View>
            </>
          )}
        </ResourceView>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(owner)/ventes/new' as never)}
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

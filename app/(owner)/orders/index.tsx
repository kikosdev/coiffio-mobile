import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Eyebrow, Badge, Button, Divider } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as ordersApi from '../../../src/api/owner/orders';
import { ApiError } from '../../../src/api/client';
import { Order, OrderStatus } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';

// Real backend enum (orders/schemas/order.schema.ts) — not invented.
const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'ready', 'picked_up', 'cancelled'];

// Real transition table, copied from orders.service.ts's TRANSITIONS map — the backend is what
// actually enforces this; this is the UI's best-effort mirror so illegal buttons never render.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['picked_up', 'cancelled'],
  picked_up: [],
  cancelled: [],
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'neutral' | 'gold' | 'success' | 'pending' | 'danger' | 'pro' }> = {
  pending: { label: 'En attente', variant: 'pending' },
  confirmed: { label: 'Confirmée', variant: 'gold' },
  ready: { label: 'Prête', variant: 'gold' },
  picked_up: { label: 'Récupérée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'neutral' },
};

/** Order has no orderNumber field — this is a display-only stand-in derived from _id, not a real field. */
function shortRef(order: Order): string {
  return order._id.slice(-6).toUpperCase();
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }): React.JSX.Element {
  const t = useTheme();
  const status = STATUS_CONFIG[order.status];
  const unitCount = order.items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Card style={{ padding: t.spacing.md }} onPress={onPress}>
      <Row justify="space-between">
        <View style={{ flex: 1 }}>
          <T variant="body">#{shortRef(order)}</T>
          <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>
            {formatSalonDate(order.date, 'd MMM')} · {formatSalonTime(order.date)} · {unitCount} article{unitCount > 1 ? 's' : ''}
          </T>
        </View>
        <Row gap={8}>
          <Badge variant={status.variant}>{status.label}</Badge>
        </Row>
      </Row>
      <Row justify="space-between" style={{ marginTop: 6 }}>
        <T variant="small" color={t.color.textMuted}>{order.delivery ? 'Livraison' : 'Retrait'}</T>
        <T variant="label">{formatMoney(order.total)}</T>
      </Row>
    </Card>
  );
}

function OrderActionSheet({
  order, onClose, onChanged,
}: { order: Order; onClose: () => void; onChanged: () => Promise<void> }): React.JSX.Element {
  const t = useTheme();
  const [updating, setUpdating] = useState<OrderStatus | null>(null);
  const legalNext = TRANSITIONS[order.status];

  async function doTransition(next: OrderStatus): Promise<void> {
    setUpdating(next);
    try {
      await ordersApi.updateStatus(order._id, { status: next });
      await onChanged();
      onClose();
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError ? err.message : 'Transition refusée par le serveur.');
    } finally {
      setUpdating(null);
    }
  }

  function confirmTransition(next: OrderStatus): void {
    const label = STATUS_CONFIG[next].label;
    const extra = next === 'picked_up' ? '\n\nUne vente sera enregistrée automatiquement.' : '';
    Alert.alert(`Passer à "${label}" ?`, `Commande #${shortRef(order)}${extra}`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: () => doTransition(next) },
    ]);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{
          backgroundColor: t.color.surfaceCard,
          borderTopLeftRadius: t.radius.xl, borderTopRightRadius: t.radius.xl,
          padding: t.spacing.lg, maxHeight: '80%',
        }}>
          <Row justify="space-between" style={{ marginBottom: 10 }}>
            <T variant="subtitle">Commande #{shortRef(order)}</T>
            <Badge variant={STATUS_CONFIG[order.status].variant}>{STATUS_CONFIG[order.status].label}</Badge>
          </Row>
          <T variant="small" color={t.color.textSecondary} style={{ marginBottom: 14 }}>
            {formatSalonDate(order.date, 'EEEE d MMMM yyyy')} · {formatSalonTime(order.date)} · {order.delivery ? 'Livraison' : 'Retrait'}
          </T>

          <ScrollView style={{ maxHeight: 240 }}>
            {order.items.map((line, i) => (
              <Row key={i} justify="space-between" style={{ marginBottom: 8 }}>
                <T variant="body" style={{ flex: 1 }}>{line.name} × {line.qty}</T>
                <T variant="small" color={t.color.textSecondary}>{formatMoney(line.unitPrice * line.qty)}</T>
              </Row>
            ))}
          </ScrollView>

          <Divider style={{ marginVertical: 10 }} />
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <T variant="label">Total</T>
            <T variant="label">{formatMoney(order.total)}</T>
          </Row>

          {legalNext.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Eyebrow>Changer le statut</Eyebrow>
              {legalNext.map((next) => (
                <Button
                  key={next}
                  variant={next === 'cancelled' ? 'dark' : 'white'}
                  fullWidth
                  disabled={updating !== null}
                  onPress={() => confirmTransition(next)}
                >
                  {updating === next ? 'Mise à jour…' : `→ ${STATUS_CONFIG[next].label}`}
                </Button>
              ))}
            </View>
          ) : (
            <T variant="small" color={t.color.textMuted}>Statut final — aucune transition possible.</T>
          )}

          <Button variant="ghost" fullWidth style={{ marginTop: 12 }} onPress={onClose}>
            Fermer
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export default function OwnerOrders(): React.JSX.Element {
  const t = useTheme();
  const resource = useResource(() => ordersApi.list(), []);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  // Status can change from the action sheet — refetch whenever this tab regains focus, same
  // pattern as agenda.tsx (P5), rather than trying to patch the in-memory list by hand.
  useFocusEffect(useCallback(() => {
    resource.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const all = resource.data ?? [];
  const searchLower = search.trim().toLowerCase();
  const filtered = all
    .filter((o) => !statusFilter || o.status === statusFilter)
    .filter((o) => {
      if (!searchLower) return true;
      if (shortRef(o).toLowerCase().includes(searchLower)) return true;
      return o.items.some((i) => i.name.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const countsByStatus = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = all.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<OrderStatus, number>);
  const loadedRevenue = all.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);

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
  };

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Commandes" subtitle="Commandes retrait boutique" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs — derived from the loaded list only, not a stats endpoint (doesn't exist) */}
        <Card style={{ padding: t.spacing.md }}>
          <Eyebrow style={{ marginBottom: 8 }}>Commandes chargées</Eyebrow>
          <Row justify="space-between">
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle">{all.length}</T>
              <T variant="small" color={t.color.textMuted}>Total</T>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle" color={countsByStatus.pending > 0 ? t.color.pending : t.color.textPrimary}>
                {countsByStatus.pending}
              </T>
              <T variant="small" color={t.color.textMuted}>En attente</T>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(loadedRevenue)}</T>
              <T variant="small" color={t.color.textMuted}>CA (hors annulées)</T>
            </View>
          </Row>
        </Card>

        <TextInput
          style={inputStyle}
          placeholder="Rechercher par n° commande ou article"
          placeholderTextColor={t.color.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <TouchableOpacity
            onPress={() => setStatusFilter(null)}
            style={{
              paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
              backgroundColor: statusFilter === null ? t.color.gold : t.color.surfaceCard,
              borderWidth: 1, borderColor: statusFilter === null ? t.color.gold : t.color.borderSubtle,
            }}
          >
            <T variant="small" color={statusFilter === null ? t.color.onGold : t.color.textSecondary}>Toutes</T>
          </TouchableOpacity>
          {ALL_STATUSES.map((s) => {
            const selectedFilter = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(selectedFilter ? null : s)}
                style={{
                  paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
                  backgroundColor: selectedFilter ? t.color.gold : t.color.surfaceCard,
                  borderWidth: 1, borderColor: selectedFilter ? t.color.gold : t.color.borderSubtle,
                }}
              >
                <T variant="small" color={selectedFilter ? t.color.onGold : t.color.textSecondary}>
                  {STATUS_CONFIG[s].label} ({countsByStatus[s]})
                </T>
              </TouchableOpacity>
            );
          })}
        </Row>

        <ResourceView state={resource} emptyLabel="Aucune commande pour le moment.">
          {() => (
            <View style={{ gap: 8 }}>
              {filtered.length === 0 ? (
                <T variant="small" color={t.color.textMuted}>Aucun résultat pour ces filtres.</T>
              ) : (
                filtered.map((o) => <OrderRow key={o._id} order={o} onPress={() => setSelected(o)} />)
              )}
            </View>
          )}
        </ResourceView>
      </ScrollView>

      {selected && (
        <OrderActionSheet
          order={selected}
          onClose={() => setSelected(null)}
          onChanged={resource.reload}
        />
      )}
    </Screen>
  );
}

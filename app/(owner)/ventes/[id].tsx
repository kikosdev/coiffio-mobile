import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Card, Badge, Button, Divider } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as salesApi from '../../../src/api/owner/sales';
import { ApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/auth';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';

const METHOD_LABEL: Record<string, string> = { cash: 'Espèces', card: 'Carte' };

export default function SaleDetail(): React.JSX.Element {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const saleId = id ?? '';
  const [voiding, setVoiding] = useState(false);

  // Décision #8: void = owner only. The (owner) route group already gates every screen here to
  // role === 'owner' (useRoleGuard in _layout.tsx), but the action is checked again explicitly —
  // the backend guard is what actually enforces it either way.
  const isOwner = useAuthStore((s) => s.user?.role === 'owner');

  const resource = useResource(() => salesApi.get(saleId), [saleId]);

  async function doVoid(restock: boolean): Promise<void> {
    setVoiding(true);
    try {
      await salesApi.voidSale(saleId, restock);
      Alert.alert('Vente annulée', restock ? 'Le stock a été réapprovisionné.' : 'Le stock n\'a pas été modifié.');
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError ? err.message : "Impossible d'annuler cette vente.");
    } finally {
      setVoiding(false);
    }
  }

  function handleVoidPress(): void {
    Alert.alert(
      'Annuler cette vente ?',
      'Choisissez si les articles doivent être réintégrés au stock.',
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Sans réapprovisionner', onPress: () => doVoid(false) },
        { text: 'Avec réapprovisionnement', style: 'destructive', onPress: () => doVoid(true) },
      ],
    );
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Vente</T>
        <View style={{ width: 32 }} />
      </Row>

      <ResourceView state={resource} emptyLabel="Vente introuvable.">
        {(sale) => (
          <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
            <Row justify="space-between">
              <View>
                <T variant="title">{formatSalonDate(sale.date, 'EEEE d MMMM')}</T>
                <T variant="small" color={t.color.textSecondary}>{formatSalonTime(sale.date)}</T>
              </View>
              {sale.voided && <Badge variant="neutral">Annulée</Badge>}
            </Row>

            <Card style={{ padding: t.spacing.md }}>
              {sale.items.map((line, i) => (
                <Row key={i} justify="space-between" style={{ marginBottom: 6 }}>
                  <T variant="body" style={{ flex: 1 }}>{line.name} × {line.qty}</T>
                  <T variant="small" color={t.color.textSecondary}>{formatMoney(line.unitPrice * line.qty)}</T>
                </Row>
              ))}
              <Divider style={{ marginVertical: 8 }} />
              <Row justify="space-between" style={{ marginBottom: sale.discount ? 4 : 0 }}>
                <T variant="small" color={t.color.textSecondary}>Sous-total</T>
                <T variant="small">{formatMoney(sale.subtotal)}</T>
              </Row>
              {sale.discount && (
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <T variant="small" color={t.color.textSecondary}>
                    Remise {sale.discount.type === 'pct' ? `(${sale.discount.value}%)` : ''}
                  </T>
                  <T variant="small" color={t.color.danger}>-{formatMoney(sale.discount.computed)}</T>
                </Row>
              )}
              <Row justify="space-between" style={{ marginTop: 4 }}>
                <T variant="label">Total</T>
                <T variant="label">{formatMoney(sale.total)}</T>
              </Row>
            </Card>

            <Card style={{ padding: t.spacing.md }}>
              <Row justify="space-between">
                <T variant="small" color={t.color.textSecondary}>Méthode</T>
                <T variant="small">{sale.method ? METHOD_LABEL[sale.method] ?? sale.method : '—'}</T>
              </Row>
            </Card>

            {!sale.voided && isOwner && sale.paymentId && (
              <Button
                variant="dark"
                fullWidth
                onPress={() => router.push({
                  pathname: '/(owner)/caisse/refund',
                  params: { paymentId: sale.paymentId, amount: String(sale.total) },
                } as never)}
              >
                Rembourser le paiement
              </Button>
            )}

            {!sale.voided && isOwner && (
              <Button variant="dark" fullWidth disabled={voiding} onPress={handleVoidPress}>
                {voiding ? 'Annulation…' : 'Annuler la vente'}
              </Button>
            )}
          </View>
        )}
      </ResourceView>
    </Screen>
  );
}

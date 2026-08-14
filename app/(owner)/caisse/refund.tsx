import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import * as caisseApi from '../../../src/api/owner/caisse';
import { ApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/auth';
import { formatMoney } from '../../../src/utils/formatMoney';

/**
 * There is no GET /payments or GET /payments/:id on the backend — only POST /payments,
 * POST /payments/:id/refund, and the salon-wide (aggregate-only) GET /caisse/overview. So this
 * screen can't fetch/display real payment details; it only accepts a `paymentId` (and an
 * optional `amount` the caller already knows, e.g. from a linked Sale) passed via nav params.
 * The one real entry point today is ventes/[id].tsx, when a sale carries a `paymentId`.
 */
export default function Refund(): React.JSX.Element {
  const t = useTheme();
  const { paymentId, amount } = useLocalSearchParams<{ paymentId?: string; amount?: string }>();
  const [refunding, setRefunding] = useState(false);

  // Décision #8: refund = owner only — structural (route group) + explicit here.
  const isOwner = useAuthStore((s) => s.user?.role === 'owner');

  useEffect(() => {
    if (!paymentId || !isOwner) router.back();
  }, [paymentId, isOwner]);

  if (!paymentId || !isOwner) return <Screen><View /></Screen>;

  function handleRefund(): void {
    Alert.alert(
      'Rembourser ce paiement ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rembourser',
          style: 'destructive',
          onPress: async () => {
            setRefunding(true);
            try {
              await caisseApi.refund(paymentId as string);
              Alert.alert('Paiement remboursé');
              router.back();
            } catch (err) {
              Alert.alert('Erreur', err instanceof ApiError ? err.message : 'Impossible de rembourser ce paiement.');
            } finally {
              setRefunding(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Rembourser</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <Card style={{ padding: t.spacing.md }}>
          <Eyebrow>Paiement</Eyebrow>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 4 }}>{paymentId}</T>
          {amount ? (
            <T variant="subtitle" style={{ marginTop: 8 }}>{formatMoney(Number(amount))}</T>
          ) : null}
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 8 }}>
            {amount ? 'Montant de la vente associée — informatif, peut différer du paiement (pourboire non inclus).' : ''}
          </T>
        </Card>

        <Button variant="dark" fullWidth disabled={refunding} onPress={handleRefund}>
          {refunding ? 'Remboursement…' : 'Rembourser le paiement'}
        </Button>
      </View>
    </Screen>
  );
}

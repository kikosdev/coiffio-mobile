import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import * as caisseApi from '../../../src/api/owner/caisse';
import * as stockApi from '../../../src/api/owner/stock';
import * as servicesApi from '../../../src/api/owner/services';
import * as teamApi from '../../../src/api/owner/team';
import { ApiError } from '../../../src/api/client';
import { useResource } from '../../../src/hooks/useResource';
import { PaymentLine } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';

function parseLines(raw?: string): PaymentLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PaymentLine[]) : [];
  } catch {
    return [];
  }
}

export default function Checkout(): React.JSX.Element {
  const t = useTheme();
  const { appointmentId, stylistId: stylistIdParam, lines: linesParam } = useLocalSearchParams<{
    appointmentId?: string; stylistId?: string; lines?: string;
  }>();

  const [lines, setLines] = useState<PaymentLine[]>(() => parseLines(linesParam));
  const [stylistId, setStylistId] = useState<string | null>(stylistIdParam ?? null);
  const [tip, setTip] = useState('');
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [productSearch, setProductSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staff = useResource(() => teamApi.list(), []);
  const catalog = useResource(() => servicesApi.list(), []);
  const products = useResource(() => stockApi.listProducts(), []);

  const stylists = (staff.data ?? []).filter((s) => s.role === 'stylist' || s.role === 'colorist' || s.role === 'manager');
  const selectedStylist = stylists.find((s) => s.id === stylistId);

  const productSearchLower = productSearch.trim().toLowerCase();
  const productResults = productSearchLower
    ? (products.data ?? []).filter((p) => p.name.toLowerCase().includes(productSearchLower))
    : [];

  const serviceSearchLower = serviceSearch.trim().toLowerCase();
  const serviceResults = serviceSearchLower
    ? (catalog.data ?? []).filter((s) => s.name.toLowerCase().includes(serviceSearchLower))
    : [];

  function addServiceLine(refId: string, name: string, price: number): void {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === 'service' && l.refId === refId);
      if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { kind: 'service', refId, name, qty: 1, unitPrice: price }];
    });
    setServiceSearch('');
  }

  function addProductLine(refId: string, name: string, price: number, stock: number): void {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === 'product' && l.refId === refId);
      const currentQty = existing?.qty ?? 0;
      if (currentQty >= stock) {
        Alert.alert('Stock insuffisant', `Il ne reste que ${stock} unité(s) de ${name}.`);
        return prev;
      }
      if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { kind: 'product', refId, name, qty: 1, unitPrice: price }];
    });
    setProductSearch('');
  }

  function removeLine(index: number): void {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const tipNum = tip.trim() ? Number(tip.replace(',', '.')) || 0 : 0;
  const total = subtotal + tipNum;

  const servicesSubtotal = lines.filter((l) => l.kind === 'service').reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const commissionPct = selectedStylist?.commissionPct;
  // Mirrors the server's own rounding (finance.service.ts: Math.round(servicesTotal * pct / 100))
  // so the pre-submit estimate lands on the same number the real commission usually will.
  const commissionEstimate = commissionPct !== undefined ? Math.round((servicesSubtotal * commissionPct) / 100) : null;

  const canSubmit = lines.length > 0 && stylistId !== null && !saving;

  const inputStyle = {
    backgroundColor: t.color.surfaceCard,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderSubtle,
    padding: t.spacing.md,
    color: t.color.textPrimary,
    fontSize: 14,
    fontFamily: t.typography.family.sansMedium,
  };

  async function handlePay(): Promise<void> {
    if (!canSubmit || !stylistId) return;
    setSaving(true);
    setError(null);
    try {
      // Money-write: only the inputs go in the body — items/tip/method/appointmentId/stylistId.
      // Never the client-computed `total`; the server derives amount/commission itself.
      const payment = await caisseApi.pay({
        appointmentId: appointmentId || undefined,
        stylistId,
        items: lines,
        tip: tipNum > 0 ? tipNum : undefined,
        method,
      });
      Alert.alert(
        'Paiement encaissé',
        `Total ${formatMoney(payment.amount + payment.tip)} · Commission ${formatMoney(payment.commission)}`,
      );
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ce paiement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Encaisser</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, paddingBottom: t.spacing.xxxl }}>
        {/* Stylist */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Stylist</Eyebrow>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {stylists.map((s) => {
              const selected = stylistId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setStylistId(s.id)}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
                    backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                    borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                  }}
                >
                  <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{s.name}</T>
                </TouchableOpacity>
              );
            })}
          </Row>
        </View>

        {/* Add service */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Ajouter un service</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="Rechercher un service"
            placeholderTextColor={t.color.textMuted}
            value={serviceSearch}
            onChangeText={setServiceSearch}
          />
          {serviceResults.length > 0 && (
            <View style={{ gap: 6, marginTop: 8 }}>
              {serviceResults.slice(0, 5).map((s) => (
                <Card key={s._id} style={{ padding: t.spacing.sm }} onPress={() => addServiceLine(s._id, s.name, s.price)}>
                  <Row justify="space-between">
                    <T variant="body" numberOfLines={1} style={{ flex: 1 }}>{s.name}</T>
                    <T variant="small" color={t.color.textSecondary}>{formatMoney(s.price)}</T>
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Add product */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Ajouter un produit</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="Rechercher un produit"
            placeholderTextColor={t.color.textMuted}
            value={productSearch}
            onChangeText={setProductSearch}
          />
          {productResults.length > 0 && (
            <View style={{ gap: 6, marginTop: 8 }}>
              {productResults.slice(0, 5).map((p) => (
                <Card
                  key={p._id}
                  style={{ padding: t.spacing.sm, opacity: p.stock <= 0 ? 0.5 : 1 }}
                  onPress={() => (p.stock > 0
                    ? addProductLine(p._id, p.name, p.price, p.stock)
                    : Alert.alert('Rupture de stock', `${p.name} n'a plus de stock disponible.`))}
                >
                  <Row justify="space-between">
                    <T variant="body" numberOfLines={1} style={{ flex: 1 }}>{p.name}</T>
                    <T variant="small" color={t.color.textSecondary}>{formatMoney(p.price)}</T>
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Lines */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Panier</Eyebrow>
          {lines.length === 0 ? (
            <T variant="small" color={t.color.textMuted}>Aucune ligne pour le moment.</T>
          ) : (
            <View style={{ gap: 8 }}>
              {lines.map((l, i) => (
                <Row key={`${l.kind}-${l.refId}-${i}`} justify="space-between">
                  <T variant="small" style={{ flex: 1 }} numberOfLines={1}>{l.name} × {l.qty}</T>
                  <Row gap={10}>
                    <T variant="small" color={t.color.textSecondary}>{formatMoney(l.unitPrice * l.qty)}</T>
                    <TouchableOpacity onPress={() => removeLine(i)} hitSlop={8}>
                      <X size={14} color={t.color.textMuted} />
                    </TouchableOpacity>
                  </Row>
                </Row>
              ))}
            </View>
          )}
        </View>

        {/* Tip + method */}
        <Row gap={t.spacing.md}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Pourboire (optionnel)</Eyebrow>
            <TextInput style={inputStyle} placeholder="0.000" placeholderTextColor={t.color.textMuted} value={tip} onChangeText={setTip} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Méthode</Eyebrow>
            <Row gap={6}>
              {(['cash', 'card'] as const).map((m) => {
                const selected = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMethod(m)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: t.radius.md, alignItems: 'center',
                      backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                      borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                    }}
                  >
                    <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{m === 'cash' ? 'Espèces' : 'Carte'}</T>
                  </TouchableOpacity>
                );
              })}
            </Row>
          </View>
        </Row>

        {/* Totals */}
        <Card style={{ padding: t.spacing.md }}>
          <Row justify="space-between" style={{ marginBottom: 4 }}>
            <T variant="small" color={t.color.textSecondary}>Sous-total</T>
            <T variant="small">{formatMoney(subtotal)}</T>
          </Row>
          {tipNum > 0 && (
            <Row justify="space-between" style={{ marginBottom: 4 }}>
              <T variant="small" color={t.color.textSecondary}>Pourboire</T>
              <T variant="small">{formatMoney(tipNum)}</T>
            </Row>
          )}
          <Row justify="space-between" style={{ marginBottom: 4 }}>
            <T variant="small" color={t.color.textSecondary}>
              Commission{commissionEstimate !== null ? ' (estimation)' : ''}
            </T>
            <T variant="small" color={t.color.textMuted}>
              {commissionEstimate !== null ? formatMoney(commissionEstimate) : 'Calculé à la paie'}
            </T>
          </Row>
          <Row justify="space-between" style={{ marginTop: 4 }}>
            <T variant="label">Total</T>
            <T variant="label">{formatMoney(total)}</T>
          </Row>
        </Card>

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={!canSubmit} onPress={handlePay}>
          {saving ? 'Encaissement…' : `Encaisser ${formatMoney(total)}`}
        </Button>
      </View>
    </Screen>
  );
}

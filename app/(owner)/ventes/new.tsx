import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import { NumberStepper } from '../../../src/components/owner/NumberStepper';
import * as stockApi from '../../../src/api/owner/stock';
import * as salesApi from '../../../src/api/owner/sales';
import { ApiError } from '../../../src/api/client';
import { useResource } from '../../../src/hooks/useResource';
import { Product } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';

interface CartLine {
  product: Product;
  qty: number;
}

const METHODS: { value: 'cash' | 'card'; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte' },
];

export default function NewSale(): React.JSX.Element {
  const t = useTheme();
  const catalog = useResource(() => stockApi.listProducts(), []);
  const [search, setSearch] = useState('');
  // In-memory only — never persisted (SecureStore/AsyncStorage), matches a POS cart's lifetime.
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'amount' | 'pct'>('pct');
  const [discountValue, setDiscountValue] = useState('');
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products = catalog.data ?? [];
  const searchLower = search.trim().toLowerCase();
  const results = searchLower ? products.filter((p) => p.name.toLowerCase().includes(searchLower)) : [];

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

  function addProduct(p: Product): void {
    if (p.stock <= 0) {
      Alert.alert('Rupture de stock', `${p.name} n'a plus de stock disponible.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product._id === p._id);
      if (existing) {
        if (existing.qty >= p.stock) {
          Alert.alert('Stock insuffisant', `Il ne reste que ${p.stock} unité(s) de ${p.name}.`);
          return prev;
        }
        return prev.map((l) => (l.product._id === p._id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product: p, qty: 1 }];
    });
    setSearch('');
  }

  function setQty(productId: string, qty: number): void {
    setCart((prev) => prev
      .map((l) => (l.product._id === productId ? { ...l, qty } : l))
      .filter((l) => l.qty > 0));
  }

  function removeLine(productId: string): void {
    setCart((prev) => prev.filter((l) => l.product._id !== productId));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const discountAmount = discountEnabled && discountValue.trim()
    ? Math.min(subtotal, discountType === 'amount'
      ? Number(discountValue.replace(',', '.')) || 0
      : subtotal * ((Number(discountValue.replace(',', '.')) || 0) / 100))
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const canSubmit = cart.length > 0 && !saving;

  async function handleCheckout(): Promise<void> {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await salesApi.create({
        items: cart.map((l) => ({ refId: l.product._id, qty: l.qty })),
        discount: discountEnabled && discountValue.trim()
          ? { type: discountType, value: Number(discountValue.replace(',', '.')) || 0 }
          : undefined,
        method,
      });
      Alert.alert('Vente enregistrée', formatMoney(total));
      setCart([]);
      setDiscountEnabled(false);
      setDiscountValue('');
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer cette vente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll={false}>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Nouvelle vente</T>
        <View style={{ width: 32 }} />
      </Row>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, paddingBottom: t.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Ajouter un produit</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="Rechercher un produit"
            placeholderTextColor={t.color.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {results.length > 0 && (
            <View style={{ gap: 6, marginTop: 8 }}>
              {results.slice(0, 6).map((p) => (
                <Card key={p._id} style={{ padding: t.spacing.sm }} onPress={() => addProduct(p)}>
                  <Row justify="space-between">
                    <View style={{ flex: 1 }}>
                      <T variant="body" numberOfLines={1}>{p.name}</T>
                      <T variant="small" color={p.stock <= 0 ? t.color.danger : t.color.textMuted}>
                        {p.stock <= 0 ? 'Rupture' : `${p.stock} en stock`}
                      </T>
                    </View>
                    <T variant="small" color={t.color.textSecondary}>{formatMoney(p.price)}</T>
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Panier</Eyebrow>
          {cart.length === 0 ? (
            <T variant="small" color={t.color.textMuted}>Aucun article pour le moment.</T>
          ) : (
            <View style={{ gap: 8 }}>
              {cart.map((l) => (
                <Card key={l.product._id} style={{ padding: t.spacing.md }}>
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <T variant="body" style={{ flex: 1 }} numberOfLines={1}>{l.product.name}</T>
                    <TouchableOpacity onPress={() => removeLine(l.product._id)} hitSlop={8}>
                      <X size={16} color={t.color.textMuted} />
                    </TouchableOpacity>
                  </Row>
                  <Row justify="space-between">
                    <NumberStepper value={l.qty} onChange={(v) => setQty(l.product._id, v)} min={0} max={l.product.stock} />
                    <T variant="label">{formatMoney(l.product.price * l.qty)}</T>
                  </Row>
                  {l.qty >= l.product.stock && (
                    <T variant="small" color={t.color.pending} style={{ marginTop: 6 }}>
                      Stock max atteint ({l.product.stock})
                    </T>
                  )}
                </Card>
              ))}
            </View>
          )}
        </View>

        <View>
          <Row justify="space-between" style={{ marginBottom: 7 }}>
            <Eyebrow>Remise (optionnel)</Eyebrow>
            <TouchableOpacity onPress={() => setDiscountEnabled((v) => !v)}>
              <T variant="small" color={t.color.gold}>{discountEnabled ? 'Retirer' : 'Ajouter'}</T>
            </TouchableOpacity>
          </Row>
          {discountEnabled && (
            <Row gap={8}>
              <Row gap={6} style={{ flex: 1 }}>
                {(['pct', 'amount'] as const).map((dt) => {
                  const selected = discountType === dt;
                  return (
                    <TouchableOpacity
                      key={dt}
                      onPress={() => setDiscountType(dt)}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: t.radius.md, alignItems: 'center',
                        backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                        borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                      }}
                    >
                      <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>
                        {dt === 'pct' ? '%' : 'TND'}
                      </T>
                    </TouchableOpacity>
                  );
                })}
              </Row>
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                placeholder="0"
                placeholderTextColor={t.color.textMuted}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="decimal-pad"
              />
            </Row>
          )}
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Méthode de paiement</Eyebrow>
          <Row gap={8}>
            {METHODS.map((m) => {
              const selected = method === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMethod(m.value)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: t.radius.md, alignItems: 'center',
                    backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                    borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                  }}
                >
                  <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{m.label}</T>
                </TouchableOpacity>
              );
            })}
          </Row>
        </View>

        <Card style={{ padding: t.spacing.md }}>
          <Row justify="space-between" style={{ marginBottom: discountAmount > 0 ? 4 : 0 }}>
            <T variant="small" color={t.color.textSecondary}>Sous-total</T>
            <T variant="small">{formatMoney(subtotal)}</T>
          </Row>
          {discountAmount > 0 && (
            <Row justify="space-between" style={{ marginBottom: 4 }}>
              <T variant="small" color={t.color.textSecondary}>Remise</T>
              <T variant="small" color={t.color.danger}>-{formatMoney(discountAmount)}</T>
            </Row>
          )}
          <Row justify="space-between" style={{ marginTop: 4 }}>
            <T variant="label">Total</T>
            <T variant="label">{formatMoney(total)}</T>
          </Row>
        </Card>

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={!canSubmit} onPress={handleCheckout}>
          {saving ? 'Encaissement…' : `Encaisser ${formatMoney(total)}`}
        </Button>
      </ScrollView>
    </Screen>
  );
}

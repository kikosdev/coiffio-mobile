import React, { useEffect, useState } from 'react';
import { Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Button, Divider } from '../../../src/components/kit';
import * as stockApi from '../../../src/api/owner/stock';
import { ApiError } from '../../../src/api/client';
import { Product } from '../../../src/types/owner';

function parseParam(raw?: string): Product | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Product;
  } catch {
    return null;
  }
}

export default function EditProduct(): React.JSX.Element {
  const t = useTheme();
  const { id, product: productParam } = useLocalSearchParams<{ id: string; product?: string }>();
  const product = parseParam(productParam);

  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [cost, setCost] = useState(product ? String(product.cost) : '');
  const [lowStockAt, setLowStockAt] = useState(product ? String(product.lowStockAt) : '');
  const [supplier, setSupplier] = useState(product?.supplier ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [notes, setNotes] = useState(product?.notes ?? '');
  const [visibleLanding, setVisibleLanding] = useState(product?.visibleLanding ?? true);
  const [active, setActive] = useState(product?.active ?? true);
  const [promo, setPromo] = useState(product?.promo ?? false);
  const [promoPercent, setPromoPercent] = useState(product ? String(product.promoPercent) : '0');
  const [promoLabel, setPromoLabel] = useState(product?.promoLabel ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only ever reached from stock/[id].tsx, which always passes the product — a missing param
  // means a stray/direct navigation. router.back() belongs in an effect, not mid-render.
  useEffect(() => {
    if (!product || !id) router.back();
  }, [product, id]);

  if (!product || !id) return <Screen><View /></Screen>;

  const priceNum = Number(price.replace(',', '.'));
  const canSave = name.trim().length >= 2 && !Number.isNaN(priceNum) && priceNum >= 0 && !saving;

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

  function numOrUndefined(v: string): number | undefined {
    if (!v.trim()) return undefined;
    const n = Number(v.replace(',', '.'));
    return Number.isNaN(n) ? undefined : n;
  }

  async function handleSave(): Promise<void> {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Only the fields UpdateProductDto actually accepts — never the raw fetched document
      // (no _id/__v/createdAt/updatedAt/salonId/stock/salesCount in this body).
      await stockApi.updateProduct(id, {
        name: name.trim(),
        category: category.trim() || undefined,
        price: priceNum,
        cost: numOrUndefined(cost),
        lowStockAt: numOrUndefined(lowStockAt),
        supplier: supplier.trim() || undefined,
        barcode: barcode.trim() || undefined,
        notes: notes.trim() || undefined,
        visibleLanding,
        active,
        promo,
        promoPercent: promo ? (numOrUndefined(promoPercent) ?? 0) : undefined,
        promoLabel: promo ? (promoLabel.trim() || undefined) : undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ces modifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Modifier le produit</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Nom</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={name} onChangeText={setName} />
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Catégorie</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={category} onChangeText={setCategory} />
        </View>

        <Row gap={t.spacing.md}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Prix de vente (TND)</Eyebrow>
            <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Coût (TND)</Eyebrow>
            <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
          </View>
        </Row>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Seuil bas</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={lowStockAt} onChangeText={setLowStockAt} keyboardType="number-pad" />
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 6 }}>
            Le stock actuel ({product.stock}) se modifie via Réceptionner/Corriger, pas ici.
          </T>
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Fournisseur (optionnel)</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={supplier} onChangeText={setSupplier} />
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Code-barres (optionnel)</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={barcode} onChangeText={setBarcode} />
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Notes (optionnel)</Eyebrow>
          <TextInput style={inputStyle} placeholderTextColor={t.color.textMuted} value={notes} onChangeText={setNotes} multiline />
        </View>

        <Divider style={{ marginVertical: 4 }} />

        <Eyebrow>Visibilité & promo</Eyebrow>

        <Row justify="space-between">
          <T variant="body">Visible sur la boutique</T>
          <Switch
            value={visibleLanding}
            onValueChange={setVisibleLanding}
            trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
            thumbColor={t.color.textPrimary}
          />
        </Row>

        <Row justify="space-between">
          <T variant="body">Produit actif</T>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
            thumbColor={t.color.textPrimary}
          />
        </Row>

        <Row justify="space-between">
          <T variant="body">En promotion</T>
          <Switch
            value={promo}
            onValueChange={setPromo}
            trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
            thumbColor={t.color.textPrimary}
          />
        </Row>

        {promo && (
          <Row gap={t.spacing.md}>
            <View style={{ flex: 1 }}>
              <Eyebrow style={{ marginBottom: 7 }}>Remise %</Eyebrow>
              <TextInput style={inputStyle} value={promoPercent} onChangeText={setPromoPercent} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow style={{ marginBottom: 7 }}>Étiquette</Eyebrow>
              <TextInput style={inputStyle} placeholder="ex. -20%" placeholderTextColor={t.color.textMuted} value={promoLabel} onChangeText={setPromoLabel} />
            </View>
          </Row>
        )}

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={!canSave} onPress={handleSave}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </View>
    </Screen>
  );
}

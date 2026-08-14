import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Button } from '../../../src/components/kit';
import * as stockApi from '../../../src/api/owner/stock';
import { ApiError } from '../../../src/api/client';

export default function NewProduct(): React.JSX.Element {
  const t = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [lowStockAt, setLowStockAt] = useState('');
  const [supplier, setSupplier] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = Number(price.replace(',', '.'));
  const canSave = name.trim().length >= 2 && price.trim().length > 0 && !Number.isNaN(priceNum) && priceNum >= 0 && !saving;

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
      await stockApi.createProduct({
        name: name.trim(),
        category: category.trim() || undefined,
        price: priceNum,
        cost: numOrUndefined(cost),
        stock: numOrUndefined(stock),
        lowStockAt: numOrUndefined(lowStockAt),
        supplier: supplier.trim() || undefined,
        barcode: barcode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer ce produit.');
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
        <T variant="label">Nouveau produit</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Nom</Eyebrow>
          <TextInput style={inputStyle} placeholder="ex. Shampoing argan 250ml" placeholderTextColor={t.color.textMuted} value={name} onChangeText={setName} />
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Catégorie</Eyebrow>
          <TextInput style={inputStyle} placeholder="ex. Soins cheveux" placeholderTextColor={t.color.textMuted} value={category} onChangeText={setCategory} />
        </View>

        <Row gap={t.spacing.md}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Prix de vente (TND)</Eyebrow>
            <TextInput style={inputStyle} placeholder="0.000" placeholderTextColor={t.color.textMuted} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Coût (TND)</Eyebrow>
            <TextInput style={inputStyle} placeholder="0.000" placeholderTextColor={t.color.textMuted} value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
          </View>
        </Row>

        <Row gap={t.spacing.md}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Stock initial</Eyebrow>
            <TextInput style={inputStyle} placeholder="0" placeholderTextColor={t.color.textMuted} value={stock} onChangeText={setStock} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Seuil bas</Eyebrow>
            <TextInput style={inputStyle} placeholder="0" placeholderTextColor={t.color.textMuted} value={lowStockAt} onChangeText={setLowStockAt} keyboardType="number-pad" />
          </View>
        </Row>

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

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={!canSave} onPress={handleSave}>
          {saving ? 'Création…' : 'Créer le produit'}
        </Button>
      </View>
    </Screen>
  );
}

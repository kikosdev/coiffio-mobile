import React, { useEffect, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import { NumberStepper } from '../../../src/components/owner/NumberStepper';
import * as stockApi from '../../../src/api/owner/stock';
import { ApiError } from '../../../src/api/client';
import { Product } from '../../../src/types/owner';
import { formatSalonDate, nowAsSalonTime } from '../../../src/utils/salonTime';

function parseParam(raw?: string): Product | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Product;
  } catch {
    return null;
  }
}

export default function StockAdjust(): React.JSX.Element {
  const t = useTheme();
  const { id, product: productParam } = useLocalSearchParams<{ id: string; product?: string }>();
  const product = parseParam(productParam);
  const [delta, setDelta] = useState(-1);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!product || !id) router.back();
  }, [product, id]);

  if (!product || !id) return <Screen><View /></Screen>;

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

  const projectedStock = product.stock + delta;

  async function handleSave(): Promise<void> {
    if (delta === 0) {
      setError('La correction doit être différente de 0.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await stockApi.adjust(id as string, { delta, note: note.trim() || undefined });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer la correction.");
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
        <T variant="label">Corriger le stock</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <Card style={{ padding: t.spacing.md }}>
          <T variant="body">{product.name}</T>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>{product.stock} en stock actuellement</T>
        </Card>

        <View>
          <Eyebrow style={{ marginBottom: 12 }}>Correction (perte, casse, comptage…)</Eyebrow>
          <NumberStepper value={delta} onChange={setDelta} />
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
            Nouveau stock : {projectedStock < 0 ? 0 : projectedStock}
          </T>
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Note (optionnel)</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="ex. Casse en boutique"
            placeholderTextColor={t.color.textMuted}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <T variant="small" color={t.color.textMuted}>
          Enregistré à la date du jour ({formatSalonDate(nowAsSalonTime(), 'd MMMM yyyy')}).
        </T>

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={saving} onPress={handleSave}>
          {saving ? 'Enregistrement…' : 'Confirmer la correction'}
        </Button>
      </View>
    </Screen>
  );
}

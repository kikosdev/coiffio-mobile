import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Badge, Button, Divider } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as stockApi from '../../../src/api/owner/stock';
import { ApiError } from '../../../src/api/client';
import { Product, StockMovement } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate } from '../../../src/utils/salonTime';

function parseParam(raw?: string): Product | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Product;
  } catch {
    return null;
  }
}

const MOVE_LABEL: Record<StockMovement['type'], string> = { in: 'Entrée', out: 'Sortie' };

function MovementsList({ productId }: { productId: string }): React.JSX.Element {
  const t = useTheme();
  const resource = useResource(() => stockApi.movements(productId), [productId]);

  return (
    <ResourceView state={resource} emptyLabel="Aucun mouvement enregistré.">
      {(moves) => (
        <View style={{ gap: 8 }}>
          {moves.map((m) => (
            <Row key={m._id} justify="space-between">
              <View>
                <T variant="small">{MOVE_LABEL[m.type]} · {m.qty}</T>
                {m.note ? <T variant="small" color={t.color.textMuted}>{m.note}</T> : null}
              </View>
              <T variant="small" color={t.color.textMuted}>{formatSalonDate(m.date, 'd MMM yyyy')}</T>
            </Row>
          ))}
        </View>
      )}
    </ResourceView>
  );
}

export default function ProductDetail(): React.JSX.Element {
  const t = useTheme();
  const { id, product: productParam } = useLocalSearchParams<{ id: string; product?: string }>();
  const productId = id ?? '';
  const [deleting, setDeleting] = useState(false);
  const paramProduct = parseParam(productParam);

  // Hydrate from the list item passed in nav params (there's no GET /products/:id). Only if
  // this route was entered without that param (deep link / hard refresh) do we fall back to
  // refetching the list and locating the item — and if it's genuinely not there, that's an
  // error, not an empty state.
  const resource = useResource<Product>(async () => {
    if (paramProduct) return paramProduct;
    const all = await stockApi.listProducts();
    const found = all.find((p) => p._id === productId);
    if (!found) throw new ApiError('Produit introuvable.', 404);
    return found;
  }, [productId, productParam]);

  function handleDelete(product: Product): void {
    Alert.alert(
      `Supprimer ${product.name} ?`,
      'Le produit sera archivé (masqué du catalogue).',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await stockApi.removeProduct(product._id);
              router.back();
            } catch (err) {
              Alert.alert('Erreur', err instanceof ApiError ? err.message : 'Impossible de supprimer ce produit.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Produit</T>
        <View style={{ width: 32 }} />
      </Row>

      <ResourceView state={resource} emptyLabel="Produit introuvable.">
        {(product) => {
          const margin = product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0;
          const out = product.stock <= 0;
          const low = !out && product.stock <= product.lowStockAt;

          return (
            <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
              <Row justify="space-between">
                <View style={{ flex: 1 }}>
                  <T variant="title">{product.name}</T>
                  {product.category ? <T variant="small" color={t.color.textSecondary}>{product.category}</T> : null}
                </View>
                {out && <Badge variant="danger">Rupture</Badge>}
                {!out && low && <Badge variant="pending">Stock bas</Badge>}
              </Row>

              {/* Stock */}
              <Card style={{ padding: t.spacing.lg, alignItems: 'center' }}>
                <T variant="hero">{product.stock}</T>
                <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>
                  en stock · seuil bas {product.lowStockAt}
                </T>
              </Card>

              {/* Pricing */}
              <Card style={{ padding: t.spacing.md }}>
                <Row justify="space-between" style={{ marginBottom: 6 }}>
                  <T variant="small" color={t.color.textSecondary}>Prix de vente</T>
                  <T variant="body">{formatMoney(product.price)}</T>
                </Row>
                <Row justify="space-between" style={{ marginBottom: 6 }}>
                  <T variant="small" color={t.color.textSecondary}>Coût</T>
                  <T variant="body">{formatMoney(product.cost)}</T>
                </Row>
                <Row justify="space-between">
                  <T variant="small" color={t.color.textSecondary}>Marge</T>
                  <T variant="body">{margin}%</T>
                </Row>
              </Card>

              {/* Meta */}
              <Card style={{ padding: t.spacing.md }}>
                {product.supplier ? (
                  <Row justify="space-between" style={{ marginBottom: 6 }}>
                    <T variant="small" color={t.color.textSecondary}>Fournisseur</T>
                    <T variant="small">{product.supplier}</T>
                  </Row>
                ) : null}
                {product.barcode ? (
                  <Row justify="space-between" style={{ marginBottom: 6 }}>
                    <T variant="small" color={t.color.textSecondary}>Code-barres</T>
                    <T variant="small">{product.barcode}</T>
                  </Row>
                ) : null}
                <Row justify="space-between">
                  <T variant="small" color={t.color.textSecondary}>Ventes totales</T>
                  <T variant="small">{product.salesCount}</T>
                </Row>
              </Card>

              {/* Actions */}
              <Row gap={10}>
                <Button
                  variant="dark"
                  style={{ flex: 1 }}
                  onPress={() => router.push({ pathname: '/(owner)/stock/restock', params: { id: product._id, product: JSON.stringify(product) } } as never)}
                >
                  Réceptionner
                </Button>
                <Button
                  variant="dark"
                  style={{ flex: 1 }}
                  onPress={() => router.push({ pathname: '/(owner)/stock/adjust', params: { id: product._id, product: JSON.stringify(product) } } as never)}
                >
                  Corriger
                </Button>
              </Row>
              <Row gap={10}>
                <Button
                  variant="white"
                  style={{ flex: 1, flexDirection: 'row' }}
                  onPress={() => router.push({ pathname: '/(owner)/stock/edit', params: { id: product._id, product: JSON.stringify(product) } } as never)}
                >
                  Modifier
                </Button>
                <Button
                  variant="dark"
                  style={{ flex: 1 }}
                  disabled={deleting}
                  onPress={() => handleDelete(product)}
                >
                  Supprimer
                </Button>
              </Row>

              <Divider style={{ marginVertical: 6 }} />

              <Eyebrow>Historique</Eyebrow>
              <MovementsList productId={product._id} />
            </View>
          );
        }}
      </ResourceView>
    </Screen>
  );
}

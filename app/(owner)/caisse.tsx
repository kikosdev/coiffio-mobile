import { useState } from 'react';
import { Alert, Modal, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Banknote } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Eyebrow, Avatar, Button } from '../../src/components/kit';
import { useCaisseOverview } from '../../src/hooks/owner/useCaisseOverview';
import { HeaderAvatarButton } from '../../src/components/owner/HeaderAvatarButton';
import * as caisseApi from '../../src/api/owner/caisse';
import { ApiError } from '../../src/api/client';
import { formatMoney } from '../../src/utils/formatMoney';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export default function OwnerCaisse() {
  const t = useTheme();
  const { data, isLoading, error } = useCaisseOverview();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // No expo-sharing/expo-file-system/expo-clipboard installed — per instructions, don't add a
  // package just for this. The CSV is shown in a selectable text field the owner can long-press
  // to copy natively, same fallback used for the generated password in team/invite.tsx.
  async function handleExport(): Promise<void> {
    setExporting(true);
    try {
      const csv = await caisseApi.exportCsv({ period: 'day' });
      setCsvText(csv);
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError ? err.message : "Impossible d'exporter le rapport.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Caisse"
        subtitle="Salon-wide · today"
        right={
          <Row gap={14}>
            <Button variant="gold" size="sm" onPress={() => router.push('/(owner)/caisse/checkout' as never)}>
              Encaisser
            </Button>
            <HeaderAvatarButton />
          </Row>
        }
      />

      <Row gap={10} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.push('/(owner)/caisse/expenses' as never)}>
          <T variant="small" color={t.color.gold}>Dépenses</T>
        </TouchableOpacity>
        <T variant="small" color={t.color.borderStrong}>·</T>
        <TouchableOpacity onPress={handleExport} disabled={exporting}>
          <T variant="small" color={t.color.gold}>{exporting ? 'Export…' : 'Exporter CSV'}</T>
        </TouchableOpacity>
      </Row>

      <Modal visible={csvText !== null} animationType="slide" transparent onRequestClose={() => setCsvText(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: t.color.surfaceCard, borderTopLeftRadius: t.radius.xl, borderTopRightRadius: t.radius.xl,
            padding: t.spacing.lg, maxHeight: '75%',
          }}>
            <T variant="subtitle" style={{ marginBottom: 6 }}>Rapport CSV</T>
            <T variant="small" color={t.color.textMuted} style={{ marginBottom: 12 }}>
              Appuyez longuement sur le texte pour le sélectionner et le copier.
            </T>
            <TextInput
              style={{
                backgroundColor: t.color.surfaceElevated, borderRadius: t.radius.md, borderWidth: 1,
                borderColor: t.color.borderSubtle, padding: t.spacing.md, color: t.color.textPrimary,
                fontSize: 12, maxHeight: 320,
              }}
              value={csvText ?? ''}
              multiline
              editable
              scrollEnabled
            />
            <Button variant="dark" fullWidth style={{ marginTop: t.spacing.md }} onPress={() => setCsvText(null)}>
              Fermer
            </Button>
          </View>
        </View>
      </Modal>

      {data.count === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: t.color.surfaceCard,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1, borderColor: t.color.borderSubtle,
          }}>
            <Banknote size={28} color={t.color.textMuted} />
          </View>
          <T variant="subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>No payments yet today</T>
          <T variant="small" color={t.color.textMuted} style={{ textAlign: 'center' }}>
            {isLoading ? 'Loading…' : error ?? 'Payments recorded by the team will show up here.'}
          </T>
        </View>
      ) : (
        <>
          <Row gap={9} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
            <Card style={{ flex: 1, padding: t.spacing.md }}>
              <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(data.gross)}</T>
              <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Gross today</T>
            </Card>
            <Card style={{ flex: 1, padding: t.spacing.md }}>
              <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(data.tips)}</T>
              <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Tips</T>
            </Card>
            <Card style={{ flex: 1, padding: t.spacing.md }}>
              <T variant="subtitle">{data.count}</T>
              <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Payments</T>
            </Card>
          </Row>

          <Row gap={9} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
            <Card style={{ flex: 1, padding: t.spacing.md }}>
              <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(data.cashTnd)}</T>
              <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Cash</T>
            </Card>
            <Card style={{ flex: 1, padding: t.spacing.md }}>
              <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>{formatMoney(data.cardTnd)}</T>
              <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Card</T>
            </Card>
          </Row>

          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>By Staff</Eyebrow>
          <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
            {data.byStylist.map((s) => (
              <Card key={s.stylistId} style={{ padding: t.spacing.md }}>
                <Row gap={11} justify="space-between">
                  <Row gap={11} style={{ flex: 1 }}>
                    <Avatar initials={initials(s.name)} size={38} />
                    <View style={{ flex: 1 }}>
                      <T variant="body">{s.name}</T>
                      <T variant="small" color={t.color.textSecondary} style={{ marginTop: 1 }}>
                        Tips {formatMoney(s.tips)} · Comm. {formatMoney(s.commission)}
                      </T>
                    </View>
                  </Row>
                  <T variant="label" numberOfLines={1} adjustsFontSizeToFit style={{ maxWidth: 90 }}>
                    {formatMoney(s.gross)}
                  </T>
                </Row>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

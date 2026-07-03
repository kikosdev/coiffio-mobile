import { View } from 'react-native';
import { Banknote } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Eyebrow, Avatar } from '../../src/components/kit';
import { useCaisseOverview } from '../../src/hooks/owner/useCaisseOverview';
import { formatMoney } from '../../src/utils/formatMoney';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export default function OwnerCaisse() {
  const t = useTheme();
  const { data, isLoading, error } = useCaisseOverview();

  return (
    <Screen>
      <ScreenHeader title="Caisse" subtitle="Salon-wide · today" />

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

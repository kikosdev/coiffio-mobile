import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Eyebrow, Badge, Divider, GoldHeroCard, StatCard,
} from '../../src/components/kit';
import { dummyEarnings, dummyTodayAppointments } from '../../src/data/dummy';
import { TrendingUp } from 'lucide-react-native';

export default function StaffCaisse() {
  const t = useTheme();
  const completedToday = dummyTodayAppointments.filter((a) => a.status === 'completed');
  const todayServiceTotal = completedToday.reduce((sum, a) => sum + a.price, 0);

  return (
    <Screen>
      <ScreenHeader title="Caisse" subtitle="Your daily register" />

      {/* Today hero */}
      <GoldHeroCard
        label="Today · My Caisse"
        amount={`$${todayServiceTotal}`}
        stats={[
          { value: String(completedToday.length), label: 'Services' },
          { value: '$0', label: 'Products' },
        ]}
      />

      {/* Period stats */}
      <Row gap={10} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        <StatCard label="This week" value={`$${dummyEarnings.weekTotal}`} />
        <StatCard label="This month" value={`$${(dummyEarnings.monthTotal / 1000).toFixed(1)}k`} />
      </Row>

      {/* Earnings by service */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Earnings by Service</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 8 }}>
        {dummyEarnings.byService.map((s, i) => (
          <Card key={i} style={{ padding: t.spacing.md }}>
            <Row justify="space-between">
              <View style={{ flex: 1 }}>
                <T variant="body">{s.service}</T>
                <T variant="small" style={{ marginTop: 2 }}>{s.count} services</T>
              </View>
              <T variant="label" color={t.color.gold}>${s.total}</T>
            </Row>
          </Card>
        ))}
      </View>

      {/* Cash-out V2 chip */}
      <View style={{
        marginHorizontal: t.spacing.xxl,
        marginTop: 24,
        backgroundColor: t.color.surfaceElevated,
        borderRadius: t.radius.xl,
        borderWidth: 1,
        borderColor: t.color.borderSubtle,
        padding: t.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: 0.6,
      }}>
        <TrendingUp size={20} color={t.color.textMuted} />
        <View style={{ flex: 1 }}>
          <Row gap={8}>
            <T variant="body" color={t.color.textSecondary}>Cash out</T>
            <Badge variant="neutral">V2</Badge>
          </Row>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>
            Payout disbursement coming in V2
          </T>
        </View>
      </View>
    </Screen>
  );
}

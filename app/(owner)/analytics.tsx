import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Eyebrow, Avatar,
} from '../../src/components/kit';
import { useAnalytics } from '../../src/hooks/owner/useAnalytics';
import { formatMoney } from '../../src/utils/formatMoney';

export default function OwnerAnalytics() {
  const t = useTheme();
  const { data, isLoading } = useAnalytics();
  const { monthRevenue, revenueChangePct, byStaff, topBarbers } = data;

  return (
    <Screen>
      <ScreenHeader
        title="Analytics"
        right={
          // useAnalytics() is hardcoded to period: 'month' server-side — no period switching
          // exists yet, so this is a static label now, not a dropdown that did nothing.
          <View style={{
            backgroundColor: t.color.surfaceElevated,
            borderRadius: t.radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 7,
          }}>
            <T variant="small" color={t.color.textSecondary}>This month</T>
          </View>
        }
      />

      {/* Revenue hero */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        <T variant="small" color={t.color.textSecondary}>Net revenue</T>
        <Row gap={10} align="flex-end" style={{ marginTop: 4 }}>
          <T variant="hero" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(monthRevenue)}
          </T>
          <View style={{
            backgroundColor: t.color.goldSoft,
            borderRadius: t.radius.pill,
            paddingHorizontal: 8, paddingVertical: 3,
            marginBottom: 4,
          }}>
            <T variant="small" color={t.color.gold}>
              {revenueChangePct >= 0 ? '▲' : '▼'} {Math.abs(revenueChangePct)}%
            </T>
          </View>
        </Row>
      </View>

      {/* Revenue by staff */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Revenue by Staff</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 14, marginBottom: t.spacing.xl }}>
        {byStaff.map((s, i) => (
          <View key={i}>
            <Row justify="space-between" style={{ marginBottom: 6 }}>
              <T variant="body">{s.name}</T>
              <T variant="label" numberOfLines={1}>{formatMoney(s.revenue)}</T>
            </Row>
            <View style={{ height: 8, backgroundColor: t.color.surfaceElevated, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{
                height: 8,
                width: `${s.pct}%`,
                backgroundColor: t.color.gold,
                borderRadius: 4,
              }} />
            </View>
          </View>
        ))}
      </View>

      {/* Top barbers */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>
        <Eyebrow>Top Barbers</Eyebrow>
        <T variant="small" color={t.color.textSecondary}>by revenue</T>
      </Row>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {topBarbers.map((b) => (
          <Card key={b.rank} style={{ padding: t.spacing.md }}>
            <Row gap={10} justify="space-between">
              <T variant="label" color={b.rank === 1 ? t.color.gold : t.color.textSecondary} style={{ width: 16 }}>
                {b.rank}
              </T>
              <Avatar initials={b.initials} size={38} />
              <View style={{ flex: 1 }}>
                <T variant="body">{b.name}</T>
              </View>
              <T variant="label" numberOfLines={1} adjustsFontSizeToFit style={{ maxWidth: 100 }}>
                {formatMoney(b.revenue)}
              </T>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

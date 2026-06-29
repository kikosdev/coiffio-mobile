import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Eyebrow, Avatar,
} from '../../src/components/kit';
import { dummyAnalytics } from '../../src/data/dummy';

const BAR_MAX_PCT = 84;

export default function OwnerAnalytics() {
  const t = useTheme();
  const { monthRevenue, revenueChange, bySalon, topBarbers } = dummyAnalytics;

  return (
    <Screen>
      <ScreenHeader
        title="Analytics"
        right={
          <TouchableOpacity style={{
            backgroundColor: t.color.surfaceElevated,
            borderRadius: t.radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
            <T variant="small" color={t.color.textSecondary}>This month</T>
            <T variant="small" color={t.color.textSecondary}>▾</T>
          </TouchableOpacity>
        }
      />

      {/* Revenue header */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        <T variant="small" color={t.color.textSecondary}>Net revenue · all salons</T>
        <Row gap={10} style={{ marginTop: 4 }}>
          <T variant="hero">${(monthRevenue / 1000).toFixed(1)}k</T>
          <View style={{ backgroundColor: '#1F1810', borderRadius: t.radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <T variant="small" color={t.color.gold}>▲ {revenueChange}%</T>
          </View>
        </Row>
      </View>

      {/* Revenue by salon */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Revenue by Salon</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 14, marginBottom: t.spacing.xl }}>
        {bySalon.map((s, i) => (
          <View key={i}>
            <Row justify="space-between" style={{ marginBottom: 6 }}>
              <T variant="body">{s.name}</T>
              <T variant="label">${(s.revenue / 1000).toFixed(1)}k</T>
            </Row>
            <View style={{ height: 8, backgroundColor: t.color.surfaceElevated, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{
                height: 8,
                width: `${s.pct}%`,
                backgroundColor: i < 2 ? t.color.gold : '#7A9ACB',
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
                <T variant="small">{b.salon}</T>
              </View>
              <T variant="label">${(b.revenue / 1000).toFixed(1)}k</T>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

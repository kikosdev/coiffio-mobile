import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, Badge, Divider, GoldHeroCard, StatusDot, Wordmark,
} from '../../src/components/kit';
import { dummyHQStats, dummySalons, dummyOwnerProfile } from '../../src/data/dummy';
import { Bell } from 'lucide-react-native';

export default function OwnerHQ() {
  const t = useTheme();

  return (
    <Screen>
      {/* Top bar */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl }}>
        <View>
          <T variant="small" color={t.color.textSecondary}>Owner · {dummyOwnerProfile.name}</T>
          <Row gap={8}>
            <Wordmark />
            <View style={{
              backgroundColor: t.color.surfaceElevated,
              borderRadius: 5,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}>
              <T variant="small" style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>HQ</T>
            </View>
          </Row>
        </View>
        <Avatar initials={dummyOwnerProfile.initials} size={40} />
      </Row>

      {/* Revenue hero */}
      <GoldHeroCard
        label="Today · All Salons"
        amount={`$${dummyHQStats.todayRevenue.toLocaleString()}`}
        change={`${dummyHQStats.revenueChange}%`}
        stats={[
          { value: String(dummyHQStats.bookingCount),  label: 'Bookings' },
          { value: `${dummyHQStats.barbersOn}/${dummyHQStats.barbersTotal}`, label: 'Barbers on' },
          { value: String(dummyHQStats.avgRating),     label: 'Avg rating' },
        ]}
      />

      {/* Salons today */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>
        <Eyebrow>Your Salons · {dummySalons.length}</Eyebrow>
        <T variant="small" color={t.color.gold}>See all</T>
      </Row>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummySalons.map((s) => (
          <Card key={s.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <View style={{ flex: 1 }}>
                <T variant="body">{s.name}</T>
                <Row gap={6} style={{ marginTop: 4 }}>
                  <StatusDot status={s.status === 'closing' ? 'break' : 'active'} />
                  <T variant="small">
                    {s.status === 'open' ? 'Open' : 'Closing soon'} · {s.barberCount} barbers on
                  </T>
                </Row>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="label">${s.todayRevenue.toLocaleString()}</T>
                <T variant="small" color={t.color.textMuted}>today</T>
              </View>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

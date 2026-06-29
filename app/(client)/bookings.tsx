import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Avatar, Badge, Eyebrow, Divider } from '../../src/components/kit';
import { dummyClientBookings } from '../../src/data/dummy';
import { Clock } from 'lucide-react-native';

const STATUS_BADGE: Record<string, 'success' | 'gold' | 'neutral'> = {
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'neutral',
};

export default function ClientBookings() {
  const t = useTheme();
  const upcoming = dummyClientBookings.filter((b) => b.status === 'confirmed');
  const past = dummyClientBookings.filter((b) => b.status === 'completed');

  return (
    <Screen>
      <ScreenHeader title="Bookings" subtitle={`${upcoming.length} upcoming`} />

      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Upcoming</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {upcoming.map((b) => (
          <Card key={b.id} style={{ padding: t.spacing.lg }}>
            <Row justify="space-between" style={{ marginBottom: 12 }}>
              <T variant="subtitle">{b.serviceName}</T>
              <Badge variant="success">Confirmed</Badge>
            </Row>
            <Row gap={8} style={{ marginBottom: 8 }}>
              <Avatar initials={b.barberInitials} size={32} />
              <View>
                <T variant="body">{b.barberName}</T>
                <T variant="small">{b.salonName}</T>
              </View>
            </Row>
            <Divider style={{ marginVertical: 10 }} />
            <Row justify="space-between">
              <Row gap={6}>
                <Clock size={13} color={t.color.textSecondary} />
                <T variant="small">{b.date} · {b.time}</T>
              </Row>
              <T variant="label" color={t.color.gold}>${b.price}</T>
            </Row>
            <T variant="small" color={t.color.textMuted} style={{ marginTop: 8 }}>
              #{b.confirmationCode}
            </T>
          </Card>
        ))}
      </View>

      {past.length > 0 && (
        <>
          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: 28, marginBottom: 10 }}>Past</Eyebrow>
          <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
            {past.map((b) => (
              <Card key={b.id} style={{ padding: t.spacing.lg, opacity: 0.7 }}>
                <Row justify="space-between">
                  <T variant="body">{b.serviceName}</T>
                  <Badge variant="neutral">Completed</Badge>
                </Row>
                <Row gap={6} style={{ marginTop: 8 }}>
                  <Clock size={13} color={t.color.textSecondary} />
                  <T variant="small">{b.date} · {b.time}</T>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <T variant="small">{b.barberName}</T>
                  <T variant="label">${b.price}</T>
                </Row>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

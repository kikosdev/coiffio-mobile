import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, Badge, Divider, StatusDot, GoldHeroCard, Wordmark,
} from '../../src/components/kit';
import { dummyStaffProfile, dummyTodayAppointments, dummyEarnings } from '../../src/data/dummy';
import { Bell } from 'lucide-react-native';

const STATUS_BADGE: Record<string, 'success' | 'gold' | 'pending' | 'neutral'> = {
  completed:   'neutral',
  in_progress: 'gold',
  upcoming:    'neutral',
};

export default function StaffToday() {
  const t = useTheme();
  const done = dummyTodayAppointments.filter((a) => a.status === 'completed').length;

  return (
    <Screen>
      {/* Top bar */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl }}>
        <View>
          <T variant="small" color={t.color.textSecondary}>{dummyStaffProfile.title}</T>
          <Wordmark />
        </View>
        <Avatar initials={dummyStaffProfile.initials} size={40} />
      </Row>

      {/* Earnings hero */}
      <GoldHeroCard
        label="Today's Earnings"
        amount={`$${dummyEarnings.todayTotal}`}
        stats={[
          { value: `${done}/${dummyTodayAppointments.length}`, label: 'Cuts done' },
          { value: `$${dummyEarnings.weekTotal}`, label: 'This week' },
        ]}
      />

      {/* Schedule */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Today's Schedule</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyTodayAppointments.map((a) => (
          <Card key={a.id} style={{ padding: t.spacing.md }}>
            <Row justify="space-between">
              <Row gap={12}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <T variant="label">{a.time}</T>
                  <StatusDot status={a.status} />
                </View>
                <View style={{ flex: 1 }}>
                  <Row gap={8}>
                    <Avatar initials={a.clientInitials} size={32} />
                    <View>
                      <T variant="body">{a.clientName}</T>
                      <T variant="small">{a.service} · {a.duration}min</T>
                    </View>
                  </Row>
                </View>
              </Row>
              <T variant="label" color={a.status === 'completed' ? t.color.textSecondary : t.color.textPrimary}>
                ${a.price}
              </T>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

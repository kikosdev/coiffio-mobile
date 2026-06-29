import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Row, T, Eyebrow, Card, Avatar, StatusDot,
} from '../../src/components/kit';
import { dummyWeekSchedule, dummyTodayAppointments } from '../../src/data/dummy';

export default function StaffSchedule() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Schedule" subtitle="Your week at a glance" />

      {/* Week strip */}
      <Row gap={6} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.xl }}>
        {dummyWeekSchedule.map((d) => (
          <TouchableOpacity
            key={d.day}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 10,
              borderRadius: t.radius.lg,
              backgroundColor: d.isToday ? t.color.gold : t.color.surfaceCard,
              borderWidth: 1,
              borderColor: d.isToday ? t.color.gold : t.color.borderSubtle,
            }}
          >
            <T variant="small" color={d.isToday ? t.color.onGold : t.color.textMuted}>{d.day}</T>
            <T variant="subtitle" color={d.isToday ? t.color.onGold : t.color.textPrimary}>{d.date}</T>
            <T variant="small" color={d.isToday ? t.color.onGold : t.color.textMuted}>{d.slots}</T>
          </TouchableOpacity>
        ))}
      </Row>

      {/* Appointments for today */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Thursday · Today</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyTodayAppointments.map((a) => (
          <Card key={a.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <Row gap={12}>
                <T variant="label" style={{ width: 44 }}>{a.time}</T>
                <Avatar initials={a.clientInitials} size={38} />
                <View>
                  <T variant="body">{a.clientName}</T>
                  <T variant="small">{a.service} · {a.duration} min</T>
                </View>
              </Row>
              <StatusDot status={a.status} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

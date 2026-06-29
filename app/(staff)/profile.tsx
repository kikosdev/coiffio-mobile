import { View } from 'react-native';
import { ProfileScreen, Card, Row, T, Eyebrow, Badge } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { dummyStaffProfile } from '../../src/data/dummy';
import { ToggleLeft, ToggleRight } from 'lucide-react-native';

export default function StaffProfile() {
  const t = useTheme();
  return (
    <ProfileScreen
      name={dummyStaffProfile.name}
      initials="RA"
      subtitle={`${dummyStaffProfile.title} · ${dummyStaffProfile.salon}`}
    >
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Settings</Eyebrow>
        <Card style={{ padding: t.spacing.lg }}>
          <Row justify="space-between">
            <View style={{ flex: 1 }}>
              <T variant="body">Accepting Bookings</T>
              <T variant="small" style={{ marginTop: 2 }}>
                {dummyStaffProfile.acceptingBookings ? 'On — clients can book you' : 'Off — your calendar is closed'}
              </T>
            </View>
            {dummyStaffProfile.acceptingBookings
              ? <ToggleRight size={28} color={t.color.gold} />
              : <ToggleLeft size={28} color={t.color.textMuted} />
            }
          </Row>
        </Card>
      </View>
    </ProfileScreen>
  );
}

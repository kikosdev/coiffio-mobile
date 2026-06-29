import { ProfileScreen, Card, Row, T, Eyebrow, Divider } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { dummyOwnerProfile } from '../../src/data/dummy';
import { ChevronRight } from 'lucide-react-native';

const SETTINGS_ITEMS = [
  { label: 'Salon hours & services', sub: 'Edit hours, add/remove services' },
  { label: 'Commission rules',       sub: 'Set % per service per barber' },
  { label: 'Notifications',          sub: 'Bookings, payments, reports' },
  { label: 'Account & security',     sub: 'Password, 2FA, sessions' },
];

export default function OwnerSettings() {
  const t = useTheme();

  return (
    <ProfileScreen
      name={dummyOwnerProfile.name}
      initials={dummyOwnerProfile.initials}
      subtitle="Owner · BLACK BOX HQ"
    >
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Salon Settings</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl }}>
        {SETTINGS_ITEMS.map((item, i) => (
          <>
            <Row key={item.label} justify="space-between" style={{ padding: t.spacing.lg }}>
              <T variant="body" style={{ flex: 1 }}>{item.label}</T>
              <ChevronRight size={18} color={t.color.textMuted} />
            </Row>
            {i < SETTINGS_ITEMS.length - 1 && <Divider key={`d-${i}`} style={{ marginHorizontal: t.spacing.lg }} />}
          </>
        ))}
      </Card>
    </ProfileScreen>
  );
}

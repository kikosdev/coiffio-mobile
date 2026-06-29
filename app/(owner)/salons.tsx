import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Eyebrow, Badge, Divider, StatusDot, Button,
} from '../../src/components/kit';
import { dummySalons } from '../../src/data/dummy';
import { MapPin, Star } from 'lucide-react-native';

export default function OwnerSalons() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Salons"
        subtitle={`${dummySalons.length} locations · 1 brand`}
        right={<Button variant="gold" size="sm">+ Add</Button>}
      />

      {/* Multi-location banner */}
      <View style={{
        marginHorizontal: t.spacing.xxl,
        marginBottom: t.spacing.xl,
        backgroundColor: t.color.goldSoft,
        borderRadius: t.radius.xl,
        borderWidth: 1,
        borderColor: '#34302A',
        padding: t.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.color.gold }} />
        <T variant="small" color={t.color.goldWarm} style={{ flex: 1 }}>
          Multi-location — coming next. V1 runs a single salon.
        </T>
      </View>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 14 }}>
        {dummySalons.map((s) => (
          <Card key={s.id} style={{ overflow: 'hidden' }} onPress={() => {}}>
            {/* Placeholder image area */}
            <View style={{ height: 104, backgroundColor: t.color.surfaceElevated, position: 'relative' }}>
              <View style={{ position: 'absolute', top: 10, left: 10 }}>
                <Badge variant="success">OPEN</Badge>
              </View>
            </View>
            <View style={{ padding: t.spacing.md }}>
              <Row justify="space-between">
                <T variant="subtitle">{s.name}</T>
                <Row gap={4}>
                  <Star size={13} color="#F2B233" fill="#F2B233" />
                  <T variant="label">{s.rating}</T>
                </Row>
              </Row>
              <Row gap={5} style={{ marginTop: 5 }}>
                <MapPin size={12} color={t.color.textMuted} />
                <T variant="small">{s.address}</T>
              </Row>
              <Divider style={{ marginVertical: 10 }} />
              <Row gap={18}>
                <View>
                  <T variant="subtitle">{s.barberCount}</T>
                  <T variant="small" color={t.color.textMuted}>Barbers</T>
                </View>
                <View>
                  <T variant="subtitle">${s.todayRevenue.toLocaleString()}</T>
                  <T variant="small" color={t.color.textMuted}>Today</T>
                </View>
                <View>
                  <T variant="subtitle">{s.bookingCount}</T>
                  <T variant="small" color={t.color.textMuted}>Bookings</T>
                </View>
              </Row>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

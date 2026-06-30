import { View, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin, Store, Pencil } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, Badge, Button, StatusDot,
} from '../../../src/components/kit';
import { dummySingleSalon, dummyTeam } from '../../../src/data/dummy';
import { formatMoney } from '../../../src/utils/formatMoney';

export default function SalonDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // V1 mono-salon: always resolve to the single salon regardless of id
  const salon = dummySingleSalon;
  const team = dummyTeam.filter((b) => b.salon === salon.name);

  return (
    <Screen>
      {/* Header */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <View style={{ width: 32 }} />
        <TouchableOpacity
          style={{ padding: 4 }}
          onPress={() => router.navigate('/(owner)/settings' as never)}
        >
          <Pencil size={20} color={t.color.textMuted} />
        </TouchableOpacity>
      </Row>

      {/* Salon identity */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.lg }}>
        {/* Storefront placeholder */}
        <View style={{
          height: 120,
          backgroundColor: t.color.surfaceCard,
          borderRadius: t.radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: t.color.borderSubtle,
          marginBottom: t.spacing.lg,
          overflow: 'hidden',
        }}>
          <Store size={36} color={t.color.textMuted} />
        </View>

        {/* Name + OPEN badge */}
        <Row justify="space-between" align="center" style={{ marginBottom: t.spacing.sm }}>
          <T variant="title" style={{ flex: 1 }}>{salon.name}</T>
          <Badge variant="success">OPEN</Badge>
        </Row>

        {/* Address */}
        <Row gap={5} style={{ marginBottom: 4 }}>
          <MapPin size={13} color={t.color.textMuted} />
          <T variant="small" color={t.color.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
            {salon.address}
          </T>
        </Row>

        {/* Hours */}
        <T variant="small" color={t.color.textMuted} style={{ marginBottom: t.spacing.xl }}>
          {salon.hours}
        </T>

        {/* 3 stat cards */}
        <Row gap={9} style={{ marginBottom: t.spacing.xl }}>
          <Card style={{ flex: 1, padding: t.spacing.md }}>
            <T
              variant="subtitle"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{ fontFamily: t.typography.family.sansBold }}
            >
              {formatMoney(salon.todayRevenue)}
            </T>
            <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Today</T>
          </Card>
          <Card style={{ flex: 1, padding: t.spacing.md }}>
            <T variant="subtitle">{salon.bookingCount}</T>
            <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Bookings</T>
          </Card>
          <Card style={{ flex: 1, padding: t.spacing.md }}>
            <T variant="subtitle">{salon.chairUse}%</T>
            <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Chair use</T>
          </Card>
        </Row>

        {/* Team section */}
        <Row justify="space-between" style={{ marginBottom: t.spacing.md }}>
          <Eyebrow>Team · {team.length}</Eyebrow>
          <TouchableOpacity onPress={() => router.navigate('/(owner)/team' as never)}>
            <T variant="small" color={t.color.gold}>Manage</T>
          </TouchableOpacity>
        </Row>

        <View style={{ gap: 9, marginBottom: t.spacing.xl }}>
          {team.map((b) => (
            <Card
              key={b.id}
              style={{ padding: t.spacing.md }}
              onPress={() => router.push(('/(owner)/team/' + b.id) as never)}
            >
              <Row justify="space-between">
                <Row gap={11}>
                  <Avatar initials={b.initials} size={40} />
                  <View>
                    <T variant="body">{b.name}</T>
                    <T variant="small" color={t.color.textSecondary} style={{ marginTop: 1 }}>
                      {b.status === 'active'
                        ? `On chair · ${b.todayCount} today`
                        : b.status === 'break'
                        ? `On break · ${b.todayCount} today`
                        : 'Off today'}
                    </T>
                  </View>
                </Row>
                <StatusDot status={b.status} />
              </Row>
            </Card>
          ))}
        </View>

        {/* Action buttons */}
        <Row gap={10} style={{ marginBottom: t.spacing.xl }}>
          <Button
            variant="dark"
            style={{ flex: 1 }}
            onPress={() => router.navigate('/(owner)/settings' as never)}
          >
            Hours & services
          </Button>
          <Button
            variant="white"
            style={{ flex: 1 }}
            onPress={() => router.push('/(owner)/team/invite' as never)}
          >
            Add barber
          </Button>
        </Row>
      </View>
    </Screen>
  );
}

import { View, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, StatusDot, Wordmark, Badge, Button,
} from '../../src/components/kit';
import {
  dummyHQStats, dummySingleSalon, dummyTeam, dummyOwnerProfile,
} from '../../src/data/dummy';
import { formatMoney } from '../../src/utils/formatMoney';

export default function OwnerHQ() {
  const t = useTheme();
  const salon = dummySingleSalon;
  const previewTeam = dummyTeam.slice(0, 3);

  return (
    <Screen>
      {/* ── Header ── */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl }}>
        <View>
          <T variant="small" color={t.color.textSecondary}>Owner · {dummyOwnerProfile.name}</T>
          <Wordmark tag="HQ" />
        </View>
        <TouchableOpacity style={{
          width: 40, height: 40,
          backgroundColor: t.color.surfaceCard,
          borderRadius: 20,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: t.color.borderSubtle,
        }}>
          <Bell size={19} color={t.color.textPrimary} />
        </TouchableOpacity>
      </Row>

      {/* ── Today hero (single-salon) ── */}
      <LinearGradient
        colors={['#23201B', '#141210']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          margin: t.spacing.xxl,
          borderRadius: t.radius.xxl,
          borderWidth: 1,
          borderColor: '#34302A',
          padding: t.spacing.lg,
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <View style={{
          position: 'absolute', top: -30, right: -20,
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: 'rgba(244,166,42,0.12)',
        }} />

        <Eyebrow color={t.color.goldWarm}>Today</Eyebrow>
        <Row gap={10} align="flex-end" style={{ marginTop: 6 }}>
          <T variant="hero" style={{ lineHeight: 40 }} numberOfLines={1}>
            {formatMoney(dummyHQStats.todayRevenue)}
          </T>
          <View style={{
            backgroundColor: '#1F1810',
            borderRadius: t.radius.pill,
            paddingHorizontal: 8, paddingVertical: 3,
            marginBottom: 4,
          }}>
            <T variant="small" color={t.color.gold}>▲ {dummyHQStats.revenueChange}%</T>
          </View>
        </Row>
        <Row gap={0} style={{ marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <T variant="subtitle">{dummyHQStats.bookingCount}</T>
            <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>Bookings</T>
          </View>
          <View style={{ flex: 1 }}>
            <Row gap={2} align="baseline">
              <T variant="subtitle">{dummyHQStats.barbersOn}</T>
              <T variant="small" color={t.color.textSecondary}>/{dummyHQStats.barbersTotal}</T>
            </Row>
            <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>Barbers on</T>
          </View>
        </Row>
      </LinearGradient>

      {/* ── Salon detail panel (screen 03 integrated) ── */}
      <View style={{ paddingHorizontal: t.spacing.xxl }}>

        {/* Salon name + status */}
        <Row justify="space-between" style={{ marginBottom: t.spacing.sm }}>
          <Pressable
            onPress={() => router.push(('/(owner)/salon/' + salon.id) as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <T variant="title">{salon.name}</T>
          </Pressable>
          <Badge variant="success">OPEN</Badge>
        </Row>
        <Row gap={5} style={{ marginBottom: t.spacing.lg }}>
          <MapPin size={13} color={t.color.textMuted} />
          <T variant="small" color={t.color.textSecondary} numberOfLines={1}>
            {salon.address} · {salon.hours}
          </T>
        </Row>

        {/* Stat cards */}
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

        {/* Team preview */}
        <Row justify="space-between" style={{ marginBottom: t.spacing.md }}>
          <Eyebrow>Team · {salon.barberCount}</Eyebrow>
          <TouchableOpacity onPress={() => router.navigate('/(owner)/team' as never)}>
            <T variant="small" color={t.color.gold}>Manage</T>
          </TouchableOpacity>
        </Row>
        <View style={{ gap: 9, marginBottom: t.spacing.xl }}>
          {previewTeam.map((b) => (
            <Card key={b.id} style={{ padding: t.spacing.md }}>
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

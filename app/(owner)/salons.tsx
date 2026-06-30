import { useState } from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Store } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Row, T, Card, Badge, Button,
} from '../../src/components/kit';
import { ComingNextLock } from '../../src/components/owner/ComingNextLock';
import { dummySingleSalon, dummyTeam } from '../../src/data/dummy';
import { formatMoney } from '../../src/utils/formatMoney';

export default function OwnerSalons() {
  const t = useTheme();
  const [showAddLock, setShowAddLock] = useState(false);
  const salon = dummySingleSalon;
  const barberCount = dummyTeam.length;

  return (
    <Screen scroll={false} style={{ paddingHorizontal: 0 }}>
      <ScreenHeader
        title="Salons"
        subtitle={`1 location · ${barberCount} barbers · 1 brand`}
        right={
          <TouchableOpacity
            onPress={() => setShowAddLock(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.4 }}
          >
            <View style={{
              backgroundColor: t.color.surfaceElevated,
              borderRadius: t.radius.pill,
              paddingHorizontal: 11, paddingVertical: 6,
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}>
              <T variant="small" color={t.color.textSecondary}>+ Add</T>
              <View style={{
                backgroundColor: t.color.borderSubtle,
                borderRadius: 3,
                paddingHorizontal: 4, paddingVertical: 1,
              }}>
                <T variant="small" style={{ fontSize: 8, fontWeight: '800' as const }} color={t.color.textMuted}>
                  SOON
                </T>
              </View>
            </View>
          </TouchableOpacity>
        }
      />

      {/* Single salon card */}
      <View style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.md }}>
        <Card
          style={{ padding: 0, overflow: 'hidden' }}
          onPress={() => router.push(('/(owner)/salon/' + salon.id) as never)}
        >
          {/* Storefront image placeholder */}
          <View style={{
            height: 90,
            backgroundColor: t.color.surfaceElevated,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Store size={30} color={t.color.textMuted} />
          </View>

          <View style={{ padding: t.spacing.md }}>
            {/* Name + badge */}
            <Row justify="space-between" align="center" style={{ marginBottom: 6 }}>
              <T variant="label" style={{ flex: 1 }}>{salon.name}</T>
              <Badge variant="success">OPEN</Badge>
            </Row>

            {/* Address */}
            <Row gap={5} style={{ marginBottom: t.spacing.md }}>
              <MapPin size={12} color={t.color.textMuted} />
              <T variant="small" color={t.color.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
                {salon.address}
              </T>
            </Row>

            {/* Stats line */}
            <Row gap={0} style={{
              backgroundColor: t.color.surfaceElevated,
              borderRadius: t.radius.md,
              padding: t.spacing.sm,
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <T variant="label" style={{ fontSize: 12 }}>{salon.barberCount}</T>
                <T variant="small" color={t.color.textMuted}>Barbers</T>
              </View>
              <View style={{ width: 1, backgroundColor: t.color.borderSubtle, height: '100%' }} />
              <View style={{ flex: 1.5, alignItems: 'center' }}>
                <T variant="label" style={{ fontSize: 12 }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(salon.todayRevenue)}
                </T>
                <T variant="small" color={t.color.textMuted}>Today</T>
              </View>
              <View style={{ width: 1, backgroundColor: t.color.borderSubtle, height: '100%' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <T variant="label" style={{ fontSize: 12 }}>{salon.bookingCount}</T>
                <T variant="small" color={t.color.textMuted}>Bookings</T>
              </View>
            </Row>
          </View>
        </Card>
      </View>

      {/* Add locked modal */}
      <Modal visible={showAddLock} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={{ flex: 1, backgroundColor: t.color.bgBase }}>
          <TouchableOpacity
            onPress={() => setShowAddLock(false)}
            style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl, paddingBottom: t.spacing.md }}
          >
            <T variant="label" color={t.color.gold}>← Back</T>
          </TouchableOpacity>
          <ComingNextLock
            label="Add Location"
            sub="Manage multiple salons — multi-location coming next"
          />
        </View>
      </Modal>
    </Screen>
  );
}

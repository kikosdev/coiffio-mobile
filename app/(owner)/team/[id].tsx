import { useState } from 'react';
import { View, TouchableOpacity, Modal, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, Badge, Button,
} from '../../../src/components/kit';
import { ComingNextLock } from '../../../src/components/owner/ComingNextLock';
import { dummyTeam, dummyBarberDetails } from '../../../src/data/dummy';
import { formatMoney } from '../../../src/utils/formatMoney';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

export default function BarberDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showReassign, setShowReassign] = useState(false);

  const barber = dummyTeam.find((b) => b.id === id);
  const detail = id ? dummyBarberDetails[id] : undefined;

  if (!barber) return null;

  const util = detail?.weekUtil ?? [60, 80, 70, 75, 85, 90, 0];
  const BAR_MAX = 56; // max bar pixel height

  return (
    <Screen>
      {/* Header */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Barber</T>
        <View style={{ width: 32 }} />
      </Row>

      {/* Avatar + identity */}
      <Row gap={14} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.lg }}>
        <Avatar initials={barber.initials} size={66} />
        <View style={{ flex: 1 }}>
          <Row gap={6}>
            <T variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>{barber.name}</T>
            {barber.isPro && <Badge variant="pro">PRO</Badge>}
          </Row>
          {detail?.yearsExp !== undefined && (
            <T variant="small" color={t.color.textMuted} style={{ marginTop: 4 }}>
              {detail.yearsExp} yrs
            </T>
          )}
        </View>
      </Row>

      {/* Assigned salon card */}
      <View style={{
        margin: t.spacing.xxl,
        backgroundColor: t.color.goldSoft,
        borderWidth: 1,
        borderColor: '#34302A',
        borderRadius: t.radius.xl,
        padding: t.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View>
          <Eyebrow color={t.color.goldWarm}>Assigned Salon</Eyebrow>
          <Row gap={6} style={{ marginTop: 5 }}>
            <MapPin size={14} color={t.color.gold} />
            <T variant="label">{barber.salon}</T>
          </Row>
        </View>
        <Button variant="white" size="sm" onPress={() => setShowReassign(true)}>
          Reassign
        </Button>
      </View>
      <T variant="small" color={t.color.textMuted} style={{
        paddingHorizontal: t.spacing.xxl, marginTop: -t.spacing.lg, marginBottom: t.spacing.lg,
      }}>
        A barber works at one salon at a time.
      </T>

      {/* KPI cards */}
      <Row gap={9} style={{ paddingHorizontal: t.spacing.xxl }}>
        <Card style={{ flex: 1, padding: t.spacing.md }}>
          <T variant="subtitle" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(detail?.weekRevenue ?? 0)}
          </T>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>This week</T>
        </Card>
        <Card style={{ flex: 1, padding: t.spacing.md }}>
          <T variant="subtitle">{detail?.weekCuts ?? 0}</T>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>Cuts · wk</T>
        </Card>
      </Row>

      {/* Chair utilisation chart */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>
        Chair Utilisation · This Week
      </Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl, padding: t.spacing.md }}>
        <Row align="flex-end" gap={6} style={{ height: 70 }}>
          {util.map((pct, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <View style={{
                width: '80%',
                height: Math.max((pct / 100) * BAR_MAX, pct > 0 ? 3 : 0),
                backgroundColor: i === TODAY_IDX ? t.color.gold : t.color.surfaceElevated,
                borderRadius: 4,
                marginBottom: 5,
              }} />
              <Text style={{
                fontSize: 9,
                fontWeight: '700',
                color: i === TODAY_IDX ? t.color.textPrimary : t.color.textMuted,
              }}>
                {DAYS[i]}
              </Text>
            </View>
          ))}
        </Row>
      </Card>

      {/* Action buttons */}
      <Row gap={10} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xl }}>
        <Button variant="dark" style={{ flex: 1 }}>Schedule</Button>
        <Button variant="dark" style={{ flex: 1 }} disabled>Commission</Button>
      </Row>

      {/* Reassign teaser modal */}
      <Modal visible={showReassign} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={{ flex: 1, backgroundColor: t.color.bgBase }}>
          <TouchableOpacity
            onPress={() => setShowReassign(false)}
            style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl, paddingBottom: t.spacing.md }}
          >
            <T variant="label" color={t.color.gold}>← Back</T>
          </TouchableOpacity>
          <ComingNextLock
            label="Reassign Barber"
            sub="Move a barber to another location — multi-location coming next"
          />
        </View>
      </Modal>
    </Screen>
  );
}

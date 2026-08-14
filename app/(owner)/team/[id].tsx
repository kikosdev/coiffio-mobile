import { useState } from 'react';
import { View, TouchableOpacity, Modal, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import {
  Screen, Row, T, Eyebrow, Card, Avatar, Badge, Button, ConfirmDialog,
} from '../../../src/components/kit';
import { ComingNextLock } from '../../../src/components/owner/ComingNextLock';
import { useMySalon } from '../../../src/hooks/owner/useMySalon';
import { useBarberDetail } from '../../../src/hooks/owner/useBarberDetail';
import { formatMoney } from '../../../src/utils/formatMoney';
import * as team from '../../../src/api/owner/team';
import { ApiError } from '../../../src/api/client';
import { useOwnerSalonStore } from '../../../src/stores/ownerSalon';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TODAY_IDX = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

export default function BarberDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = id ?? '';
  const [showReassign, setShowReassign] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'revoke' | null>(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const refreshSalon = useOwnerSalonStore((s) => s.refresh);

  const { data: salon } = useMySalon();
  const { data: barber, isLoading, error } = useBarberDetail(staffId);

  async function handleDeactivate() {
    setConfirmAction(null);
    setActionSaving(true);
    setActionError(null);
    try {
      await team.deactivate(staffId);
      await refreshSalon();
      router.back();
    } catch (err) {
      // No client-side "last owner"/self-deactivation rule — surface whatever the backend
      // actually rejected with, rather than guessing and hiding its real reason.
      setActionError(err instanceof ApiError ? err.message : 'Impossible de désactiver ce membre.');
    } finally {
      setActionSaving(false);
    }
  }

  async function handleRevokeAccess() {
    setConfirmAction(null);
    setActionSaving(true);
    setActionError(null);
    try {
      await team.revokeAccess(staffId);
      await refreshSalon();
      router.back();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Impossible de révoquer l'accès.");
    } finally {
      setActionSaving(false);
    }
  }

  if (!barber) {
    return (
      <Screen>
        <Row justify="center" style={{ paddingTop: 80 }}>
          <T variant="body" color={t.color.textMuted}>{isLoading ? 'Loading…' : error ?? 'Barber not found.'}</T>
        </Row>
      </Screen>
    );
  }

  const util = barber.weekUtil.map((d) => d.pct);
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
        </View>
      </Row>

      {/* Assigned salon card */}
      <View style={{
        margin: t.spacing.xxl,
        backgroundColor: t.color.goldSoft,
        borderWidth: 1,
        borderColor: t.color.goldBorder,
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
            <T variant="label">{salon?.name}</T>
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
            {formatMoney(barber.weekRevenueTnd)}
          </T>
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>This week</T>
        </Card>
        <Card style={{ flex: 1, padding: t.spacing.md }}>
          <T variant="subtitle">{barber.weekCuts}</T>
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
        <Button
          variant="dark"
          style={{ flex: 1 }}
          onPress={() => router.push(('/(owner)/team/schedule/' + staffId) as never)}
        >
          Schedule
        </Button>
        <Button variant="dark" style={{ flex: 1 }} disabled>Commission</Button>
      </Row>
      <Row gap={10} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.sm }}>
        <Button
          variant="white"
          style={{ flex: 1 }}
          onPress={() => router.push(('/(owner)/team/edit/' + staffId) as never)}
        >
          Modifier
        </Button>
      </Row>

      {actionError != null && (
        <T variant="small" color={t.color.danger} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
          {actionError}
        </T>
      )}

      {/* Destructive zone — two distinct actions, deliberately not merged into one button. */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xl, gap: 10 }}>
        <Eyebrow>Zone sensible</Eyebrow>
        <T variant="small" color={t.color.textMuted} style={{ lineHeight: 16 }}>
          Désactiver masque ce membre du salon (réversible côté backoffice). Révoquer l'accès
          coupe la connexion au compte — une action distincte, plus radicale.
        </T>
        <Row gap={10}>
          <Button
            variant="dark"
            style={{ flex: 1 }}
            disabled={actionSaving}
            onPress={() => setConfirmAction('deactivate')}
          >
            Désactiver
          </Button>
          <Button
            variant="dark"
            style={{ flex: 1 }}
            disabled={actionSaving}
            onPress={() => setConfirmAction('revoke')}
          >
            Révoquer l'accès
          </Button>
        </Row>
      </View>

      <ConfirmDialog
        visible={confirmAction === 'deactivate'}
        title={`Désactiver ${barber.name} ?`}
        message="Ce membre disparaîtra des listes actives du salon. Réversible par le backoffice."
        confirmLabel="Désactiver"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        visible={confirmAction === 'revoke'}
        title={`Révoquer l'accès de ${barber.name} ?`}
        message="Ce membre ne pourra plus se connecter à son compte. Action distincte de la désactivation."
        confirmLabel="Révoquer"
        destructive
        onConfirm={handleRevokeAccess}
        onCancel={() => setConfirmAction(null)}
      />

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

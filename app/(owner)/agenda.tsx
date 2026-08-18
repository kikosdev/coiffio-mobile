import React, { useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { addDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Badge } from '../../src/components/kit';
import { HeaderAvatarButton } from '../../src/components/owner/HeaderAvatarButton';
import { ResourceView } from '../../src/components/ResourceView';
import { useResource } from '../../src/hooks/useResource';
import { PickerField } from '../../src/components/owner/PickerField';
import * as appointmentsApi from '../../src/api/owner/appointments';
import * as servicesApi from '../../src/api/owner/services';
import * as teamApi from '../../src/api/owner/team';
import { useOwnerSalonStore } from '../../src/stores/ownerSalon';
import { Appointment, AppointmentStatus } from '../../src/types/owner';
import { formatMoney } from '../../src/utils/formatMoney';
import { formatSalonTime, localDateKey, nowAsSalonTime, parseLocalDateKey, salonDateKey } from '../../src/utils/salonTime';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'neutral' | 'gold' | 'success' | 'pending' | 'danger' | 'pro' }> = {
  booked: { label: 'Réservé', variant: 'pending' },
  confirmed: { label: 'Confirmé', variant: 'gold' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'neutral' },
  noshow: { label: 'No-show', variant: 'danger' },
};

/** "Today" pinned to the salon's Tunis calendar day, not the device's raw `new Date()`. */
function todayAsLocalDate(): Date {
  return parseLocalDateKey(salonDateKey(nowAsSalonTime()));
}

function AppointmentRow({
  appt, stylistName, stylistColor, serviceNames,
}: {
  appt: Appointment;
  stylistName: string;
  stylistColor: string;
  serviceNames: string;
}): React.JSX.Element {
  const t = useTheme();
  const status = STATUS_CONFIG[appt.status];

  return (
    <Card
      style={{ padding: 0, overflow: 'hidden', flexDirection: 'row' }}
      onPress={() => router.push(('/(owner)/appointment/' + appt._id) as never)}
    >
      <View style={{ width: 4, backgroundColor: stylistColor }} />
      <View style={{ flex: 1, padding: t.spacing.md, gap: 4 }}>
        <Row justify="space-between">
          <T variant="label">{formatSalonTime(appt.start)}–{formatSalonTime(appt.end)}</T>
          <Badge variant={status.variant}>{status.label}</Badge>
        </Row>
        <T variant="body" numberOfLines={1}>{serviceNames || '…'}</T>
        <Row justify="space-between">
          <T variant="small" color={t.color.textSecondary}>{stylistName}</T>
          <T variant="small" color={t.color.textMuted}>{formatMoney(appt.price)}</T>
        </Row>
      </View>
    </Card>
  );
}

export default function OwnerAgenda(): React.JSX.Element {
  const t = useTheme();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = React.useState<Date>(() => (dateParam ? parseLocalDateKey(dateParam) : todayAsLocalDate()));
  const [stylistId, setStylistId] = React.useState<string | null>(null);

  const salon = useOwnerSalonStore((s) => s.salon);
  const team = salon?.team ?? [];
  const dateKey = localDateKey(date);

  const resource = useResource(
    () => appointmentsApi.list({ date: dateKey, stylistId: stylistId ?? undefined }),
    [dateKey, stylistId],
  );

  // Reload on every focus (not just mount) so returning from a cancel/creation reflects it —
  // there's no shared appointments cache to invalidate from those screens instead.
  useFocusEffect(useCallback(() => {
    resource.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, stylistId]));

  // Auxiliary lookups — fetched once per screen mount, not per row (zero N+1 on the list).
  const catalog = useResource(() => servicesApi.list(), []);
  const staffColors = useResource(() => teamApi.list(), []);

  function serviceNamesFor(appt: Appointment): string {
    if (!catalog.data) return '';
    return appt.services
      .map((id) => catalog.data?.find((s) => s._id === id)?.name)
      .filter((n): n is string => !!n)
      .join(', ');
  }

  function stylistNameFor(appt: Appointment): string {
    return team.find((m) => m.id === appt.stylistId)?.name ?? 'Staff';
  }

  function stylistColorFor(appt: Appointment): string {
    return staffColors.data?.find((s) => s.id === appt.stylistId)?.color ?? t.color.gold;
  }

  return (
    <Screen>
      <ScreenHeader
        title="Agenda"
        subtitle={format(date, 'EEEE d MMMM')}
        right={
          <Row gap={14}>
            <TouchableOpacity onPress={() => router.push('/(owner)/appointment/new' as never)} hitSlop={8}>
              <Plus size={22} color={t.color.gold} />
            </TouchableOpacity>
            <HeaderAvatarButton />
          </Row>
        }
      />

      {/* Day navigation */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => setDate((d) => addDays(d, -1))} hitSlop={8}>
          <ChevronLeft size={22} color={t.color.textPrimary} />
        </TouchableOpacity>
        <PickerField mode="date" value={date} label={format(date, 'EEE d MMM yyyy')} onChange={setDate} />
        <TouchableOpacity onPress={() => setDate((d) => addDays(d, 1))} hitSlop={8}>
          <ChevronRight size={22} color={t.color.textPrimary} />
        </TouchableOpacity>
      </Row>

      {/* Stylist filter */}
      <Row gap={8} style={{ paddingHorizontal: t.spacing.xxl, marginBottom: t.spacing.lg, flexWrap: 'wrap' }}>
        <TouchableOpacity
          onPress={() => setStylistId(null)}
          style={{
            paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
            backgroundColor: stylistId === null ? t.color.gold : t.color.surfaceCard,
            borderWidth: 1, borderColor: stylistId === null ? t.color.gold : t.color.borderSubtle,
          }}
        >
          <T variant="small" color={stylistId === null ? t.color.onGold : t.color.textSecondary}>Tous</T>
        </TouchableOpacity>
        {team.map((m) => {
          const selected = stylistId === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setStylistId(m.id)}
              style={{
                paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
                backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
              }}
            >
              <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{m.name}</T>
            </TouchableOpacity>
          );
        })}
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxl }}>
        <ResourceView
          state={resource}
          emptyLabel="Aucun RDV ce jour"
          emptyCta={{ label: 'Nouveau RDV', onPress: () => router.push('/(owner)/appointment/new' as never) }}
        >
          {(appointments) => (
            <>
              {appointments.map((appt) => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  stylistName={stylistNameFor(appt)}
                  stylistColor={stylistColorFor(appt)}
                  serviceNames={serviceNamesFor(appt)}
                />
              ))}
            </>
          )}
        </ResourceView>
      </View>
    </Screen>
  );
}

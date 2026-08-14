import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Badge, Button, Divider } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import * as appointmentsApi from '../../../src/api/owner/appointments';
import * as servicesApi from '../../../src/api/owner/services';
import * as clientsApi from '../../../src/api/owner/clients';
import { ApiError } from '../../../src/api/client';
import { useOwnerSalonStore } from '../../../src/stores/ownerSalon';
import { AppointmentStatus } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, formatSalonTime } from '../../../src/utils/salonTime';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'neutral' | 'gold' | 'success' | 'pending' | 'danger' | 'pro' }> = {
  booked: { label: 'Réservé', variant: 'pending' },
  confirmed: { label: 'Confirmé', variant: 'gold' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'neutral' },
  noshow: { label: 'No-show', variant: 'danger' },
};

export default function AppointmentDetail(): React.JSX.Element {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointmentId = id ?? '';
  const [cancelling, setCancelling] = useState(false);

  const team = useOwnerSalonStore((s) => s.salon?.team ?? []);
  const catalog = useResource(() => servicesApi.list(), []);

  // Client lookup happens exactly once, here — the list screen uses a placeholder instead to
  // avoid an N+1 fetch per row. A failed client lookup shouldn't hide the rest of the
  // appointment, so it degrades to `null` rather than failing the whole resource.
  const resource = useResource(async () => {
    const appt = await appointmentsApi.get(appointmentId);
    const client = await clientsApi.get(appt.clientId).catch(() => null);
    return { appt, client };
  }, [appointmentId]);

  function handleCancel(): void {
    Alert.alert(
      'Annuler ce RDV ?',
      'Le client sera notifié automatiquement.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler le RDV',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await appointmentsApi.cancel(appointmentId);
              router.back();
            } catch (err) {
              Alert.alert('Erreur', err instanceof ApiError ? err.message : "Impossible d'annuler ce RDV.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Rendez-vous</T>
        <View style={{ width: 32 }} />
      </Row>

      <ResourceView state={resource} emptyLabel="RDV introuvable.">
        {({ appt, client }) => {
          const status = STATUS_CONFIG[appt.status];
          const stylistName = team.find((m) => m.id === appt.stylistId)?.name ?? 'Staff';
          const serviceEntries = appt.services
            .map((sid) => catalog.data?.find((s) => s._id === sid))
            .filter((s): s is NonNullable<typeof s> => !!s);

          return (
            <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
              <Row justify="space-between">
                <T variant="title">{formatSalonTime(appt.start)}–{formatSalonTime(appt.end)}</T>
                <Badge variant={status.variant}>{status.label}</Badge>
              </Row>
              <T variant="small" color={t.color.textSecondary}>{formatSalonDate(appt.start, 'EEEE d MMMM yyyy')}</T>

              <Card style={{ padding: t.spacing.md, gap: 4 }}>
                <Eyebrow>Client</Eyebrow>
                <T variant="body">{client?.name ?? 'Client'}</T>
                {client?.phone ? (
                  <T variant="small" color={t.color.textSecondary}>{client.phone}</T>
                ) : null}
              </Card>

              <Card style={{ padding: t.spacing.md, gap: 4 }}>
                <Eyebrow>Stylist</Eyebrow>
                <T variant="body">{stylistName}</T>
              </Card>

              <Card style={{ padding: t.spacing.md }}>
                <Eyebrow style={{ marginBottom: 8 }}>Services</Eyebrow>
                {serviceEntries.length > 0 ? (
                  serviceEntries.map((s) => (
                    <Row key={s._id} justify="space-between" style={{ marginBottom: 6 }}>
                      <T variant="body" style={{ flex: 1 }}>{s.name}</T>
                      <T variant="small" color={t.color.textSecondary}>{formatMoney(s.price)}</T>
                    </Row>
                  ))
                ) : (
                  <T variant="small" color={t.color.textMuted}>Détail des services indisponible.</T>
                )}
                <Divider style={{ marginVertical: 8 }} />
                <Row justify="space-between">
                  <T variant="label">Total</T>
                  <T variant="label">{formatMoney(appt.price)}</T>
                </Row>
              </Card>

              {(appt.status === 'booked' || appt.status === 'confirmed') && (
                <Button
                  variant="white"
                  fullWidth
                  onPress={() => router.push({
                    pathname: '/(owner)/caisse/checkout',
                    params: {
                      appointmentId: appt._id,
                      stylistId: appt.stylistId,
                      lines: JSON.stringify(serviceEntries.map((s) => ({
                        kind: 'service', refId: s._id, name: s.name, qty: 1, unitPrice: s.price,
                      }))),
                    },
                  } as never)}
                >
                  Encaisser
                </Button>
              )}

              {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                <Button variant="dark" fullWidth disabled={cancelling} onPress={handleCancel}>
                  {cancelling ? 'Annulation…' : 'Annuler le RDV'}
                </Button>
              )}
            </View>
          );
        }}
      </ResourceView>
    </Screen>
  );
}

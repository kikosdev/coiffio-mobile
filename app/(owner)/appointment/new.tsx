import React, { useEffect, useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import { PickerField } from '../../../src/components/owner/PickerField';
import * as servicesApi from '../../../src/api/owner/services';
import * as teamApi from '../../../src/api/owner/team';
import { createAppointment, fetchAvailability, SlotOption } from '../../../src/api/booking';
import { getOwnerSalonSlug } from '../../../src/api/owner/tenant';
import { ApiError } from '../../../src/api/client';
import { useResource } from '../../../src/hooks/useResource';
import { normalizePhone } from '../../../src/utils/phone';
import { formatMoney } from '../../../src/utils/formatMoney';
import { localDateKey, nowAsSalonTime, parseLocalDateKey, salonDateKey } from '../../../src/utils/salonTime';

function todayAsLocalDate(): Date {
  return parseLocalDateKey(salonDateKey(nowAsSalonTime()));
}

export default function NewAppointment(): React.JSX.Element {
  const t = useTheme();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(() => (dateParam ? parseLocalDateKey(dateParam) : todayAsLocalDate()));
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalog = useResource(() => servicesApi.list(), []);
  const staff = useResource(() => teamApi.list(), []);

  const stylists = (staff.data ?? []).filter((s) => s.role === 'stylist' || s.role === 'colorist');
  const selectedServices = (catalog.data ?? []).filter((s) => selectedServiceIds.includes(s._id));
  const dateKey = localDateKey(date);
  const serviceIdsKey = selectedServiceIds.join(',');

  const availability = useResource(async () => {
    if (!stylistId || selectedServiceIds.length === 0) return [];
    return fetchAvailability(await getOwnerSalonSlug(), selectedServiceIds, dateKey, stylistId);
  }, [stylistId, serviceIdsKey, dateKey]);

  // A change to any input that the current slot was computed from invalidates it — better an
  // empty selection than silently booking the wrong time.
  useEffect(() => {
    setSelectedSlot(null);
  }, [stylistId, serviceIdsKey, dateKey]);

  const slots = (availability.data ?? []).flatMap((s) => s.slots);

  function toggleService(id: string): void {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const inputStyle = {
    backgroundColor: t.color.surfaceCard,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderSubtle,
    padding: t.spacing.md,
    color: t.color.textPrimary,
    fontSize: 14,
    fontFamily: t.typography.family.sansMedium,
  };

  const normalizedPhone = normalizePhone(clientPhone);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  const canSubmit =
    clientName.trim().length >= 2 &&
    normalizedPhone !== null &&
    selectedServiceIds.length > 0 &&
    stylistId !== null &&
    selectedSlot !== null &&
    !saving;

  async function handleConfirm(): Promise<void> {
    if (!canSubmit || !normalizedPhone || !stylistId || !selectedSlot) return;
    setSaving(true);
    setError(null);
    try {
      await createAppointment(await getOwnerSalonSlug(), {
        serviceIds: selectedServiceIds,
        stylistId,
        start: selectedSlot.start,
        clientName: clientName.trim(),
        clientPhone: normalizedPhone,
        clientEmail: clientEmail.trim() || undefined,
        source: 'phone',
      });
      Alert.alert('RDV créé', `${clientName.trim()} · ${selectedSlot.time}`);
      router.replace({ pathname: '/(owner)/agenda', params: { date: dateKey } } as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer ce rendez-vous.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Nouveau RDV</T>
        <View style={{ width: 32 }} />
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, paddingBottom: t.spacing.xxxl }}>
        {/* Client */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Client</Eyebrow>
          <View style={{ gap: 8 }}>
            <TextInput
              style={inputStyle}
              placeholder="Nom complet"
              placeholderTextColor={t.color.textMuted}
              value={clientName}
              onChangeText={setClientName}
              autoCapitalize="words"
            />
            <TextInput
              style={inputStyle}
              placeholder="+216 XX XXX XXX"
              placeholderTextColor={t.color.textMuted}
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />
            {clientPhone.length > 0 && normalizedPhone === null && (
              <T variant="small" color={t.color.danger}>Numéro invalide (8 chiffres).</T>
            )}
            <TextInput
              style={inputStyle}
              placeholder="Email (optionnel)"
              placeholderTextColor={t.color.textMuted}
              value={clientEmail}
              onChangeText={setClientEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Services */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Services</Eyebrow>
          <View style={{ gap: 8 }}>
            {(catalog.data ?? []).map((s) => {
              const order = selectedServiceIds.indexOf(s._id);
              const selected = order !== -1;
              return (
                <Card key={s._id} style={{ padding: t.spacing.md }} onPress={() => toggleService(s._id)}>
                  <Row justify="space-between">
                    <Row gap={10} style={{ flex: 1 }}>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: selected ? t.color.gold : t.color.surfaceElevated,
                        borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected ? <T variant="small" color={t.color.onGold}>{order + 1}</T> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <T variant="body" numberOfLines={1}>{s.name}</T>
                        <T variant="small" color={t.color.textMuted}>{s.durationMin} min</T>
                      </View>
                    </Row>
                    <T variant="small" color={t.color.textSecondary}>{formatMoney(s.price)}</T>
                  </Row>
                </Card>
              );
            })}
          </View>
        </View>

        {/* Stylist */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Stylist</Eyebrow>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {stylists.map((s) => {
              const selected = stylistId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setStylistId(s.id)}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.pill,
                    backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                    borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                  }}
                >
                  <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{s.name}</T>
                </TouchableOpacity>
              );
            })}
          </Row>
        </View>

        {/* Date */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Date</Eyebrow>
          <PickerField
            mode="date"
            value={date}
            label={format(date, 'EEE d MMM yyyy')}
            onChange={setDate}
            minimumDate={todayAsLocalDate()}
          />
        </View>

        {/* Slot */}
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Créneau</Eyebrow>
          {!stylistId || selectedServiceIds.length === 0 ? (
            <T variant="small" color={t.color.textMuted}>Choisissez un service et un stylist pour voir les disponibilités.</T>
          ) : slots.length === 0 ? (
            <T variant="small" color={t.color.textMuted}>
              {availability.status === 'loading' ? 'Chargement…' : 'Aucun créneau disponible ce jour.'}
            </T>
          ) : (
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {slots.map((slot) => {
                const selected = selectedSlot?.start === slot.start;
                return (
                  <TouchableOpacity
                    key={slot.start}
                    onPress={() => setSelectedSlot(slot)}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 14, borderRadius: t.radius.md,
                      backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                      borderWidth: 1, borderColor: selected ? t.color.gold : t.color.borderSubtle,
                    }}
                  >
                    <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{slot.time}</T>
                  </TouchableOpacity>
                );
              })}
            </Row>
          )}
        </View>

        {/* Summary */}
        {selectedServices.length > 0 && (
          <Card style={{ padding: t.spacing.md }}>
            <Row justify="space-between">
              <T variant="small" color={t.color.textSecondary}>{selectedServices.length} service(s) · {totalDuration} min</T>
              <T variant="label">{formatMoney(totalPrice)}</T>
            </Row>
          </Card>
        )}

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}

        <Button variant="white" size="lg" fullWidth disabled={!canSubmit} onPress={handleConfirm}>
          {saving ? 'Création…' : 'Confirmer le RDV'}
        </Button>
      </View>
    </Screen>
  );
}

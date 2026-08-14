import React, { useEffect, useState } from 'react';
import { TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button, Divider } from '../../../../src/components/kit';
import { ResourceView } from '../../../../src/components/ResourceView';
import { useResource } from '../../../../src/hooks/useResource';
import { PickerField } from '../../../../src/components/owner/PickerField';
import * as scheduleApi from '../../../../src/api/owner/schedule';
import * as hoursApi from '../../../../src/api/owner/hours';
import { ApiError } from '../../../../src/api/client';
import { BusinessHoursDay, Override, OverrideType, TimeBreak, WeeklyDay } from '../../../../src/types/owner';
import { localDateKey, localTimeKey, parseLocalDateKey, parseLocalTimeKey } from '../../../../src/utils/salonTime';

// Staff.week convention matches businessHours: 0=dimanche…6=samedi. Monday-first display only.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
};

interface DayEdit {
  day: number;
  working: boolean;
  start: string;
  end: string;
  breaks: TimeBreak[];
}

function buildWeekly(weekly: WeeklyDay[]): DayEdit[] {
  return DAY_ORDER.map((day) => {
    const w = weekly.find((x) => x.day === day);
    return w
      ? { day, working: true, start: w.start, end: w.end, breaks: w.breaks ?? [] }
      : { day, working: false, start: '09:00', end: '18:00', breaks: [] };
  });
}

function WeeklyForm({
  stylistId, initialWeekly, salonHours, onSaved,
}: {
  stylistId: string;
  initialWeekly: WeeklyDay[];
  salonHours: BusinessHoursDay[];
  onSaved: () => Promise<void>;
}): React.JSX.Element {
  const t = useTheme();
  const [days, setDays] = useState<DayEdit[]>(() => buildWeekly(initialWeekly));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDays(buildWeekly(initialWeekly));
  }, [initialWeekly]);

  function salonDayFor(day: number): BusinessHoursDay | undefined {
    return salonHours.find((h) => h.day === day);
  }

  function updateDay(day: number, patch: Partial<DayEdit>): void {
    setDays((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  }

  function addBreak(day: number): void {
    setDays((prev) => prev.map((d) => (d.day === day
      ? { ...d, breaks: [...d.breaks, { start: '12:00', end: '13:00' }] }
      : d)));
  }

  function updateBreak(day: number, index: number, patch: Partial<TimeBreak>): void {
    setDays((prev) => prev.map((d) => (d.day === day
      ? { ...d, breaks: d.breaks.map((b, i) => (i === index ? { ...b, ...patch } : b)) }
      : d)));
  }

  function removeBreak(day: number, index: number): void {
    setDays((prev) => prev.map((d) => (d.day === day
      ? { ...d, breaks: d.breaks.filter((_, i) => i !== index) }
      : d)));
  }

  function validate(): string | null {
    for (const d of days) {
      if (!d.working) continue;
      if (d.end <= d.start) {
        return `${DAY_LABELS[d.day]} : l'heure de fin doit être après l'heure de début.`;
      }
      const salonDay = salonDayFor(d.day);
      if (salonDay?.isOpen && (d.start < salonDay.start || d.end > salonDay.end)) {
        return `${DAY_LABELS[d.day]} : les horaires doivent rester dans les heures d'ouverture du salon (${salonDay.start}–${salonDay.end}).`;
      }
    }
    return null;
  }

  async function handleSave(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const weekly: WeeklyDay[] = days
        .filter((d) => d.working)
        .map((d) => ({
          day: d.day,
          start: d.start,
          end: d.end,
          ...(d.breaks.length ? { breaks: d.breaks } : {}),
        }));
      await scheduleApi.setWeekly(stylistId, { weekly });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer les horaires.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
      <Eyebrow>Semaine type</Eyebrow>
      {days.map((d) => {
        const salonDay = salonDayFor(d.day);
        const salonClosed = !salonDay?.isOpen;
        return (
          <Card key={d.day} style={{ padding: t.spacing.md, gap: 10 }}>
            <Row justify="space-between">
              <T variant="body">{DAY_LABELS[d.day]}</T>
              <Switch
                value={d.working}
                disabled={salonClosed}
                onValueChange={(v) => updateDay(d.day, { working: v })}
                trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
                thumbColor={t.color.textPrimary}
              />
            </Row>

            {salonClosed && (
              <T variant="small" color={t.color.textMuted}>Salon fermé ce jour</T>
            )}

            {!salonClosed && d.working && (
              <>
                <Row gap={10}>
                  <View style={{ flex: 1 }}>
                    <PickerField
                      mode="time"
                      value={parseLocalTimeKey(d.start)}
                      label={d.start}
                      onChange={(date) => updateDay(d.day, { start: localTimeKey(date) })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PickerField
                      mode="time"
                      value={parseLocalTimeKey(d.end)}
                      label={d.end}
                      onChange={(date) => updateDay(d.day, { end: localTimeKey(date) })}
                    />
                  </View>
                </Row>

                {d.breaks.map((b, i) => (
                  <Row key={i} gap={10}>
                    <View style={{ flex: 1 }}>
                      <PickerField
                        mode="time"
                        value={parseLocalTimeKey(b.start)}
                        label={b.start}
                        onChange={(date) => updateBreak(d.day, i, { start: localTimeKey(date) })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <PickerField
                        mode="time"
                        value={parseLocalTimeKey(b.end)}
                        label={b.end}
                        onChange={(date) => updateBreak(d.day, i, { end: localTimeKey(date) })}
                      />
                    </View>
                    <TouchableOpacity onPress={() => removeBreak(d.day, i)} style={{ padding: 8 }}>
                      <X size={16} color={t.color.textMuted} />
                    </TouchableOpacity>
                  </Row>
                ))}

                <TouchableOpacity onPress={() => addBreak(d.day)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Plus size={13} color={t.color.gold} />
                  <T variant="small" color={t.color.gold}>Ajouter une pause</T>
                </TouchableOpacity>
              </>
            )}
          </Card>
        );
      })}

      {error != null && (
        <T variant="small" color={t.color.danger}>{error}</T>
      )}

      <Button variant="white" size="lg" fullWidth disabled={saving} onPress={handleSave}>
        {saving ? 'Enregistrement…' : 'Enregistrer la semaine'}
      </Button>
    </View>
  );
}

const OVERRIDE_TYPES: { value: OverrideType; label: string }[] = [
  { value: 'off', label: 'Repos' },
  { value: 'leave', label: 'Congé' },
  { value: 'custom', label: 'Horaire spécial' },
];

function OverridesSection({
  stylistId, overrides, onChanged,
}: {
  stylistId: string;
  overrides: Override[];
  onChanged: () => Promise<void>;
}): React.JSX.Element {
  const t = useTheme();
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<OverrideType>('off');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleAdd(): Promise<void> {
    if (type === 'custom' && customEnd <= customStart) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await scheduleApi.addOverride(stylistId, {
        date: localDateKey(date),
        type,
        start: type === 'custom' ? localTimeKey(customStart) : undefined,
        end: type === 'custom' ? localTimeKey(customEnd) : undefined,
        note: note.trim() || undefined,
      });
      setNote('');
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'ajouter cette exception.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(overrideDate: string): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await scheduleApi.removeOverride(stylistId, overrideDate);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de supprimer cette exception.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xl, gap: 10 }}>
      <Eyebrow>Exceptions ponctuelles</Eyebrow>

      {overrides.length === 0 ? (
        <T variant="small" color={t.color.textMuted}>Aucune exception enregistrée.</T>
      ) : (
        overrides.map((o) => (
          <Card key={o.date} style={{ padding: t.spacing.md }}>
            <Row justify="space-between">
              <View style={{ flex: 1 }}>
                <T variant="body">{format(parseLocalDateKey(o.date), 'EEE d MMM yyyy')}</T>
                <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>
                  {OVERRIDE_TYPES.find((x) => x.value === o.type)?.label ?? o.type}
                  {o.type === 'custom' && o.start && o.end ? ` · ${o.start}–${o.end}` : ''}
                  {o.note ? ` · ${o.note}` : ''}
                </T>
              </View>
              <TouchableOpacity onPress={() => handleRemove(o.date)} disabled={saving} style={{ padding: 6 }}>
                <X size={16} color={t.color.danger} />
              </TouchableOpacity>
            </Row>
          </Card>
        ))
      )}

      <Divider style={{ marginVertical: 6 }} />

      <Eyebrow>Ajouter une exception</Eyebrow>
      <PickerField
        mode="date"
        value={date}
        label={format(date, 'EEE d MMM yyyy')}
        onChange={setDate}
      />

      <Row gap={8}>
        {OVERRIDE_TYPES.map((o) => {
          const selected = type === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => setType(o.value)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: t.radius.md,
                alignItems: 'center',
                backgroundColor: selected ? t.color.gold : t.color.surfaceCard,
                borderWidth: 1,
                borderColor: selected ? t.color.gold : t.color.borderSubtle,
              }}
            >
              <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>{o.label}</T>
            </TouchableOpacity>
          );
        })}
      </Row>

      {type === 'custom' && (
        <Row gap={10}>
          <View style={{ flex: 1 }}>
            <PickerField mode="time" value={customStart} label={localTimeKey(customStart)} onChange={setCustomStart} />
          </View>
          <View style={{ flex: 1 }}>
            <PickerField mode="time" value={customEnd} label={localTimeKey(customEnd)} onChange={setCustomEnd} />
          </View>
        </Row>
      )}

      <TextInput
        style={inputStyle}
        placeholder="Note (optionnel)"
        placeholderTextColor={t.color.textMuted}
        value={note}
        onChangeText={setNote}
      />

      {error != null && (
        <T variant="small" color={t.color.danger}>{error}</T>
      )}

      <Button variant="dark" fullWidth disabled={saving} onPress={handleAdd}>
        {saving ? 'Ajout…' : "Ajouter l'exception"}
      </Button>
    </View>
  );
}

export default function StaffSchedule(): React.JSX.Element {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stylistId = id ?? '';

  const resource = useResource(async () => {
    const [schedule, salonHours] = await Promise.all([
      scheduleApi.getStaff(stylistId),
      hoursApi.getSalon(),
    ]);
    return { schedule, salonHours };
  }, [stylistId]);

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Horaires</T>
        <View style={{ width: 32 }} />
      </Row>

      <ResourceView state={resource} emptyLabel="Aucune donnée.">
        {({ schedule, salonHours }) => (
          <>
            <WeeklyForm
              stylistId={stylistId}
              initialWeekly={schedule.weekly}
              salonHours={salonHours}
              onSaved={resource.reload}
            />
            <OverridesSection
              stylistId={stylistId}
              overrides={schedule.overrides}
              onChanged={resource.reload}
            />
          </>
        )}
      </ResourceView>
    </Screen>
  );
}

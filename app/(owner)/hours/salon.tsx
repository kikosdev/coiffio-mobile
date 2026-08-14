import React, { useEffect, useState } from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Copy } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Button } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import { PickerField } from '../../../src/components/owner/PickerField';
import * as hours from '../../../src/api/owner/hours';
import { ApiError } from '../../../src/api/client';
import { BusinessHoursDay } from '../../../src/types/owner';
import { localTimeKey, parseLocalTimeKey } from '../../../src/utils/salonTime';

// businessHours' `day` is 0=dimanche…6=samedi; this just orders the display Monday-first.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
};

function buildDays(source: BusinessHoursDay[]): BusinessHoursDay[] {
  return DAY_ORDER.map((day) => source.find((d) => d.day === day) ?? { day, isOpen: false, start: '09:00', end: '18:00' });
}

function SalonHoursForm({ initial, onSaved }: { initial: BusinessHoursDay[]; onSaved: () => Promise<void> }): React.JSX.Element {
  const t = useTheme();
  const [days, setDays] = useState<BusinessHoursDay[]>(() => buildDays(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resync after a reload (post-save) so the form reflects whatever the backend actually stored.
  useEffect(() => {
    setDays(buildDays(initial));
  }, [initial]);

  function updateDay(day: number, patch: Partial<BusinessHoursDay>): void {
    setDays((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  }

  function copyToAll(sourceDay: number): void {
    const source = days.find((d) => d.day === sourceDay);
    if (!source) return;
    setDays((prev) => prev.map((d) => ({ ...d, isOpen: source.isOpen, start: source.start, end: source.end })));
  }

  function validate(): string | null {
    for (const d of days) {
      if (d.isOpen && d.end <= d.start) {
        return `${DAY_LABELS[d.day]} : l'heure de fin doit être après l'heure de début.`;
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
      await hours.updateSalon({ businessHours: days });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer les horaires.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxl }}>
      {days.map((d) => (
        <Card key={d.day} style={{ padding: t.spacing.md, gap: 10 }}>
          <Row justify="space-between">
            <T variant="body">{DAY_LABELS[d.day]}</T>
            <Row gap={12}>
              <TouchableOpacity onPress={() => copyToAll(d.day)} hitSlop={8}>
                <Copy size={16} color={t.color.textMuted} />
              </TouchableOpacity>
              <Switch
                value={d.isOpen}
                onValueChange={(v) => updateDay(d.day, { isOpen: v })}
                trackColor={{ false: t.color.surfaceElevated, true: t.color.gold }}
                thumbColor={t.color.textPrimary}
              />
            </Row>
          </Row>

          {d.isOpen && (
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
          )}
        </Card>
      ))}

      {error != null && (
        <T variant="small" color={t.color.danger}>{error}</T>
      )}

      <Button variant="white" size="lg" fullWidth disabled={saving} onPress={handleSave}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </View>
  );
}

export default function OwnerSalonHours(): React.JSX.Element {
  const t = useTheme();
  const resource = useResource(() => hours.getSalon(), []);

  return (
    <Screen>
      <ScreenHeader
        title="Horaires"
        subtitle="Heures d'ouverture du salon"
        right={
          <TouchableOpacity onPress={() => router.push('/(owner)/hours/leave' as never)}>
            <T variant="small" color={t.color.gold}>Congés</T>
          </TouchableOpacity>
        }
      />
      <ResourceView state={resource} emptyLabel="Aucun horaire configuré.">
        {(days) => <SalonHoursForm initial={days} onSaved={resource.reload} />}
      </ResourceView>
    </Screen>
  );
}

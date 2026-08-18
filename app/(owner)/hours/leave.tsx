import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Eyebrow, Button, Badge, Divider } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import { PickerField } from '../../../src/components/owner/PickerField';
import * as scheduleApi from '../../../src/api/owner/schedule';
import { ApiError } from '../../../src/api/client';
import { useOwnerSalonStore } from '../../../src/stores/ownerSalon';
import { LeaveConflict, LeaveRequest, LeaveType } from '../../../src/types/owner';
import { formatSalonTime, localDateKey } from '../../../src/utils/salonTime';

function extractConflicts(details: unknown): LeaveConflict[] {
  if (details && typeof details === 'object' && 'conflicts' in details) {
    const c = (details as { conflicts?: unknown }).conflicts;
    return Array.isArray(c) ? (c as LeaveConflict[]) : [];
  }
  return [];
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'leave', label: 'Congé' },
  { value: 'swap', label: 'Échange' },
];

function LeaveRow({
  req, staffName, onChanged,
}: { req: LeaveRequest; staffName: string; onChanged: () => Promise<void> }): React.JSX.Element {
  const t = useTheme();
  const [saving, setSaving] = useState(false);

  async function doApprove(): Promise<void> {
    setSaving(true);
    try {
      await scheduleApi.approveLeave(req._id);
      await onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const conflicts = extractConflicts(err.details);
        const list = conflicts
          .map((c) => `• ${formatSalonTime(c.start)}–${formatSalonTime(c.end)}`)
          .join('\n');
        Alert.alert(
          'Conflit avec des rendez-vous existants',
          `Réassignez ou annulez ces RDV avant d'approuver.\n\n${list || err.message}`,
        );
      } else {
        Alert.alert('Erreur', err instanceof ApiError ? err.message : "Impossible d'approuver ce congé.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function doReject(): Promise<void> {
    setSaving(true);
    try {
      await scheduleApi.rejectLeave(req._id);
      await onChanged();
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError ? err.message : 'Impossible de refuser ce congé.');
    } finally {
      setSaving(false);
    }
  }

  function handleApprove(): void {
    Alert.alert(
      'Approuver ce congé ?',
      `${staffName} · ${req.range.from} → ${req.range.to}`,
      [{ text: 'Annuler', style: 'cancel' }, { text: 'Approuver', onPress: doApprove }],
    );
  }

  function handleReject(): void {
    Alert.alert(
      'Refuser ce congé ?',
      `${staffName} · ${req.range.from} → ${req.range.to}`,
      [{ text: 'Annuler', style: 'cancel' }, { text: 'Refuser', style: 'destructive', onPress: doReject }],
    );
  }

  const statusVariant = req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'pending';
  const statusLabel = req.status === 'approved' ? 'Approuvé' : req.status === 'rejected' ? 'Refusé' : 'En attente';

  return (
    <Card style={{ padding: t.spacing.md, gap: 8 }}>
      <Row justify="space-between">
        <T variant="body">{staffName}</T>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </Row>
      <T variant="small" color={t.color.textSecondary}>
        {LEAVE_TYPES.find((x) => x.value === req.type)?.label ?? req.type} · {req.range.from} → {req.range.to}
      </T>
      {req.note ? <T variant="small" color={t.color.textMuted}>{req.note}</T> : null}
      {req.status === 'pending' && (
        <Row gap={10} style={{ marginTop: 4 }}>
          <Button variant="dark" size="sm" style={{ flex: 1 }} disabled={saving} onPress={handleReject}>Refuser</Button>
          <Button variant="gold" size="sm" style={{ flex: 1 }} disabled={saving} onPress={handleApprove}>Approuver</Button>
        </Row>
      )}
    </Card>
  );
}

function CreateLeaveForm({ onCreated }: { onCreated: () => Promise<void> }): React.JSX.Element {
  const t = useTheme();
  const salon = useOwnerSalonStore((s) => s.salon);
  const team = salon?.team ?? [];

  const [stylistId, setStylistId] = useState<string | null>(team[0]?.id ?? null);
  const [type, setType] = useState<LeaveType>('leave');
  const [from, setFrom] = useState(new Date());
  const [to, setTo] = useState(new Date());
  const [swapWithId, setSwapWithId] = useState<string | null>(null);
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

  const canSave = stylistId !== null && !saving && (type !== 'swap' || swapWithId !== null);

  function StaffPicker({ selected, onSelect, exclude }: { selected: string | null; onSelect: (id: string) => void; exclude?: string | null }) {
    return (
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {team.filter((m) => m.id !== exclude).map((m) => {
          const isSelected = selected === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => onSelect(m.id)}
              style={{
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: t.radius.pill,
                backgroundColor: isSelected ? t.color.gold : t.color.surfaceCard,
                borderWidth: 1,
                borderColor: isSelected ? t.color.gold : t.color.borderSubtle,
              }}
            >
              <T variant="small" color={isSelected ? t.color.onGold : t.color.textSecondary}>{m.name}</T>
            </TouchableOpacity>
          );
        })}
      </Row>
    );
  }

  async function handleCreate(): Promise<void> {
    if (!canSave || !stylistId) return;
    if (localDateKey(to) < localDateKey(from)) {
      setError('La date de fin doit être après la date de début.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await scheduleApi.createLeave({
        stylistId,
        type,
        range: { from: localDateKey(from), to: localDateKey(to) },
        swapWithId: type === 'swap' && swapWithId ? swapWithId : undefined,
        note: note.trim() || undefined,
      });
      setNote('');
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer cette demande.');
    } finally {
      setSaving(false);
    }
  }

  if (team.length === 0) {
    return <T variant="small" color={t.color.textMuted}>Aucun membre d'équipe chargé.</T>;
  }

  return (
    <View style={{ gap: 10 }}>
      <Eyebrow>Staff</Eyebrow>
      <StaffPicker selected={stylistId} onSelect={setStylistId} />

      <Eyebrow>Type</Eyebrow>
      <Row gap={8}>
        {LEAVE_TYPES.map((lt) => {
          const isSelected = type === lt.value;
          return (
            <TouchableOpacity
              key={lt.value}
              onPress={() => setType(lt.value)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: t.radius.md, alignItems: 'center',
                backgroundColor: isSelected ? t.color.gold : t.color.surfaceCard,
                borderWidth: 1, borderColor: isSelected ? t.color.gold : t.color.borderSubtle,
              }}
            >
              <T variant="small" color={isSelected ? t.color.onGold : t.color.textSecondary}>{lt.label}</T>
            </TouchableOpacity>
          );
        })}
      </Row>

      {type === 'swap' && (
        <>
          <Eyebrow>Échange avec</Eyebrow>
          <StaffPicker selected={swapWithId} onSelect={setSwapWithId} exclude={stylistId} />
        </>
      )}

      <Eyebrow>Période</Eyebrow>
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <PickerField mode="date" value={from} label={format(from, 'EEE d MMM')} onChange={setFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <PickerField mode="date" value={to} label={format(to, 'EEE d MMM')} onChange={setTo} />
        </View>
      </Row>

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

      <Button variant="white" fullWidth disabled={!canSave} onPress={handleCreate}>
        {saving ? 'Envoi…' : 'Créer la demande'}
      </Button>
    </View>
  );
}

export default function OwnerLeave(): React.JSX.Element {
  const t = useTheme();
  const salon = useOwnerSalonStore((s) => s.salon);
  const team = salon?.team ?? [];
  const resource = useResource(() => scheduleApi.listLeave(), []);

  function staffName(id: string): string {
    return team.find((m) => m.id === id)?.name ?? 'Staff';
  }

  return (
    <Screen>
      <ScreenHeader title="Congés" subtitle="Demandes de congé & échanges" />

      <View style={{ paddingHorizontal: t.spacing.xxl }}>
        <CreateLeaveForm onCreated={resource.reload} />
      </View>

      <Divider style={{ marginVertical: t.spacing.xl, marginHorizontal: t.spacing.xxl }} />

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxl }}>
        <Eyebrow>Demandes</Eyebrow>
        <ResourceView state={resource} emptyLabel="Aucune demande de congé.">
          {(requests) => (
            <View style={{ gap: 10 }}>
              {requests.map((r) => (
                <LeaveRow key={r._id} req={r} staffName={staffName(r.stylistId)} onChanged={resource.reload} />
              ))}
            </View>
          )}
        </ResourceView>
      </View>
    </Screen>
  );
}

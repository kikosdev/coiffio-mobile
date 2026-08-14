import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Button } from '../../../../src/components/kit';
import { ResourceView } from '../../../../src/components/ResourceView';
import { useResource } from '../../../../src/hooks/useResource';
import * as team from '../../../../src/api/owner/team';
import { ApiError } from '../../../../src/api/client';
import { useOwnerSalonStore } from '../../../../src/stores/ownerSalon';
import { normalizePhone } from '../../../../src/utils/phone';
import { Staff, StaffRole } from '../../../../src/types/owner';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'stylist', label: 'Styliste' },
  { value: 'colorist', label: 'Coloriste' },
];

// Same domain-data exception as team/invite.tsx — Staff.color is arbitrary per-person data,
// not a UI theme choice.
const COLOR_PRESETS = ['#B89968', '#F4A62A', '#8A6A2A', '#3A8A4A', '#5B7FBD', '#B85C7A', '#7A5CB8', '#5C9CB8'];

function EditForm({ staff, id }: { staff: Staff; id: string }): React.JSX.Element {
  const t = useTheme();
  const refreshSalon = useOwnerSalonStore((s) => s.refresh);

  const isOwner = staff.role === 'owner';
  const initialRole: StaffRole = staff.role === 'owner' ? 'manager' : staff.role;

  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [phone, setPhone] = useState(staff.phone ?? '');
  const [color, setColor] = useState(staff.color);
  const [commissionPct, setCommissionPct] = useState(staff.commissionPct?.toString() ?? '');
  const [baseRate, setBaseRate] = useState(staff.baseRate?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length >= 2 && !saving;

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

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Only the editable subset — never spread the raw Staff record (no _id/__v/isActive
      // here). `role` is omitted entirely for an owner account: the backend 400s if a role
      // patch is sent for one, so there's nothing useful to send.
      await team.update(id, {
        name: name.trim(),
        ...(isOwner ? {} : { role }),
        phone: phone.trim() ? (normalizePhone(phone.trim()) ?? phone.trim()) : undefined,
        color,
        commissionPct: commissionPct.trim() ? Number(commissionPct) : undefined,
        baseRate: baseRate.trim() ? Number(baseRate) : undefined,
      });
      await refreshSalon();
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ces modifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg, paddingTop: t.spacing.lg }}>
      <View>
        <Eyebrow style={{ marginBottom: 7 }}>Nom complet</Eyebrow>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View>
        <Eyebrow style={{ marginBottom: 7 }}>Email</Eyebrow>
        <View style={[inputStyle, { opacity: 0.5 }]}>
          <T variant="body">{staff.email || '—'}</T>
        </View>
        <T variant="small" color={t.color.textMuted} style={{ marginTop: 6 }}>
          L'email n'est pas modifiable depuis cet écran.
        </T>
      </View>

      <View>
        <Eyebrow style={{ marginBottom: 7 }}>Rôle</Eyebrow>
        {isOwner ? (
          <View style={[inputStyle, { opacity: 0.5 }]}>
            <T variant="body">Owner</T>
          </View>
        ) : (
          <Row gap={8}>
            {ROLES.map((r) => {
              const selected = role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setRole(r.value)}
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
                  <T variant="small" color={selected ? t.color.onGold : t.color.textSecondary}>
                    {r.label}
                  </T>
                </TouchableOpacity>
              );
            })}
          </Row>
        )}
      </View>

      <View>
        <Eyebrow style={{ marginBottom: 7 }}>Téléphone</Eyebrow>
        <TextInput
          style={inputStyle}
          placeholder="+216 XX XXX XXX"
          placeholderTextColor={t.color.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <Row gap={t.spacing.md}>
        <View style={{ flex: 1 }}>
          <Eyebrow style={{ marginBottom: 7 }}>Commission %</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="ex. 40"
            placeholderTextColor={t.color.textMuted}
            value={commissionPct}
            onChangeText={setCommissionPct}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Eyebrow style={{ marginBottom: 7 }}>Taux de base</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="TND"
            placeholderTextColor={t.color.textMuted}
            value={baseRate}
            onChangeText={setBaseRate}
            keyboardType="decimal-pad"
          />
        </View>
      </Row>

      <View>
        <Eyebrow style={{ marginBottom: 7 }}>Couleur</Eyebrow>
        <Row gap={10}>
          {COLOR_PRESETS.map((c) => {
            const selected = color === c;
            return (
              <TouchableOpacity key={c} onPress={() => setColor(c)}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: c,
                  borderWidth: selected ? 2 : 0,
                  borderColor: t.color.gold,
                }} />
              </TouchableOpacity>
            );
          })}
        </Row>
      </View>

      {error != null && (
        <T variant="small" color={t.color.danger}>{error}</T>
      )}

      <Button variant="white" size="lg" fullWidth disabled={!canSave} onPress={handleSave} style={{ marginTop: t.spacing.md }}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </View>
  );
}

export default function EditStaffScreen(): React.JSX.Element {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = id ?? '';

  const resource = useResource(
    () => team.list().then((all) => all.find((s) => s.id === staffId) ?? null),
    [staffId],
  );

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Modifier</T>
        <View style={{ width: 32 }} />
      </Row>

      <ResourceView state={resource} emptyLabel="Membre introuvable.">
        {(staff) => (staff ? <EditForm staff={staff} id={staffId} /> : null)}
      </ResourceView>
    </Screen>
  );
}

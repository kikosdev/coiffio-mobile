import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { X, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Avatar, Button } from '../../../src/components/kit';
import * as team from '../../../src/api/owner/team';
import { ApiError } from '../../../src/api/client';
import { useOwnerSalonStore } from '../../../src/stores/ownerSalon';
import { normalizePhone } from '../../../src/utils/phone';
import { genPassword } from '../../../src/utils/genPassword';
import { StaffRole } from '../../../src/types/owner';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'stylist', label: 'Styliste' },
  { value: 'colorist', label: 'Coloriste' },
];

// Staff.color is arbitrary per-person branding data sent to the backend (@IsHexColor()) —
// not a UI theme choice, so these swatches are intentionally raw hex, unlike everything else
// on this screen which uses t.color.* only.
const COLOR_PRESETS = ['#B89968', '#F4A62A', '#8A6A2A', '#3A8A4A', '#5B7FBD', '#B85C7A', '#7A5CB8', '#5C9CB8'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A phone-shaped identifier is normalized to the canonical +216 form; anything else must look like an email. */
function resolveIdentifier(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const asPhone = normalizePhone(trimmed);
  if (asPhone) return asPhone;
  return EMAIL_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

export default function InviteBarber(): React.JSX.Element {
  const t = useTheme();
  const refreshSalon = useOwnerSalonStore((s) => s.refresh);

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<StaffRole>('stylist');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [commissionPct, setCommissionPct] = useState('');
  const [password, setPassword] = useState(() => genPassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedIdentifier = resolveIdentifier(identifier);
  const canSave =
    name.trim().length >= 2 &&
    resolvedIdentifier !== null &&
    password.length >= 6 &&
    !saving;

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

  async function handleSend() {
    if (!canSave || resolvedIdentifier === null) return;
    setSaving(true);
    setError(null);
    try {
      const created = await team.create({
        name: name.trim(),
        identifier: resolvedIdentifier,
        role,
        password,
        phone: phone.trim() ? (normalizePhone(phone.trim()) ?? phone.trim()) : undefined,
        email: email.trim() || undefined,
        color,
        commissionPct: commissionPct.trim() ? Number(commissionPct) : undefined,
      });
      await refreshSalon();
      Alert.alert('Membre ajouté', `${created.name} a été ajouté à l'équipe.`);
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? 'Cet identifiant est déjà utilisé par un autre compte.'
            : err.message,
        );
      } else {
        setError("Impossible d'ajouter ce membre. Réessayez.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      {/* Header */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <X size={22} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Ajouter un membre</T>
        <View style={{ width: 30 }} />
      </Row>

      {/* Avatar placeholder */}
      <View style={{ alignItems: 'center', paddingVertical: t.spacing.xl }}>
        <Avatar initials={name.trim() ? name.trim()[0].toUpperCase() : '+'} size={76} />
      </View>

      {/* Form fields */}
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Nom complet</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="ex. Yusuf Al-Amin"
            placeholderTextColor={t.color.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Identifiant de connexion</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="+216 XX XXX XXX ou email"
            placeholderTextColor={t.color.textMuted}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {identifier.length > 0 && resolvedIdentifier === null && (
            <T variant="small" color={t.color.danger} style={{ marginTop: 6 }}>
              Numéro (8 chiffres) ou email invalide.
            </T>
          )}
        </View>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Rôle</Eyebrow>
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
        </View>

        <Row gap={t.spacing.md}>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Téléphone (optionnel)</Eyebrow>
            <TextInput
              style={inputStyle}
              placeholder="+216 XX XXX XXX"
              placeholderTextColor={t.color.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 7 }}>Commission % (optionnel)</Eyebrow>
            <TextInput
              style={inputStyle}
              placeholder="ex. 40"
              placeholderTextColor={t.color.textMuted}
              value={commissionPct}
              onChangeText={setCommissionPct}
              keyboardType="number-pad"
            />
          </View>
        </Row>

        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Email (optionnel)</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="name@yoursalon.com"
            placeholderTextColor={t.color.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

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

        <View>
          <Row justify="space-between" style={{ marginBottom: 7 }}>
            <Eyebrow>Mot de passe</Eyebrow>
            <TouchableOpacity
              onPress={() => setPassword(genPassword())}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={12} color={t.color.gold} />
              <T variant="small" color={t.color.gold}>Régénérer</T>
            </TouchableOpacity>
          </Row>
          <TextInput
            style={[inputStyle, { fontFamily: t.typography.family.sans }]}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 6, lineHeight: 16 }}>
            Communiquez-le au staff — il ne sera plus affiché. Appuyez longuement sur le champ pour le sélectionner et le copier.
          </T>
        </View>

        {error != null && (
          <T variant="small" color={t.color.danger}>{error}</T>
        )}
      </View>

      {/* Send CTA */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxxl }}>
        <Button
          variant="white"
          size="lg"
          fullWidth
          disabled={!canSave}
          onPress={handleSend}
        >
          {saving ? 'Ajout…' : 'Ajouter au staff'}
        </Button>
      </View>
    </Screen>
  );
}

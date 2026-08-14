import { useMemo, useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Screen, ScreenHeader, Card, T, Eyebrow, Divider, Button } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useResource } from '../../src/hooks/useResource';
import { ApiError } from '../../src/api/client';
import * as hoursApi from '../../src/api/owner/hours';
import { useOwnerSalonStore } from '../../src/stores/ownerSalon';
import type { Salon } from '../../src/types/owner';

/**
 * Identité de l'ÉTABLISSEMENT (nom, adresse, contact) — à ne pas confondre avec
 * `(owner)/profile.tsx`, qui est la personne de l'owner.
 *
 * Lecture via `GET /settings/salon` et non `GET /owner/hq` : ce dernier est un tableau de bord
 * (revenus du jour, `hoursToday` dérivé pour aujourd'hui seulement), pas l'enregistrement
 * éditable.
 *
 * Hors périmètre volontairement : les horaires (`businessHours` est renvoyé par cette route
 * mais s'édite ailleurs — et il coexiste avec `Location.openingHours`, la vraie source des
 * créneaux) et les coordonnées géo (l'endpoint existant écrit `locations.geo`, que la carte
 * mobile ne lit pas). Les deux sont des chantiers à part entière.
 */
export default function OwnerSalonDetails() {
  const t = useTheme();
  const resource = useResource<Salon>(() => hoursApi.getSalonSettings(), []);
  const salon = resource.data;

  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Les champs restent `null` tant que rien n'a été touché : ça distingue "non modifié" de
  // "vidé volontairement", et c'est ce qui permet le diff strict exigé par `$set` brut.
  const current = {
    name: name ?? salon?.name ?? '',
    address: address ?? salon?.address ?? '',
    phone: phone ?? salon?.phone ?? '',
    email: email ?? salon?.email ?? '',
  };

  const changed = useMemo(() => {
    if (!salon) return {};
    const diff: hoursApi.UpdateSalonDto = {};
    if (current.name !== salon.name) diff.name = current.name.trim();
    if (current.address !== salon.address) diff.address = current.address.trim();
    if (current.phone !== salon.phone) diff.phone = current.phone.trim();
    if (current.email !== salon.email) diff.email = current.email.trim();
    return diff;
  }, [salon, current.name, current.address, current.phone, current.email]);

  const dirty = Object.keys(changed).length > 0;
  const nameValid = current.name.trim().length >= 1;
  const canSave = dirty && nameValid && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      // `SettingsService.updateSalon` fait `$set: dto` BRUT sur le document — renvoyer l'objet
      // complet réécrirait des champs que cet écran n'affiche même pas (timezone, currency,
      // taxRate, landing…). Seul le diff part.
      const updated = await hoursApi.updateSalon(changed);
      setName(null); setAddress(null); setPhone(null); setEmail(null);
      await resource.reload();
      // Le nom du salon est affiché ailleurs dans la surface owner depuis ce store.
      useOwnerSalonStore.setState((s) => (s.salon ? { salon: { ...s.salon, name: updated.name, address: updated.address } } : {}));
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    color: t.color.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
    paddingVertical: 6,
    paddingHorizontal: 0,
  };

  return (
    <Screen>
      <ScreenHeader title="Salon details" subtitle="Name, address & contact" />

      {resource.status === 'loading' && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={t.color.gold} />
        </View>
      )}

      {resource.status === 'error' && (
        <View style={{ paddingHorizontal: t.spacing.xxl }}>
          <T variant="body" color={t.color.danger}>{resource.error}</T>
          <View style={{ marginTop: t.spacing.lg }}>
            <Button onPress={resource.reload} variant="ghost">Retry</Button>
          </View>
        </View>
      )}

      {salon && (
        <>
          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Identity</Eyebrow>
          <Card style={{ marginHorizontal: t.spacing.xxl, paddingHorizontal: t.spacing.lg }}>
            <View style={{ paddingVertical: t.spacing.md }}>
              <T variant="small" color={t.color.textMuted}>Salon name</T>
              <TextInput
                value={current.name}
                onChangeText={(v) => { setName(v); setSaved(false); }}
                placeholder="Salon name"
                placeholderTextColor={t.color.textMuted}
                style={fieldStyle}
              />
              {!nameValid && <T variant="small" color={t.color.danger}>Name cannot be empty.</T>}
            </View>
            <Divider />
            <View style={{ paddingVertical: t.spacing.md }}>
              <T variant="small" color={t.color.textMuted}>Address</T>
              <TextInput
                value={current.address}
                onChangeText={(v) => { setAddress(v); setSaved(false); }}
                placeholder="Street, city"
                placeholderTextColor={t.color.textMuted}
                multiline
                style={fieldStyle}
              />
            </View>
          </Card>

          <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxl, marginBottom: 10 }}>Contact</Eyebrow>
          <Card style={{ marginHorizontal: t.spacing.xxl, paddingHorizontal: t.spacing.lg }}>
            <View style={{ paddingVertical: t.spacing.md }}>
              <T variant="small" color={t.color.textMuted}>Phone</T>
              <TextInput
                value={current.phone}
                onChangeText={(v) => { setPhone(v); setSaved(false); }}
                placeholder="00 000 000"
                placeholderTextColor={t.color.textMuted}
                keyboardType="phone-pad"
                style={fieldStyle}
              />
            </View>
            <Divider />
            <View style={{ paddingVertical: t.spacing.md }}>
              <T variant="small" color={t.color.textMuted}>Email</T>
              <TextInput
                value={current.email}
                onChangeText={(v) => { setEmail(v); setSaved(false); }}
                placeholder="contact@salon.tn"
                placeholderTextColor={t.color.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={fieldStyle}
              />
            </View>
          </Card>

          {!!saveError && (
            <T variant="small" color={t.color.danger} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
              {saveError}
            </T>
          )}
          {saved && !dirty && (
            <T variant="small" color={t.color.success} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
              Salon details updated.
            </T>
          )}

          <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.lg }}>
            <Button onPress={handleSave} disabled={!canSave} fullWidth>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}

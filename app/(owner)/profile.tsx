import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileScreen, Card, Row, T, Eyebrow, Divider, Button, Badge, ConfirmDialog } from '../../src/components/kit';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { ApiError } from '../../src/api/client';
import {
  ChevronRight, KeyRound, Menu, Settings as SettingsIcon, Building2, Clock, Users, Banknote, LogOut,
} from 'lucide-react-native';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

interface MenuEntry {
  key: string;
  label: string;
  icon: typeof SettingsIcon;
  onPress: () => void;
}

/**
 * Raccourcis de PREMIER NIVEAU seulement — pas les ~20 écrans owner. Ce sont les mêmes
 * destinations que la grille Business (Settings, Salon hours) + les onglets Team/Caisse
 * (déjà à un tap dans la tab bar, mais accessibles ici aussi pour rester joignables depuis
 * n'importe quel écran owner sans repasser par la tab bar). "My profile" est délibérément
 * absent : ce sheet s'ouvre DEPUIS cet écran, y pointer serait un aller vers soi-même.
 *
 * Settings garde sa tuile dans Business (coexistence, décision validée) — ce sheet est un
 * SECOND chemin vers la même destination, jamais une destination dupliquée.
 */
function buildMenuEntries(openLogoutConfirm: () => void): MenuEntry[] {
  return [
    { key: 'settings', label: 'Settings', icon: SettingsIcon, onPress: () => router.push('/(owner)/settings' as never) },
    { key: 'salon-details', label: 'Salon details', icon: Building2, onPress: () => router.push('/(owner)/salon-details' as never) },
    { key: 'salon-hours', label: 'Salon hours', icon: Clock, onPress: () => router.push('/(owner)/hours/salon' as never) },
    { key: 'team', label: 'Team', icon: Users, onPress: () => router.push('/(owner)/team' as never) },
    { key: 'caisse', label: 'Caisse', icon: Banknote, onPress: () => router.push('/(owner)/caisse' as never) },
    { key: 'logout', label: 'Log out', icon: LogOut, onPress: openLogoutConfirm },
  ];
}

/**
 * Profil de la PERSONNE de l'owner — pas celui du salon (nom/adresse/horaires du salon vivent
 * sous Business → Salon hours). L'owner est un `Staff`, donc son identité arrive déjà dans
 * `authStore.user` via `GET /auth/me` : aucun fetch ici, contrairement au profil staff qui
 * appelle le réseau uniquement pour ses statistiques.
 *
 * Édition via `PATCH /auth/me` (`authStore.updateProfile`), qui gère la branche staff côté
 * backend. Hors périmètre volontairement : l'avatar (aucun champ image sur `Staff` — l'app
 * dérive des initiales + `color`) et l'identifiant de connexion, que cette route ne modifie pas.
 */
export default function OwnerProfile() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fermer le sheet AVANT d'ouvrir la confirmation — les deux sont des Modal, en superposer
  // deux à la fois est le genre de chose qui casse silencieusement sur certains appareils.
  const menuEntries = buildMenuEntries(() => { setMenuOpen(false); setShowLogoutConfirm(true); });

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(); // purge aussi le cache tenant owner + le socket notifs (voir stores/auth.ts)
    router.replace('/');
  };

  const dirty = useMemo(
    () => !!user && (name !== (user.name ?? '') || email !== (user.email ?? '') || phone !== (user.phone ?? '')),
    [user, name, email, phone],
  );
  const nameValid = name.trim().length >= 2;
  const canSave = dirty && nameValid && !saving;

  // État "loading" réel : la session est encore en hydratation (authStore.hydrate → /auth/me).
  if (!user) {
    return (
      <ProfileScreen name="" initials="" subtitle="Owner · BLACK BOX HQ">
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={t.color.gold} />
        </View>
      </ProfileScreen>
    );
  }

  async function handleSave() {
    if (!canSave || !user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Seuls les champs réellement modifiés partent — évite de renvoyer un email inchangé
      // dans le contrôle d'unicité backend.
      await updateProfile({
        ...(name !== user.name ? { name: name.trim() } : {}),
        ...(email !== user.email ? { email: email.trim() } : {}),
        ...(phone !== user.phone ? { phone: phone.trim() } : {}),
      });
      setSaved(true);
    } catch (err) {
      // 409 = l'email est déjà pris par un autre staff du même salon (contrôle d'unicité de
      // PATCH /auth/me). Message explicite plutôt qu'un échec muet.
      if (err instanceof ApiError && err.status === 409) {
        setError('Cet email est déjà utilisé par un autre membre du salon.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      }
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
    <ProfileScreen
      name={user.name}
      initials={initials(user.name)}
      subtitle={`${user.role === 'owner' ? 'Owner' : user.role} · BLACK BOX HQ`}
      headerRight={
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityLabel="Menu">
          <Menu size={22} color={t.color.textPrimary} />
        </TouchableOpacity>
      }
    >
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>My details</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl, paddingHorizontal: t.spacing.lg }}>
        <View style={{ paddingVertical: t.spacing.md }}>
          <T variant="small" color={t.color.textMuted}>Full name</T>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setSaved(false); }}
            placeholder="Your name"
            placeholderTextColor={t.color.textMuted}
            style={fieldStyle}
          />
          {!nameValid && (
            <T variant="small" color={t.color.danger}>At least 2 characters.</T>
          )}
        </View>
        <Divider />
        <View style={{ paddingVertical: t.spacing.md }}>
          <T variant="small" color={t.color.textMuted}>Email</T>
          <TextInput
            value={email}
            onChangeText={(v) => { setEmail(v); setSaved(false); }}
            placeholder="you@example.com"
            placeholderTextColor={t.color.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={fieldStyle}
          />
        </View>
        <Divider />
        <View style={{ paddingVertical: t.spacing.md }}>
          <T variant="small" color={t.color.textMuted}>Phone</T>
          <TextInput
            value={phone}
            onChangeText={(v) => { setPhone(v); setSaved(false); }}
            placeholder="00 000 000"
            placeholderTextColor={t.color.textMuted}
            keyboardType="phone-pad"
            style={fieldStyle}
          />
        </View>
      </Card>

      {/* Le login lui-même n'est pas modifiable par PATCH /auth/me — affiché en lecture seule
          plutôt que présenté comme un champ éditable qui échouerait. */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
        <T variant="small" color={t.color.textMuted}>Role</T>
        <Badge variant="neutral">{user.role}</Badge>
      </Row>

      {!!error && (
        <T variant="small" color={t.color.danger} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
          {error}
        </T>
      )}
      {saved && !dirty && (
        <T variant="small" color={t.color.success} style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.md }}>
          Profile updated.
        </T>
      )}

      <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.lg }}>
        <Button onPress={handleSave} disabled={!canSave} fullWidth>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </View>

      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxl, marginBottom: 10 }}>Security</Eyebrow>
      <Card style={{ marginHorizontal: t.spacing.xxl }}>
        <Pressable
          onPress={() => router.push('/(owner)/change-password' as never)}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        >
          <Row justify="space-between" style={{ padding: t.spacing.lg }}>
            <Row gap={t.spacing.md} style={{ flex: 1 }}>
              <KeyRound size={18} color={t.color.goldWarm} />
              <T variant="body" style={{ flex: 1 }}>Change password</T>
            </Row>
            <ChevronRight size={18} color={t.color.textMuted} />
          </Row>
        </Pressable>
      </Card>

      {/* ── Menu ☰ (bottom sheet) ──────────────────────────────────────────────
          Même mécanique que le sélecteur de barbier client (salon/[id].tsx) : Modal natif
          transparent + overlay pressable + sheet coulissant. Aucune dépendance nouvelle. */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={sheetStyles.overlay} onPress={() => setMenuOpen(false)} />
        <View
          style={[
            sheetStyles.sheet,
            { backgroundColor: t.color.surfaceCard, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[sheetStyles.handle, { backgroundColor: t.color.borderStrong }]} />
          <T variant="subtitle" style={{ marginBottom: 16 }}>Menu</T>
          {menuEntries.map((entry, i) => {
            const Icon = entry.icon;
            return (
              <Pressable
                key={entry.key}
                style={({ pressed }) => [
                  sheetStyles.item,
                  {
                    borderTopColor: t.color.borderSubtle,
                    borderTopWidth: i > 0 ? 1 : 0,
                    backgroundColor: pressed ? t.color.surfaceElevated : 'transparent',
                  },
                ]}
                onPress={() => { setMenuOpen(false); entry.onPress(); }}
              >
                <Icon size={18} color={t.color.goldWarm} />
                <T variant="body" style={{ flex: 1 }}>{entry.label}</T>
                <ChevronRight size={18} color={t.color.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </Modal>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to manage your salon."
        confirmLabel="Log out"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </ProfileScreen>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle:  { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  item:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
});

import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useRoleStore } from '../../src/state/role';
import { useAuthStore } from '../../src/stores/auth';
import { resolveRole, ROLE_AUTH, mapBackendRoleToSurface } from '../../src/features/auth/roleConfig';
import { Role } from '../../src/theme/tokens';

// ── SVG icons (react-native-svg, no @expo/vector-icons dependency) ──────────

function LogoMark({ color }: { color: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={2.4} />
      <Circle cx={6} cy={18} r={2.4} />
      <Path d="M8 8l12 8M8 16L20 8" />
    </Svg>
  );
}

function IconClient({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
    </Svg>
  );
}

function IconBarber({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={2.4} />
      <Circle cx={6} cy={18} r={2.4} />
      <Path d="M8 8l12 8M8 16L20 8" />
    </Svg>
  );
}

function IconOwner({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21V8l5-3 5 3v13" />
      <Path d="M13 21V11l5-3 3 2v11" />
    </Svg>
  );
}

function IconMail({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={14} rx={3} />
      <Path d="M3 7l9 6 9-6" />
    </Svg>
  );
}

function IconLock({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={11} width={16} height={10} rx={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

function IconEyeOpen({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

function IconEyeOff({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12s3.5-7 10-7c2 0 3.7.6 5.2 1.5M22 12s-3.5 7-10 7c-2 0-3.8-.6-5.3-1.6" />
      <Path d="M9.5 9.5a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Svg>
  );
}

function IconArrowRight({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

function IconInfo({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 8h.01M11 12h1v4h1" />
    </Svg>
  );
}

function IconApple({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.3 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.3-.9-2.4-3.6zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" />
    </Svg>
  );
}

function IconGoogle() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-7.9z" />
      <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
      <Path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
      <Path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
    </Svg>
  );
}

const ROLE_ICON: Record<Role, (p: { color: string }) => JSX.Element> = {
  client: IconClient,
  staff: IconBarber,
  owner: IconOwner,
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const t = useTheme();
  const setRole = useRoleStore((s) => s.setRole);
  const login = useAuthStore((s) => s.login);
  const insets = useSafeAreaInsets();
  const { role: rawRole } = useLocalSearchParams<{ role?: string }>();
  const role = resolveRole(rawRole);
  const cfg = ROLE_AUTH[role];
  const RoleIcon = ROLE_ICON[role];

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSignIn() {
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      // Redirect by the account's real role, not the login variant the user tapped —
      // a stylist landing on the client home would be a broken/confusing state.
      const surface = mapBackendRoleToSurface(user.role);
      setRole(surface);
      router.replace(ROLE_AUTH[surface].home as never);
    } catch {
      setFormError('Invalid email/phone or password.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCreateAccount() {
    router.push({ pathname: '/(auth)/create-account', params: { role: 'client' } } as never);
  }

  function handleGuest() {
    router.replace('/(client)/home' as never);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.color.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: t.color.gold }]}>
            <LogoMark color={t.color.onGold} />
          </View>
          <Text style={[styles.brandName, { color: t.color.textPrimary }]}>
            BLACK BOX
          </Text>
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: t.color.textPrimary }]}>
          Welcome back.
        </Text>

        {/* Role badge */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.roleBadge, { backgroundColor: t.color.surfaceInput, borderColor: t.color.borderSubtle }]}
          hitSlop={6}
        >
          <View style={[styles.roleIconWrap, { backgroundColor: t.color.goldSoft }]}>
            <RoleIcon color={t.color.gold} />
          </View>
          <Text style={[styles.roleLabel, { color: t.color.textPrimary }]}>
            {cfg.label}
          </Text>
          <View style={[styles.roleDivider, { backgroundColor: t.color.borderStrong }]} />
          <Text style={[styles.roleChange, { color: t.color.textSecondary }]}>
            Change
          </Text>
        </Pressable>

        {/* Identifier (email or phone) */}
        <Text style={[styles.fieldLabel, { color: t.color.textMuted }]}>
          {cfg.emailLabel}
        </Text>
        <View style={[
          styles.field,
          { backgroundColor: t.color.surfaceCard, borderColor: identifierFocused ? t.color.gold : t.color.borderSubtle },
        ]}>
          <IconMail color={t.color.textMuted} />
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={cfg.emailPlaceholder}
            placeholderTextColor={t.color.textMuted}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setIdentifierFocused(true)}
            onBlur={() => setIdentifierFocused(false)}
            style={[styles.input, { color: t.color.textPrimary }]}
          />
        </View>

        {/* Password header */}
        <View style={styles.pwHeader}>
          <Text style={[styles.fieldLabel, { color: t.color.textMuted, marginTop: 0 }]}>
            PASSWORD
          </Text>
          <Pressable hitSlop={8}>
            <Text style={[styles.forgot, { color: t.color.gold }]}>Forgot?</Text>
          </Pressable>
        </View>
        <View style={[
          styles.field,
          { backgroundColor: t.color.surfaceCard, borderColor: pwFocused ? t.color.gold : t.color.borderSubtle },
        ]}>
          <IconLock color={t.color.textMuted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={t.color.textMuted}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            style={[styles.input, { color: t.color.textPrimary }]}
          />
          <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
            {showPw
              ? <IconEyeOff color={t.color.textSecondary} />
              : <IconEyeOpen color={t.color.textSecondary} />}
          </Pressable>
        </View>

        {/* Error */}
        {formError && (
          <Text style={[styles.errorText, { color: t.color.danger }]}>{formError}</Text>
        )}

        {/* Sign in CTA */}
        <Pressable
          onPress={handleSignIn}
          disabled={submitting}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: t.color.gold, opacity: pressed || submitting ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.primaryText, { color: t.color.onGold }]}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.color.borderSubtle }]} />
          <Text style={[styles.dividerText, { color: t.color.textMuted }]}>or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.color.borderSubtle }]} />
        </View>

        {/* Social */}
        <View style={styles.socialRow}>
          <Pressable
            style={({ pressed }) => [
              styles.social,
              { backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard, borderColor: t.color.borderSubtle },
            ]}
          >
            <IconApple color={t.color.textPrimary} />
            <Text style={[styles.socialText, { color: t.color.textPrimary }]}>Apple</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.social,
              { backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard, borderColor: t.color.borderSubtle },
            ]}
          >
            <IconGoogle />
            <Text style={[styles.socialText, { color: t.color.textPrimary }]}>Google</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {cfg.canSignup ? (
            <>
              <Pressable onPress={handleCreateAccount} hitSlop={6}>
                <Text style={[styles.footerText, { color: t.color.textSecondary }]}>
                  New here?{' '}
                  <Text style={{ color: t.color.gold, fontWeight: '700' }}>Create an account</Text>
                </Text>
              </Pressable>
              <Pressable
                onPress={handleGuest}
                style={({ pressed }) => [
                  styles.guestBtn,
                  { borderColor: t.color.borderSubtle, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={4}
              >
                <Text style={[styles.guestText, { color: t.color.textMuted }]}>Continue as guest</Text>
                <IconArrowRight color={t.color.textMuted} />
              </Pressable>
            </>
          ) : (
            <View style={[styles.staffNote, { backgroundColor: t.color.surfaceInput, borderColor: t.color.borderSubtle }]}>
              <IconInfo color={t.color.textMuted} />
              <Text style={[styles.noteText, { color: t.color.textSecondary }]}>
                {cfg.staffNote}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 26 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 26 },
  brandMark: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 19, fontWeight: '900', letterSpacing: 3.4 },

  heading: { fontSize: 32, fontWeight: '800', lineHeight: 35, letterSpacing: -0.3, marginBottom: 14 },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    alignSelf: 'flex-start', borderWidth: 1,
    borderRadius: 100, paddingVertical: 6, paddingRight: 12, paddingLeft: 6,
    marginBottom: 26,
  },
  roleIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { fontSize: 12.5, fontWeight: '700' },
  roleDivider: { width: 1, height: 14 },
  roleChange: { fontSize: 11.5, fontWeight: '600' },

  fieldLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.1,
    marginTop: 18, marginBottom: 8,
  },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderWidth: 1.5, borderRadius: 15, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  pwHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 18, marginBottom: 8,
  },
  forgot: { fontSize: 12, fontWeight: '700' },

  errorText: { fontSize: 12.5, fontWeight: '600', marginTop: 14 },

  primary: {
    borderRadius: 15, alignItems: 'center', paddingVertical: 17, marginTop: 26,
  },
  primaryText: { fontSize: 16, fontWeight: '800' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11.5, fontWeight: '600' },

  socialRow: { flexDirection: 'row', gap: 11 },
  social: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 13,
  },
  socialText: { fontSize: 13.5, fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: 26, gap: 16 },
  footerText: { fontSize: 13.5, fontWeight: '500' },

  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 22,
    width: '100%',
  },
  guestText: { fontSize: 13.5, fontWeight: '600' },

  staffNote: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderRadius: 13, padding: 13,
    width: '100%',
  },
  noteText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
});

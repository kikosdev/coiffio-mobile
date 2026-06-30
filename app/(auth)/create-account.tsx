import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Svg, { Circle, Path, Rect, Polyline, Check } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useRoleStore } from '../../src/state/role';

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconBack({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

function IconClient({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
    </Svg>
  );
}

function IconUser({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
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

function IconCheck({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function pwStrength(pw: string): number {
  if (pw.length === 0) return 0;
  if (pw.length < 4) return 1;
  if (pw.length < 7) return 2;
  if (pw.length < 8) return 3;
  return 4;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CreateAccountScreen() {
  const router = useRouter();
  const t = useTheme();
  const setRole = useRoleStore((s) => s.setRole);
  const insets = useSafeAreaInsets();

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [agreed, setAgreed]       = useState(false);

  const [nameFocused,  setNameFocused]  = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [pwFocused,    setPwFocused]    = useState(false);

  const strength = pwStrength(password);
  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes('@') &&
    phone.trim().length >= 6 &&
    password.length >= 8 &&
    agreed;

  function handleCreate() {
    // TODO: POST /auth/register { fullName, email, phone: '+1' + phone, password, role: 'client' }
    setRole('client');
    router.replace('/(client)/home' as never);
  }

  const strengthColor = strength === 4
    ? t.color.success
    : strength >= 2
    ? t.color.gold
    : t.color.danger;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.color.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: t.color.surfaceCard, borderColor: t.color.borderSubtle, opacity: pressed ? 0.7 : 1 },
            ]}
            hitSlop={8}
          >
            <IconBack color={t.color.textPrimary} />
          </Pressable>

          {/* CLIENT SIGN-UP badge */}
          <View style={[styles.rolePill, { backgroundColor: t.color.goldSoft, borderColor: t.color.borderSubtle }]}>
            <IconClient color={t.color.gold} />
            <Text style={[styles.rolePillText, { color: t.color.gold }]}>CLIENT SIGN-UP</Text>
          </View>

          {/* Spacer to balance back button */}
          <View style={{ width: 36 }} />
        </View>

        {/* ── Heading ── */}
        <Text style={[styles.heading, { color: t.color.textPrimary }]}>
          Create your{'\n'}account
        </Text>
        <Text style={[styles.sub, { color: t.color.textSecondary }]}>
          Book cuts, save your favourite barbers and track every visit.
        </Text>

        {/* ── Full name ── */}
        <Text style={[styles.label, { color: t.color.textMuted }]}>FULL NAME</Text>
        <View style={[styles.field, { backgroundColor: t.color.surfaceCard, borderColor: nameFocused ? t.color.gold : t.color.borderSubtle }]}>
          <IconUser color={t.color.textMuted} />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Michael Reeves"
            placeholderTextColor={t.color.textMuted}
            autoCapitalize="words"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={[styles.input, { color: t.color.textPrimary }]}
          />
        </View>

        {/* ── Email ── */}
        <Text style={[styles.label, { color: t.color.textMuted }]}>EMAIL</Text>
        <View style={[styles.field, { backgroundColor: t.color.surfaceCard, borderColor: emailFocused ? t.color.gold : t.color.borderSubtle }]}>
          <IconMail color={t.color.textMuted} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={t.color.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={[styles.input, { color: t.color.textPrimary }]}
          />
        </View>

        {/* ── Phone ── */}
        <Text style={[styles.label, { color: t.color.textMuted }]}>PHONE</Text>
        <View style={[styles.field, { backgroundColor: t.color.surfaceCard, borderColor: phoneFocused ? t.color.gold : t.color.borderSubtle, paddingHorizontal: 0, gap: 0 }]}>
          {/* Country prefix */}
          <View style={[styles.phonePrefix, { borderRightColor: t.color.borderSubtle }]}>
            <Text style={{ fontSize: 14, marginRight: 2 }}>🇺🇸</Text>
            <Text style={[styles.phonePrefixText, { color: t.color.textPrimary }]}>+1</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="415 555 0142"
            placeholderTextColor={t.color.textMuted}
            keyboardType="phone-pad"
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            style={[styles.input, { color: t.color.textPrimary, paddingHorizontal: 14 }]}
          />
        </View>

        {/* ── Password ── */}
        <Text style={[styles.label, { color: t.color.textMuted }]}>PASSWORD</Text>
        <View style={[styles.field, { backgroundColor: t.color.surfaceCard, borderColor: pwFocused ? t.color.gold : t.color.borderSubtle }]}>
          <IconLock color={t.color.textMuted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
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

        {/* Password strength bars */}
        <View style={styles.strengthRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.strengthBar,
                { backgroundColor: i <= strength ? strengthColor : t.color.surfaceElevated },
              ]}
            />
          ))}
        </View>

        {/* ── Terms checkbox ── */}
        <Pressable onPress={() => setAgreed((v) => !v)} style={styles.checkRow}>
          <View style={[
            styles.checkbox,
            {
              backgroundColor: agreed ? t.color.gold : 'transparent',
              borderColor: agreed ? t.color.gold : t.color.borderStrong,
            },
          ]}>
            {agreed && <IconCheck color={t.color.onGold} />}
          </View>
          <Text style={[styles.checkText, { color: t.color.textSecondary }]}>
            I agree to the{' '}
            <Text style={{ color: t.color.gold, fontWeight: '700' }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: t.color.gold, fontWeight: '700' }}>Privacy Policy</Text>
            .
          </Text>
        </Pressable>

        {/* ── CTA ── */}
        <Pressable
          onPress={handleCreate}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primary,
            {
              backgroundColor: canSubmit ? t.color.gold : t.color.surfaceCard,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: canSubmit ? t.color.onGold : t.color.textMuted }]}>
            Create account
          </Text>
        </Pressable>

        {/* ── Footer ── */}
        <Pressable onPress={() => router.back()} style={styles.footer} hitSlop={8}>
          <Text style={[styles.footerText, { color: t.color.textSecondary }]}>
            Already have an account?{' '}
            <Text style={{ color: t.color.gold, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 100,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  rolePillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },

  heading: { fontSize: 34, fontWeight: '800', lineHeight: 38, letterSpacing: -0.4, marginBottom: 10 },
  sub: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginBottom: 4 },

  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 20, marginBottom: 8 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  phonePrefix: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, height: '100%',
    borderRightWidth: 1,
  },
  phonePrefixText: { fontSize: 15, fontWeight: '600' },

  strengthRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },

  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 22,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  checkText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 19 },

  primary: { borderRadius: 14, alignItems: 'center', paddingVertical: 17, marginTop: 22 },
  primaryText: { fontSize: 16, fontWeight: '800' },

  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 13.5, fontWeight: '500' },
});

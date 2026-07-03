import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { ApiError } from '../../src/api/client';

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function Field({
  label, value, onChangeText, focused, onFocus, onBlur, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  focused: boolean; onFocus: () => void; onBlur: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>{label.toUpperCase()}</Text>
      <View style={[
        styles.inputCard,
        { backgroundColor: t.color.surfaceCard, borderColor: focused ? t.color.gold : t.color.borderSubtle },
      ]}>
        <TextInput
          style={[styles.input, { color: t.color.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType ?? 'default'}
          keyboardAppearance="dark"
          selectionColor={t.color.gold}
          placeholderTextColor={t.color.textMuted}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

export default function StaffPersonalInfoScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isChanged = name !== (user?.name ?? '') || email !== (user?.email ?? '') || phone !== (user?.phone ?? '');
  const canSave = isChanged && name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.color.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Update information</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
          <Text style={[styles.saveBtn, { color: canSave ? t.color.goldWarm : t.color.textMuted }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field
          label="Full name"
          value={name}
          onChangeText={(v) => { setName(v); setError(null); }}
          focused={focusedField === 'name'}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null); }}
          focused={focusedField === 'email'}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          keyboardType="email-address"
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(null); }}
          focused={focusedField === 'phone'}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
          keyboardType="phone-pad"
        />

        {error != null && (
          <Text style={[styles.errorText, { color: t.color.danger }]}>{error}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 },
  topTitle:   { fontSize: 15, fontWeight: '700' },
  saveBtn:    { fontSize: 14, fontWeight: '700' },

  body:       { paddingHorizontal: 22, paddingTop: 20 },
  eyebrow:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },

  inputCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14 },
  input:      { flex: 1, fontSize: 17, fontWeight: '500', padding: 0 },

  errorText:  { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useProfile, type ClientPersonal } from '../../../src/stores/profile';
import type { KeyboardTypeOptions } from 'react-native';

// ── Icon ──────────────────────────────────────────────────────────────────────

function XCircle({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M15 9l-6 6M9 9l6 6" />
    </Svg>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(kind: string | undefined, field: string | undefined, value: string): string | null {
  if (!value.trim()) return 'This field cannot be empty.';

  if (kind === 'email') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Enter a valid email address.';
  }

  return null;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function EditFieldScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();

  const { field, label, value: initialValue, helper, maxLength: maxLenStr, keyboard, kind } =
    useLocalSearchParams<{
      field: string;
      label: string;
      value: string;
      helper?: string;
      maxLength?: string;
      keyboard?: string;
      kind?: string;
    }>();

  const maxLength = maxLenStr ? parseInt(maxLenStr, 10) : undefined;
  const [value, setValue] = useState(initialValue ?? '');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const [saving, setSaving] = useState(false);
  const isChanged = value !== (initialValue ?? '');
  const liveError = validate(kind, field, value);
  const canSave = isChanged && !liveError && !saving;

  const handleSave = async () => {
    const err = validate(kind, field, value);
    if (err) { setError(err); return; }

    setSaving(true);
    try {
      await profile.updateField(field as keyof ClientPersonal, value.trim());
      router.back();
    } catch {
      setError('Could not save this change. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setValue('');
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.color.bgBase }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.cancelBtn, { color: t.color.textMuted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>{label}</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
          <Text style={[styles.saveBtn, { color: canSave ? t.color.goldWarm : t.color.textMuted }]}>
            Save
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Eyebrow */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted }]}>
          {(label ?? '').toUpperCase()}
        </Text>

        {/* Input card */}
        <View style={[
          styles.inputCard,
          {
            backgroundColor: t.color.surfaceCard,
            borderColor: focused ? t.color.gold : t.color.borderSubtle,
          },
        ]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: t.color.textPrimary }]}
            value={value}
            onChangeText={(v) => { setValue(v); setError(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            keyboardType={(keyboard ?? 'default') as KeyboardTypeOptions}
            maxLength={maxLength}
            keyboardAppearance="dark"
            placeholderTextColor={t.color.textMuted}
            selectionColor={t.color.gold}
            returnKeyType="done"
            onSubmitEditing={canSave ? handleSave : undefined}
            autoCapitalize={kind === 'email' || field === 'username' ? 'none' : 'words'}
            autoCorrect={false}
          />
          {value.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8} style={{ paddingLeft: 4 }}>
              <XCircle color={t.color.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Error */}
        {error != null && (
          <Text style={[styles.errorText, { color: t.color.danger }]}>{error}</Text>
        )}

        {/* Helper row */}
        {(helper || maxLength) && (
          <View style={styles.helperRow}>
            <Text style={[styles.helperText, { color: t.color.textMuted, flex: 1 }]}>
              {helper ?? ''}
            </Text>
            {maxLength && (
              <Text style={[styles.helperText, { color: value.length > maxLength * 0.9 ? t.color.goldWarm : t.color.textMuted }]}>
                {value.length}/{maxLength}
              </Text>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:       { flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 8 },
  cancelBtn:  { fontSize: 14, fontWeight: '600' },
  topTitle:   { fontSize: 15, fontWeight: '700' },
  saveBtn:    { fontSize: 14, fontWeight: '700' },

  body:       { paddingHorizontal: 22, paddingTop: 20 },
  eyebrow:    { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },

  inputCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14 },
  input:      { flex: 1, fontSize: 17, fontWeight: '500', padding: 0 },

  errorText:  { fontSize: 12, fontWeight: '500', marginTop: 7 },
  helperRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  helperText: { fontSize: 12, fontWeight: '500' },
});

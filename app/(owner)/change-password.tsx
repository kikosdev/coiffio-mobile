import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/stores/auth';
import { ApiError } from '../../src/api/client';

function PasswordField({
  label, value, onChangeText, focused, onFocus, onBlur, returnKeyType, onSubmitEditing, inputRef,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  returnKeyType: 'next' | 'done';
  onSubmitEditing: () => void;
  inputRef?: React.RefObject<TextInput | null>;
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
          ref={inputRef}
          style={[styles.input, { color: t.color.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry
          keyboardAppearance="dark"
          selectionColor={t.color.gold}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

export default function OwnerChangePasswordScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const changePassword = useAuthStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  function validate(): string | null {
    if (!currentPassword) return 'Enter your current password.';
    if (newPassword.length < 6) return 'New password must be at least 6 characters.';
    if (newPassword === currentPassword) return 'New password must be different from the current one.';
    if (newPassword !== confirmPassword) return 'New passwords do not match.';
    return null;
  }

  const canSave = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && !saving;

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not change your password. Please try again.');
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
          <Text style={[styles.cancelBtn, { color: t.color.textMuted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Change password</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
          <Text style={[styles.saveBtn, { color: canSave ? t.color.goldWarm : t.color.textMuted }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={(v) => { setCurrentPassword(v); setError(null); }}
          focused={focusedField === 'current'}
          onFocus={() => setFocusedField('current')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="next"
          onSubmitEditing={() => newRef.current?.focus()}
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={(v) => { setNewPassword(v); setError(null); }}
          focused={focusedField === 'new'}
          onFocus={() => setFocusedField('new')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          inputRef={newRef}
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
          focused={focusedField === 'confirm'}
          onFocus={() => setFocusedField('confirm')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="done"
          onSubmitEditing={canSave ? handleSave : () => {}}
          inputRef={confirmRef}
        />

        {error != null && (
          <Text style={[styles.errorText, { color: t.color.danger }]}>{error}</Text>
        )}

        <Text style={[styles.helperText, { color: t.color.textMuted }]}>
          Use at least 6 characters. You'll stay signed in on this device after changing it.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

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

  errorText:  { fontSize: 12, fontWeight: '500', marginTop: 2, marginBottom: 8 },
  helperText: { fontSize: 12, fontWeight: '500', marginTop: 6, lineHeight: 17 },
});

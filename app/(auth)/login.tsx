import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Login() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 32 }}>
        <Text style={{ color: t.color.gold, fontSize: 14, fontWeight: '700' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ color: t.color.textPrimary, fontSize: 27, fontWeight: '800', marginBottom: 8 }}>
        Sign in
      </Text>
      <Text style={{ color: t.color.textSecondary, fontSize: 14, marginBottom: 32 }}>
        Prototype — tap Continue to skip
      </Text>

      <View style={{ gap: 12 }}>
        <TextInput
          placeholder="Phone or email"
          placeholderTextColor={t.color.textMuted}
          style={[styles.input, { backgroundColor: t.color.surfaceInput, color: t.color.textPrimary, borderColor: t.color.borderSubtle }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={t.color.textMuted}
          secureTextEntry
          style={[styles.input, { backgroundColor: t.color.surfaceInput, color: t.color.textPrimary, borderColor: t.color.borderSubtle }]}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={[styles.btn, { backgroundColor: t.color.gold, marginTop: 24 }]}
      >
        <Text style={{ color: t.color.onGold, fontWeight: '700', fontSize: 15 }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14 },
  btn: { borderRadius: 100, padding: 16, alignItems: 'center' },
});

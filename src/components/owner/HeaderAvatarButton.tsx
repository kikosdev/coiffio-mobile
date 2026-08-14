import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../kit';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/auth';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

/**
 * Header-corner entry point into `(owner)/profile` — the Reddit-validated pattern: tab bar
 * kept, avatar top-right on every owner screen. Reuses `Avatar` (kit.tsx) as-is: that
 * component has no per-staff `color` prop, and this button doesn't add one — an owner isn't a
 * bookable stylist, so there's no existing "staff color" to draw from here anyway.
 *
 * Deliberately NOT in kit.tsx: it pulls `authStore` and `router`, and kit.tsx stays
 * presentation-only (no store/navigation imports) — same reasoning that keeps
 * `NumberStepper`/`PickerField` in this folder instead.
 */
export function HeaderAvatarButton() {
  const t = useTheme();
  const name = useAuthStore((s) => s.user?.name) ?? '';

  return (
    <TouchableOpacity
      accessibilityLabel="My profile"
      onPress={() => router.push('/(owner)/profile' as never)}
      style={{
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: t.color.surfaceCard,
        borderWidth: 1, borderColor: t.color.borderSubtle,
      }}
    >
      <Avatar initials={initials(name)} size={32} style={{ borderWidth: 0 }} />
    </TouchableOpacity>
  );
}

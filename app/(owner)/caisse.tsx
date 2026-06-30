import { View } from 'react-native';
import { Banknote } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, T } from '../../src/components/kit';

// S4 (SKILL_finance_pos.md) is not yet implemented.
// This screen is a placeholder — do not duplicate Caisse logic here.
// The owner Caisse component from S4 will be imported and rendered once available.
export default function OwnerCaisse() {
  const t = useTheme();

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Caisse" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: t.color.surfaceCard,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1, borderColor: t.color.borderSubtle,
        }}>
          <Banknote size={28} color={t.color.textMuted} />
        </View>
        <T variant="subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>
          Caisse
        </T>
        <T variant="small" color={t.color.textMuted} style={{ textAlign: 'center' }}>
          Salon-wide daily register — coming in S4 (SKILL_finance_pos.md)
        </T>
      </View>
    </Screen>
  );
}

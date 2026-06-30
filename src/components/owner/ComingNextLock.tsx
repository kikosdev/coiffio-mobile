import { View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { T } from '../kit';

interface Props {
  label?: string;
  sub?: string;
}

export function ComingNextLock({ label = 'Coming next', sub = 'Multi-location · coming next' }: Props) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: t.color.goldSoft,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Lock size={28} color={t.color.gold} />
      </View>
      <T variant="subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>{label}</T>
      <T variant="small" color={t.color.textMuted} style={{ textAlign: 'center' }}>{sub}</T>
    </View>
  );
}

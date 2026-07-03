import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ComingNextLock } from '../../src/components/owner/ComingNextLock';

// No promo/discount concept exists for services in the data model (Product.promo is
// retail-product-only) — locked rather than faking codes that the backend can't honor.
export default function OffersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bgBase, paddingTop: insets.top }}>
      <ComingNextLock label="Offers" sub="Deals & promo codes — coming next" />
    </View>
  );
}

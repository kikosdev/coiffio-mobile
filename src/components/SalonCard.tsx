import { View, Text, Pressable, Dimensions, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Fixed card width for the horizontal salon rails on Home. A fixed width is the whole point:
 * the previous `flex: 1` inside a non-scrolling `flexDirection: 'row'` divided one screen
 * width across every salon (8 salons → ~33px each, unreadable). Never reintroduce `flex: 1`
 * or `flexWrap` here — a 2-column grid (numColumns) is the one context where `flex: 1` is
 * correct, and it must override `style` rather than change this default.
 */
export const SALON_CARD_W = Math.round(Dimensions.get('window').width * 0.72);

/** Skeleton height — kept next to the card so the placeholder can't drift from the real one. */
export const SALON_CARD_H = 240;

/** The subset of `PublicSalon` / `NearbySalon` the card actually renders. `id`, never `_id`. */
export interface SalonCardItem {
  id: string;
  name: string;
  rating: number | null;
  isOpen: boolean | null;
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.5 6 20l1.5-6.6-5-4.3 6.6-.6z" />
    </Svg>
  );
}

function MapPinIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <Circle cx={12} cy={10} r={2.3} />
    </Svg>
  );
}

/**
 * One salon tile, shared by Home's "Nearby" and "Barbershops" rails (they used to be two
 * inlined copies that drifted). `subtitle` is what differs between them — distance for
 * Nearby, address for the full list — and the caller passes `null` rather than a placeholder
 * string when it has no real value, so the row is hidden instead of showing filler.
 */
export function SalonCard({
  item,
  subtitle,
  onPress,
  style,
}: {
  item: SalonCardItem;
  subtitle: string | null;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: SALON_CARD_W, backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard },
        style,
      ]}
    >
      <View style={styles.imgWrap}>
        <View style={[styles.img, { backgroundColor: t.color.borderSubtle }]} />
        {item.rating != null && (
          <View style={styles.ratingBadge}>
            <StarIcon size={11} color={t.color.gold} />
            <Text style={[styles.ratingBadgeText, { color: t.color.textPrimary }]}>
              {item.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {item.isOpen === true && (
          <Text style={[styles.openNow, { color: t.color.gold }]}>OPEN NOW</Text>
        )}
        <Text
          style={[styles.name, { color: t.color.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        {subtitle !== null && (
          <View style={styles.subtitleRow}>
            <MapPinIcon color={t.color.textSecondary} />
            <Text
              style={[styles.subtitleText, { color: t.color.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          </View>
        )}
        <View style={[styles.viewBtn, { backgroundColor: t.color.textPrimary }]}>
          <Text style={[styles.viewBtnText, { color: t.color.bgBase }]}>View</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Loading placeholder matching the card's footprint — same fixed width, no `flex: 1`. */
export function SalonCardSkeleton() {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        styles.skeleton,
        { width: SALON_CARD_W, height: SALON_CARD_H, backgroundColor: t.color.surfaceCard },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card:            { borderRadius: 20, overflow: 'hidden' },
  skeleton:        { opacity: 0.5 },

  imgWrap:         { padding: 8, paddingBottom: 0 },
  img:             { width: '100%', height: 130, borderRadius: 14 },
  ratingBadge:     { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBadgeText: { fontSize: 11, fontWeight: '700' },

  content:         { padding: 10, paddingHorizontal: 12, paddingBottom: 12 },
  openNow:         { fontSize: 9, fontWeight: '800', letterSpacing: 0.36 },
  name:            { fontSize: 15, fontWeight: '700', marginTop: 3 },
  subtitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  subtitleText:    { flex: 1, fontSize: 11, fontWeight: '600' },
  viewBtn:         { borderRadius: 100, alignItems: 'center', paddingVertical: 9, marginTop: 10 },
  viewBtnText:     { fontSize: 12, fontWeight: '700' },
});

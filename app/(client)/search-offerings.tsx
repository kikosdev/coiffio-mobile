import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Badge } from '../../src/components/kit';
import { useSearchStore } from '../../src/stores/search';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { formatMoney } from '../../src/utils/formatMoney';

export default function SearchOfferingsScreen() {
  const t = useTheme();
  const { category, name } = useLocalSearchParams<{ category?: string; name?: string }>();
  const { coords, request } = useUserLocation();
  const { offerings, loadingOfferings, fetchOfferings } = useSearchStore();

  useEffect(() => {
    request();
  }, [request]);

  useEffect(() => {
    fetchOfferings({ category, name }, coords?.lat, coords?.lng);
  }, [category, name, coords, fetchOfferings]);

  const title = name ?? category ?? 'Services';

  return (
    <Screen>
      <ScreenHeader title={title} subtitle={`${offerings.length} salon${offerings.length === 1 ? '' : 's'} offering this`} />

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {offerings.map((o) => (
          <Card
            key={o.salonId}
            style={{ padding: t.spacing.md }}
            onPress={() => router.push({ pathname: '/(client)/salon/[id]', params: { id: o.salonId } })}
          >
            <Row justify="space-between">
              <View style={{ flex: 1 }}>
                <Row gap={6}>
                  <T variant="body">{o.name}</T>
                  {o.isOpen === true && <Badge variant="success">Open</Badge>}
                </Row>
                {!!o.address && (
                  <T variant="small" style={{ marginTop: 3 }}>{o.address}</T>
                )}
                <Row gap={4} style={{ marginTop: 4 }}>
                  <MapPin size={11} color={t.color.textSecondary} />
                  <T variant="small">
                    {o.distanceKm != null ? `${o.distanceKm} km` : 'Distance unavailable'}
                  </T>
                  {o.durationMin != null && <T variant="small"> · {o.durationMin} min</T>}
                </Row>
              </View>
              {o.price != null && (
                <T variant="label" color={t.color.gold}>{formatMoney(o.price)}</T>
              )}
            </Row>
          </Card>
        ))}
        {!loadingOfferings && offerings.length === 0 && (
          <T variant="caption">No salons currently offer this.</T>
        )}
      </View>
    </Screen>
  );
}

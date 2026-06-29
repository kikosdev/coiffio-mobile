import { View, TextInput } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Avatar, Badge, Eyebrow } from '../../src/components/kit';
import { dummyBarbers, dummyServices } from '../../src/data/dummy';
import { Search as SearchIcon, Star } from 'lucide-react-native';

export default function ClientSearch() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Search" subtitle="Find barbers & services" />

      {/* Search input */}
      <View style={{
        marginHorizontal: t.spacing.xxl,
        marginBottom: t.spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.color.surfaceInput,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        borderColor: t.color.borderSubtle,
        paddingHorizontal: t.spacing.md,
        gap: 8,
      }}>
        <SearchIcon size={18} color={t.color.textMuted} />
        <TextInput
          placeholder="Search barbers, services…"
          placeholderTextColor={t.color.textMuted}
          style={{ flex: 1, color: t.color.textPrimary, fontSize: 14, paddingVertical: 14 }}
        />
      </View>

      {/* Services */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Services</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 8, marginBottom: 24 }}>
        {dummyServices.map((s) => (
          <Card key={s.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <View style={{ flex: 1 }}>
                <T variant="body">{s.name}</T>
                <T variant="small" style={{ marginTop: 3 }}>{s.description}</T>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <T variant="label" color={t.color.gold}>${s.price}</T>
                <T variant="small">{s.duration} min</T>
              </View>
            </Row>
          </Card>
        ))}
      </View>

      {/* Barbers */}
      <Eyebrow style={{ paddingHorizontal: t.spacing.xxl, marginBottom: 10 }}>Barbers</Eyebrow>
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyBarbers.map((b) => (
          <Card key={b.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <Row gap={12}>
                <Avatar initials={b.initials} size={46} />
                <View>
                  <Row gap={6}>
                    <T variant="body">{b.name}</T>
                    {b.isPro && <Badge variant="pro">PRO</Badge>}
                  </Row>
                  <T variant="small" style={{ marginTop: 2 }}>{b.title}</T>
                  <Row gap={4} style={{ marginTop: 3 }}>
                    <Star size={11} color={t.color.gold} />
                    <T variant="small" color={t.color.gold}>{b.rating}</T>
                    <T variant="small">({b.reviewCount})</T>
                  </Row>
                </View>
              </Row>
              <Badge variant={b.isOnline ? 'success' : 'neutral'}>
                {b.isOnline ? 'Available' : 'Off'}
              </Badge>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

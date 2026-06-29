import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Avatar, Badge, Eyebrow, StatusDot, Button,
} from '../../src/components/kit';
import { dummyTeam } from '../../src/data/dummy';
import { Star } from 'lucide-react-native';

const FILTERS = ['All · 18', 'Union Sq', 'SoHo', 'Bklyn'];

export default function OwnerTeam() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Team"
        right={<Button variant="gold" size="sm">+ Invite</Button>}
      />

      {/* Salon filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: 8, marginBottom: t.spacing.xl }}
      >
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f}
            style={{
              backgroundColor: i === 0 ? t.color.textPrimary : t.color.surfaceElevated,
              borderRadius: t.radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <T variant="small" color={i === 0 ? t.color.bgBase : t.color.textSecondary}>{f}</T>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyTeam.map((b) => (
          <Card key={b.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <Row gap={12}>
                <Avatar initials={b.initials} size={46} />
                <View>
                  <Row gap={6}>
                    <T variant="body">{b.name}</T>
                    {b.isPro && <Badge variant="pro">PRO</Badge>}
                    <Star size={11} color="#F2B233" fill="#F2B233" />
                  </Row>
                  <Row gap={6} style={{ marginTop: 3 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.salonColor }} />
                    <T variant="small" style={{ color: b.salonColor }}>{b.salon}</T>
                  </Row>
                </View>
              </Row>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <StatusDot status={b.status} />
                <T variant="small" color={t.color.textMuted}>{b.todayCount > 0 ? `${b.todayCount} today` : 'Off'}</T>
              </View>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

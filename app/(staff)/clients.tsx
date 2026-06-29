import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, Row, T, Avatar, Eyebrow } from '../../src/components/kit';
import { dummyClients } from '../../src/data/dummy';
import { ChevronRight } from 'lucide-react-native';

export default function StaffClients() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Clients" subtitle={`${dummyClients.length} regulars`} />

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyClients.map((c) => (
          <Card key={c.id} style={{ padding: t.spacing.md }} onPress={() => {}}>
            <Row justify="space-between">
              <Row gap={12}>
                <Avatar initials={c.initials} size={44} />
                <View>
                  <T variant="body">{c.name}</T>
                  <T variant="small" style={{ marginTop: 2 }}>
                    {c.visitCount} visits · last {c.lastVisit}
                  </T>
                  <T variant="small" color={t.color.gold} style={{ marginTop: 1 }}>
                    ${c.totalSpent} spent
                  </T>
                </View>
              </Row>
              <ChevronRight size={18} color={t.color.textMuted} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import {
  Screen, ScreenHeader, Card, Row, T, Avatar, Badge, StatusDot, Button,
} from '../../src/components/kit';
import { dummyTeam } from '../../src/data/dummy';

export default function OwnerTeam() {
  const t = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Team"
        subtitle={`${dummyTeam.length} barbers`}
        right={
          <Button
            variant="gold"
            size="sm"
            onPress={() => router.push('/(owner)/team/invite' as never)}
          >
            + Invite
          </Button>
        }
      />

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10 }}>
        {dummyTeam.map((b) => (
          <Card
            key={b.id}
            style={{ padding: t.spacing.md }}
            onPress={() => router.push(('/(owner)/team/' + b.id) as never)}
          >
            <Row justify="space-between">
              <Row gap={12}>
                <Avatar initials={b.initials} size={46} />
                <View>
                  <Row gap={6}>
                    <T variant="body">{b.name}</T>
                    {b.isPro && <Badge variant="pro">PRO</Badge>}
                  </Row>
                  <T variant="small" color={t.color.textSecondary} style={{ marginTop: 3 }}>
                    {b.salon}
                  </T>
                </View>
              </Row>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <StatusDot status={b.status} />
                <T variant="small" color={t.color.textMuted}>
                  {b.todayCount > 0 ? `${b.todayCount} today` : 'Off'}
                </T>
              </View>
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

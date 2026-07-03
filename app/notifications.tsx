import { View, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { Screen, Row, T, Card } from '../src/components/kit';
import { useNotifications, AppNotification } from '../src/hooks/useNotifications';

export default function NotificationsScreen() {
  const t = useTheme();
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead } = useNotifications();

  function handlePress(n: AppNotification) {
    if (!n.read) markRead(n.id);
  }

  return (
    <Screen scroll={false}>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.xl, marginBottom: t.spacing.lg }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={22} color={t.color.textPrimary} />
        </Pressable>
        <T variant="label">Notifications</T>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <T variant="small" color={t.color.gold}>Mark all read</T>
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </Row>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <T variant="body" color={t.color.textMuted} style={{ textAlign: 'center' }}>
            {isLoading ? 'Loading…' : error ?? 'No notifications yet.'}
          </T>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: t.spacing.xxl, gap: 9, paddingBottom: t.spacing.xxl }}
          renderItem={({ item }) => (
            <Card
              onPress={() => handlePress(item)}
              style={{ padding: t.spacing.md, opacity: item.read ? 0.6 : 1 }}
            >
              <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1 }}>
                  <T variant="body">{item.title}</T>
                  {item.body ? (
                    <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>{item.body}</T>
                  ) : null}
                  <T variant="small" color={t.color.textMuted} style={{ marginTop: 4 }}>
                    {formatDistanceToNow(parseISO(item.date), { addSuffix: true })}
                  </T>
                </View>
                {!item.read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.color.gold, marginTop: 4 }} />
                )}
              </Row>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

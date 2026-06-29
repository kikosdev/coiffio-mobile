import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { CalendarDays, Clock, DollarSign, Users, User } from 'lucide-react-native';

export default function StaffLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.color.tabBar,
          borderTopColor: t.color.tabBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.color.gold,
        tabBarInactiveTintColor: t.color.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="today"    options={{ title: 'Today',    tabBarIcon: ({ color }) => <Clock        size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
      <Tabs.Screen name="caisse"   options={{ title: 'Caisse',   tabBarIcon: ({ color }) => <DollarSign   size={22} color={color} /> }} />
      <Tabs.Screen name="clients"  options={{ title: 'Clients',  tabBarIcon: ({ color }) => <Users        size={22} color={color} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  tabBarIcon: ({ color }) => <User         size={22} color={color} /> }} />
    </Tabs>
  );
}

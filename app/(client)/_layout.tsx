import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Home, Search, CalendarDays, Tag, User } from 'lucide-react-native';

export default function ClientLayout() {
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
      <Tabs.Screen name="home"            options={{ title: 'Home',     tabBarIcon: ({ color }) => <Home     size={22} color={color} /> }} />
      <Tabs.Screen name="search"          options={{ title: 'Search',   tabBarIcon: ({ color }) => <Search   size={22} color={color} /> }} />
      <Tabs.Screen name="bookings"        options={{ title: 'Bookings', tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
      <Tabs.Screen name="offers"          options={{ title: 'Offers',   tabBarIcon: ({ color }) => <Tag      size={22} color={color} /> }} />
      <Tabs.Screen name="profile"         options={{ title: 'Profile',  tabBarIcon: ({ color }) => <User     size={22} color={color} /> }} />
      <Tabs.Screen name="choose-location" options={{ href: null }} />
      <Tabs.Screen name="salon"           options={{ href: null }} />
      <Tabs.Screen name="barber"          options={{ href: null }} />
      <Tabs.Screen name="booking"         options={{ href: null }} />
    </Tabs>
  );
}

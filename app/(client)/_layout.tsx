import { Tabs } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l9-7 9 7" /><Path d="M5 10v9h14v-9" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} /><Path d="M21 21l-4-4" />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Circle cx={7} cy={7} r={1.5} />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} /><Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

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
      <Tabs.Screen name="home"         options={{ title: 'Home',         tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="search"       options={{ title: 'Search',       tabBarIcon: ({ color }) => <SearchIcon color={color} /> }} />
      <Tabs.Screen name="appointments" options={{ title: 'Bookings',     tabBarIcon: ({ color }) => <CalendarIcon color={color} /> }} />
      <Tabs.Screen name="offers"       options={{ title: 'Offers',       tabBarIcon: ({ color }) => <TagIcon color={color} /> }} />
      <Tabs.Screen name="profile"      options={{ title: 'Profile',      tabBarIcon: ({ color }) => <UserIcon color={color} /> }} />
      <Tabs.Screen name="bookings"     options={{ href: null }} />
      <Tabs.Screen name="choose-location" options={{ href: null }} />
      <Tabs.Screen name="salon"        options={{ href: null }} />
      <Tabs.Screen name="barber"       options={{ href: null }} />
      <Tabs.Screen name="booking"      options={{ href: null }} />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useRoleGuard } from '../../src/hooks/useRoleGuard';

function TodayIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11l9-7 9 7" /><Path d="M5 10v9h14v-9" />
    </Svg>
  );
}
function ScheduleIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}
function CaisseIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 20V11M12 20V4M19 20v-6" />
    </Svg>
  );
}
function ClientsIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8} r={3.2} /><Path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <Circle cx={17} cy={9} r={2.4} /><Path d="M16 15c2.8 0 5 1.5 5 4" />
    </Svg>
  );
}
function ProfileIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} /><Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

export default function StaffLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  useRoleGuard('staff');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.color.bgBase },
        tabBarStyle: {
          backgroundColor: t.color.tabBar,
          borderTopColor: t.color.tabBorder,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.color.gold,
        tabBarInactiveTintColor: t.color.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="today"       options={{ title: 'Today',    tabBarIcon: ({ color }) => <TodayIcon    color={color} /> }} />
      <Tabs.Screen name="schedule"    options={{ title: 'Schedule', tabBarIcon: ({ color }) => <ScheduleIcon color={color} /> }} />
      <Tabs.Screen name="caisse"      options={{ title: 'Caisse',   tabBarIcon: ({ color }) => <CaisseIcon   color={color} /> }} />
      <Tabs.Screen name="clients"     options={{ title: 'Clients',  tabBarIcon: ({ color }) => <ClientsIcon  color={color} /> }} />
      <Tabs.Screen name="profile"     options={{ title: 'Profile',  tabBarIcon: ({ color }) => <ProfileIcon  color={color} /> }} />
      {/* Stack-only screens — not visible in tab bar */}
      <Tabs.Screen name="earnings"    options={{ href: null }} />
      <Tabs.Screen name="appointment" options={{ href: null }} />
      <Tabs.Screen name="services"    options={{ href: null }} />
      <Tabs.Screen name="settings"       options={{ href: null }} />
      <Tabs.Screen name="personal-info"  options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
    </Tabs>
  );
}

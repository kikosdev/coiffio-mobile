import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { LayoutGrid, Banknote, Store, Users, BarChart2, Settings } from 'lucide-react-native';
import { useRoleGuard } from '../../src/hooks/useRoleGuard';

export default function OwnerLayout() {
  const t = useTheme();
  useRoleGuard('owner');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.color.tabBar,
          borderTopColor: t.color.tabBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: t.color.gold,
        tabBarInactiveTintColor: t.color.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="hq"
        options={{ title: 'HQ', tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="caisse"
        options={{ title: 'Caisse', tabBarIcon: ({ color }) => <Banknote size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="salons"
        options={{ title: 'Salons', tabBarIcon: ({ color }) => <Store size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="team"
        options={{ title: 'Team', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Analytics', tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings size={22} color={color} /> }}
      />
      {/* Sub-routes — no tab button, tab bar hidden when active */}
      <Tabs.Screen name="team/[id]"   options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="team/invite" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="salon/[id]"  options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="change-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

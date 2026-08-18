import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { LayoutGrid, CalendarDays, Users, Banknote, Briefcase } from 'lucide-react-native';
import { useRoleGuard } from '../../src/hooks/useRoleGuard';
import { useNotificationsRealtime } from '../../src/hooks/useNotificationsRealtime';
import { useOwnerSalonStore } from '../../src/stores/ownerSalon';

export default function OwnerLayout() {
  const t = useTheme();
  useRoleGuard('owner');
  // Monté ICI et nulle part ailleurs : un seul socket pour toute la surface owner, vivant tant
  // qu'un écran owner est affiché. Le badge de `hq` et la liste de notifications lisent le même
  // store, donc tous deux se mettent à jour à réception (voir useNotificationsRealtime).
  useNotificationsRealtime();
  // Guarantees s.salon gets populated no matter which owner screen mounts first (deep-link,
  // cold reload) — previously only useMySalon() callers (hq, team, salons, salon/[id])
  // triggered this fetch, so any screen reading s.salon directly (agenda, appointment
  // detail, hours/leave) saw it stuck at null until one of those happened to run first.
  // fetchHQ() no-ops once a fetch is in flight or has already succeeded (src/stores/
  // ownerSalon.ts), so calling it here is safe alongside each screen's own fetchHQ() call.
  const fetchHQ = useOwnerSalonStore((s) => s.fetchHQ);
  useEffect(() => {
    fetchHQ();
  }, [fetchHQ]);

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
        name="agenda"
        options={{ title: 'Agenda', tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="team"
        options={{ title: 'Team', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="caisse"
        options={{ title: 'Caisse', tabBarIcon: ({ color }) => <Banknote size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="business"
        options={{ title: 'Business', tabBarIcon: ({ color }) => <Briefcase size={22} color={color} /> }}
      />

      {/* Reachable via Business (or direct links from HQ) but no tab of their own. */}
      <Tabs.Screen name="salons" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="analytics" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      {/* Profil de l'owner (sa personne) — atteint depuis Settings, pas d'onglet dédié :
          la barre est déjà à 5, et ce n'est pas une destination quotidienne. */}
      <Tabs.Screen name="profile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      {/* Identité du SALON (l'établissement) — atteint depuis Settings › Salon details. */}
      <Tabs.Screen name="salon-details" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Stock — reachable from the Business hub */}
      <Tabs.Screen name="stock/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock/restock" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock/adjust" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock/new" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="stock/edit" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Ventes — reachable from the Business hub */}
      <Tabs.Screen name="ventes/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ventes/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ventes/new" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Caisse — reached from the Caisse tab or a completed appointment */}
      <Tabs.Screen name="caisse/checkout" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="caisse/expenses" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="caisse/refund" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Stub domains, not on the bar yet — reachable from the Business hub. */}
      <Tabs.Screen name="orders/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Hours domain — salon hours is a Business tile; leave is reached from within it. */}
      <Tabs.Screen name="hours/salon" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="hours/leave" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Appointments — reached from Agenda, no tab of their own */}
      <Tabs.Screen name="appointment/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="appointment/new" options={{ href: null, tabBarStyle: { display: 'none' } }} />

      {/* Sub-routes — no tab button, tab bar hidden when active */}
      <Tabs.Screen name="team/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="team/invite" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="team/edit/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="team/schedule/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="salon/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="change-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

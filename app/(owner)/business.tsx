import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import {
  Package, ShoppingBag, ClipboardList, Clock, BarChart2, Store, Settings,
  LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, ScreenHeader, Card, T, Badge } from '../../src/components/kit';
import { useOwnerSalonStore } from '../../src/stores/ownerSalon';
import { HeaderAvatarButton } from '../../src/components/owner/HeaderAvatarButton';

interface Tile {
  key: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  href: Href;
  active: boolean;
}

function BusinessTile({ tile }: { tile: Tile }): React.JSX.Element {
  const t = useTheme();
  const Icon = tile.icon;

  return (
    <Card
      style={{ width: '48%', padding: t.spacing.lg, opacity: tile.active ? 1 : 0.6 }}
      onPress={tile.active ? () => router.push(tile.href) : undefined}
    >
      <View style={{
        width: 40, height: 40, borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceElevated,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: t.spacing.md,
      }}>
        <Icon size={20} color={tile.active ? t.color.gold : t.color.textMuted} />
      </View>

      <T variant="label" numberOfLines={1}>{tile.label}</T>

      {tile.active ? (
        tile.subtitle ? (
          <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }} numberOfLines={1}>
            {tile.subtitle}
          </T>
        ) : null
      ) : (
        <Badge variant="neutral" style={{ marginTop: 8, alignSelf: 'flex-start' }}>Bientôt</Badge>
      )}
    </Card>
  );
}

export default function OwnerBusiness(): React.JSX.Element {
  const t = useTheme();
  const salon = useOwnerSalonStore((s) => s.salon);

  const salonsSubtitle = salon ? `1 salon · ${salon.team.length} barbers` : undefined;

  const tiles: Tile[] = [
    { key: 'stock',     label: 'Stock',      icon: Package,       href: '/(owner)/stock' as Href,        active: true },
    { key: 'ventes',    label: 'Ventes',     icon: ShoppingBag,   href: '/(owner)/ventes' as Href,        active: true },
    { key: 'orders',    label: 'Commandes',  icon: ClipboardList, href: '/(owner)/orders' as Href,        active: true },
    { key: 'hours',     label: 'Horaires',   icon: Clock,         href: '/(owner)/hours/salon' as Href,   active: true },
    { key: 'analytics', label: 'Analytics',  icon: BarChart2,     href: '/(owner)/analytics' as Href,     active: true },
    { key: 'salons',    label: 'Salons',     icon: Store,         href: '/(owner)/salons' as Href,        active: true, subtitle: salonsSubtitle },
    { key: 'settings',  label: 'Réglages',   icon: Settings,      href: '/(owner)/settings' as Href,      active: true },
  ];

  return (
    <Screen>
      <ScreenHeader title="Business" subtitle="Stock, ventes, commandes & réglages" right={<HeaderAvatarButton />} />
      <View style={{
        paddingHorizontal: t.spacing.xxl,
        flexDirection: 'row', flexWrap: 'wrap',
        gap: t.spacing.md,
      }}>
        {tiles.map((tile) => (
          <BusinessTile key={tile.key} tile={tile} />
        ))}
      </View>
    </Screen>
  );
}

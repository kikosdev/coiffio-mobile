import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRoleStore } from '../src/state/role';
import { useTheme } from '../src/theme/ThemeProvider';
import { Role } from '../src/theme/tokens';

function LogoMark({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={6} cy={6} r={2.4} />
      <Circle cx={6} cy={18} r={2.4} />
      <Path d="M8 8l12 8M8 16L20 8" />
    </Svg>
  );
}

function IconClient({ color }: { color: string }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
    </Svg>
  );
}

function IconBarber({ color }: { color: string }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 4l4 4-5 9-3-1z" />
      <Path d="M14 4l-4 4 5 9 3-1z" opacity={0.55} />
      <Circle cx={12} cy={8} r={1.4} />
    </Svg>
  );
}

function IconOwner({ color }: { color: string }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 21V8l5-3 5 3v13" />
      <Path d="M13 21V11l5-3 3 2v11" />
      <Path d="M6.5 11h.01M6.5 14.5h.01M6.5 18h.01" />
    </Svg>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

const ROLES: {
  key: Role;
  title: string;
  sub: string;
  Icon: (p: { color: string }) => React.ReactElement;
  badge: { label: string; variant: 'gold' | 'dark' } | null;
  route: string;
}[] = [
  {
    key: 'client',
    title: "I'm a Client",
    sub: 'Book a cut, browse barbers & offers',
    Icon: IconClient,
    badge: null,
    route: '/(client)/home',
  },
  {
    key: 'staff',
    title: "I'm a Barber",
    sub: 'Your chair, schedule & earnings',
    Icon: IconBarber,
    badge: { label: 'STAFF', variant: 'gold' },
    route: '/(staff)/today',
  },
  {
    key: 'owner',
    title: "I'm the Owner",
    sub: 'Manage barbers across every salon',
    Icon: IconOwner,
    badge: { label: 'HQ', variant: 'dark' },
    route: '/(owner)/hq',
  },
];

export default function ChooseRole() {
  const t = useTheme();
  const setRole = useRoleStore((s) => s.setRole);
  const insets = useSafeAreaInsets();

  function pick(role: Role) {
    router.push({ pathname: '/(auth)/login', params: { role } } as never);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.color.bgBase }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={[styles.logoMark, { backgroundColor: t.color.gold }]}>
          <LogoMark color={t.color.onGold} />
        </View>
        <Text style={[styles.wordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
      </View>

      {/* Headline */}
      <Text style={[styles.headline, { color: t.color.textPrimary }]}>
        {'Welcome in.\nHow are you\nsigning in?'}
      </Text>

      {/* Lede */}
      <Text style={[styles.lede, { color: t.color.textMuted }]}>
        Pick your role — each one opens a workspace built just for you.
      </Text>

      {/* Role cards */}
      <View style={styles.cards}>
        {ROLES.map(({ key, title, sub, Icon, badge }) => (
          <Pressable
            key={key}
            onPress={() => pick(key)}
            android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: pressed ? t.color.surfaceElevated : t.color.surfaceCard,
                borderColor: t.color.borderSubtle,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: t.color.goldSoft }]}>
              <Icon color={t.color.gold} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: t.color.textPrimary }]}>{title}</Text>
                {badge && (
                  <View
                    style={[
                      styles.badge,
                      badge.variant === 'gold'
                        ? { backgroundColor: t.color.gold }
                        : { backgroundColor: t.color.borderStrong },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeLabel,
                        {
                          color: badge.variant === 'gold' ? t.color.onGold : t.color.textPrimary,
                          letterSpacing: badge.variant === 'gold' ? 0.4 : 0.7,
                        },
                      ]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardSub, { color: t.color.textSecondary }]}>{sub}</Text>
            </View>

            <View style={[styles.arrow, { backgroundColor: t.color.borderSubtle }]}>
              <Chevron color={t.color.textPrimary} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: t.color.textMuted }]}>New here? </Text>
        <Pressable onPress={() => router.push('/(auth)/create-account' as any)}>
          <Text style={[styles.footerLink, { color: t.color.gold }]}>Create an account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:    { paddingHorizontal: 26 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 30 },
  logoMark:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wordmark:   { fontSize: 20, fontWeight: '900', letterSpacing: 3.6 },
  headline:   { fontSize: 34, fontWeight: '800', lineHeight: 37, letterSpacing: -0.34, marginBottom: 14 },
  lede:       { fontSize: 14, fontWeight: '500', lineHeight: 21, marginBottom: 28 },
  cards:      { gap: 13 },
  card:       { flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1.5, borderRadius: 22, padding: 16 },
  iconWrap:   { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:   { flex: 1 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle:  { fontSize: 17, fontWeight: '800' },
  badge:      { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeLabel: { fontSize: 9, fontWeight: '800' },
  cardSub:    { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  arrow:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerLink: { fontSize: 13, fontWeight: '700' },
});

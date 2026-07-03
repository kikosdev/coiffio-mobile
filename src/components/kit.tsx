import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Pressable, Modal,
  StyleSheet, ViewStyle, TextStyle, StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Tokens } from '../theme/tokens';

// ── Screen ───────────────────────────────────────────────────────────────────

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  padBottom?: boolean;
}

export function Screen({ children, scroll = true, style, padBottom = true }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bg = { backgroundColor: t.color.bgBase };

  if (!scroll) {
    return (
      <View style={[{ flex: 1, paddingBottom: padBottom ? insets.bottom : 0 }, bg, style]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ flex: 1 }, bg]}
      contentContainerStyle={[
        { paddingBottom: padBottom ? insets.bottom + 24 : 24 },
        style as ViewStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

// ── T (typed text) ───────────────────────────────────────────────────────────

type TextVariant =
  | 'display'    // 27px 800
  | 'hero'       // 34px 900
  | 'title'      // 22px 800
  | 'subtitle'   // 18px 800
  | 'label'      // 15px 700
  | 'body'       // 14px 500
  | 'caption'    // 13px 400
  | 'small'      // 12px 600
  | 'eyebrow';   // 11px 800 uppercase tracking

interface TProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export function T({ children, variant = 'body', color, style, numberOfLines, adjustsFontSizeToFit, minimumFontScale }: TProps) {
  const t = useTheme();
  const styles = variantStyle(variant, t);
  return (
    <Text
      style={[styles, color ? { color } : undefined, style]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
    >
      {children}
    </Text>
  );
}

function variantStyle(variant: TextVariant, t: Tokens): TextStyle {
  const base: TextStyle = { fontFamily: t.typography.family.sans };
  switch (variant) {
    case 'display':  return { ...base, fontSize: 27, fontFamily: t.typography.family.sansExtrabold, fontWeight: t.typography.weight.extrabold, color: t.color.textPrimary };
    case 'hero':     return { ...base, fontSize: 34, fontFamily: t.typography.family.sansBlack,     fontWeight: t.typography.weight.black,     color: t.color.textPrimary, lineHeight: 38 };
    case 'title':    return { ...base, fontSize: 22, fontFamily: t.typography.family.sansExtrabold, fontWeight: t.typography.weight.extrabold, color: t.color.textPrimary };
    case 'subtitle': return { ...base, fontSize: 18, fontFamily: t.typography.family.sansExtrabold, fontWeight: t.typography.weight.extrabold, color: t.color.textPrimary };
    case 'label':    return { ...base, fontSize: 15, fontFamily: t.typography.family.sansBold,      fontWeight: t.typography.weight.bold,      color: t.color.textPrimary };
    case 'body':     return { ...base, fontSize: 14, fontFamily: t.typography.family.sansMedium,    fontWeight: t.typography.weight.medium,    color: t.color.textPrimary };
    case 'caption':  return { ...base, fontSize: 13, fontFamily: t.typography.family.sans,          fontWeight: t.typography.weight.regular,   color: t.color.textSecondary };
    case 'small':    return { ...base, fontSize: 12, fontFamily: t.typography.family.sansSemibold,  fontWeight: t.typography.weight.semibold,  color: t.color.textSecondary };
    case 'eyebrow':  return { ...base, fontSize: 11, fontFamily: t.typography.family.sansExtrabold, fontWeight: t.typography.weight.extrabold, color: t.color.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 };
  }
}

// ── Eyebrow ──────────────────────────────────────────────────────────────────

export function Eyebrow({ children, style, color }: { children: React.ReactNode; style?: StyleProp<TextStyle>; color?: string }) {
  return <T variant="eyebrow" style={style} color={color}>{children}</T>;
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, style, onPress, elevated }: CardProps) {
  const t = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? t.color.surfaceElevated : t.color.surfaceCard,
    borderRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.color.borderSubtle,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

// ── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'gold' | 'outline' | 'ghost' | 'dark' | 'white';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({ children, onPress, variant = 'gold', size = 'md', style, disabled, fullWidth }: ButtonProps) {
  const t = useTheme();

  const pad = size === 'lg' ? { paddingVertical: 16, paddingHorizontal: 24 }
            : size === 'sm' ? { paddingVertical: 8,  paddingHorizontal: 14 }
            :                  { paddingVertical: 12, paddingHorizontal: 18 };

  const bgMap: Record<ButtonVariant, string> = {
    gold:    t.color.gold,
    outline: 'transparent',
    ghost:   'transparent',
    dark:    t.color.surfaceElevated,
    white:   '#FFFFFF',
  };

  const borderMap: Record<ButtonVariant, string> = {
    gold:    'transparent',
    outline: t.color.gold,
    ghost:   'transparent',
    dark:    t.color.borderSubtle,
    white:   'transparent',
  };

  const textColorMap: Record<ButtonVariant, string> = {
    gold:    t.color.onGold,
    outline: t.color.gold,
    ghost:   t.color.textSecondary,
    dark:    t.color.textPrimary,
    white:   t.color.bgBase,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bgMap[variant],
          borderRadius: t.radius.pill,
          borderWidth: 1.5,
          borderColor: borderMap[variant],
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : 1,
          ...(fullWidth ? { width: '100%' } : {}),
        },
        pad,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: textColorMap[variant], fontWeight: '700', fontSize: 14, fontFamily: t.typography.family.sansBold }}>
          {children}
        </Text>
      ) : children}
    </TouchableOpacity>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'neutral' | 'gold' | 'success' | 'pending' | 'danger' | 'pro';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  const t = useTheme();

  const configs: Record<BadgeVariant, { bg: string; text: string }> = {
    neutral: { bg: t.color.surfaceElevated,  text: t.color.textSecondary },
    gold:    { bg: t.color.goldSoft,         text: t.color.gold          },
    success: { bg: t.color.successBg,        text: t.color.success       },
    pending: { bg: t.color.pendingBg,        text: t.color.pending       },
    danger:  { bg: t.color.dangerBg,         text: t.color.danger        },
    pro:     { bg: t.color.gold,             text: t.color.onGold        },
  };

  const cfg = configs[variant];

  return (
    <View style={[{ backgroundColor: cfg.bg, borderRadius: t.radius.sm, paddingHorizontal: 6, paddingVertical: 2 }, style]}>
      <Text style={{ color: cfg.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  initials: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ initials, size = 40, style }: AvatarProps) {
  const t = useTheme();
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: t.color.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: t.color.borderSubtle,
    }, style]}>
      <Text style={{ color: t.color.gold, fontSize: size * 0.36, fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ label, value, sub, style }: StatCardProps) {
  const t = useTheme();
  return (
    <Card style={[{ padding: t.spacing.md, flex: 1 }, style]}>
      <T variant="subtitle" color={t.color.textPrimary}>{value}</T>
      {sub && <T variant="small" color={t.color.textMuted} style={{ marginTop: 1 }}>{sub}</T>}
      <T variant="small" color={t.color.textSecondary} style={{ marginTop: 2 }}>{label}</T>
    </Card>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}

export function Row({ children, style, gap = 8, align = 'center', justify }: RowProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: align, gap, justifyContent: justify }, style]}>
      {children}
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.color.borderSubtle }, style]} />;
}

// ── ScreenHeader ─────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  const t = useTheme();
  return (
    <Row justify="space-between" align="flex-start" style={[{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, paddingBottom: t.spacing.sm }, style]}>
      <View style={{ flex: 1 }}>
        <T variant="display">{title}</T>
        {subtitle && <T variant="caption" style={{ marginTop: 2 }}>{subtitle}</T>}
      </View>
      {right && <View style={{ marginLeft: t.spacing.md }}>{right}</View>}
    </Row>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────

interface WordmarkProps {
  tag?: string;
  style?: StyleProp<TextStyle>;
}

export function Wordmark({ tag, style }: WordmarkProps) {
  const t = useTheme();
  return (
    <Row gap={6}>
      <Text style={[{
        fontFamily: t.typography.family.sansBlack,
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: t.typography.letterSpacing.brand,
        color: t.color.textPrimary,
      }, style]}>
        BLACK BOX
      </Text>
      {tag && (
        <View style={{
          backgroundColor: t.color.surfaceElevated,
          borderRadius: 5,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}>
          <Text style={{ color: t.color.textPrimary, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{tag}</Text>
        </View>
      )}
    </Row>
  );
}

// ── ProfileScreen (shared shell) ─────────────────────────────────────────────

interface ProfileScreenProps {
  name: string;
  initials: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function ProfileScreen({ name, initials, subtitle, children }: ProfileScreenProps) {
  const t = useTheme();
  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Avatar initials={initials} size={80} />
        <T variant="subtitle" style={{ marginTop: 12 }}>{name}</T>
        <T variant="caption" style={{ marginTop: 4 }}>{subtitle}</T>
      </View>
      {children}
      <View style={{ height: 32 }} />
    </Screen>
  );
}

// ── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Themed replacement for Alert.alert()'s native OS dialog — matches the app's dark UI. */
export function ConfirmDialog({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          width: '100%',
          maxWidth: 340,
          backgroundColor: t.color.surfaceCard,
          borderRadius: t.radius.xl,
          borderWidth: 1,
          borderColor: t.color.borderSubtle,
          padding: t.spacing.xl,
        }}>
          <T variant="subtitle" style={{ marginBottom: message ? 8 : 22 }}>{title}</T>
          {message && (
            <T variant="body" color={t.color.textSecondary} style={{ marginBottom: 22, lineHeight: 20 }}>
              {message}
            </T>
          )}
          <Row justify="flex-end" gap={24}>
            <Pressable onPress={onCancel} hitSlop={8}>
              <T variant="label" color={t.color.textSecondary}>{cancelLabel}</T>
            </Pressable>
            <Pressable onPress={onConfirm} hitSlop={8}>
              <T variant="label" color={destructive ? t.color.danger : t.color.gold}>{confirmLabel}</T>
            </Pressable>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

// ── GoldHeroCard ─────────────────────────────────────────────────────────────

interface GoldHeroCardProps {
  label: string;
  amount: string;
  change?: string;
  stats?: Array<{ value: string; label: string }>;
  style?: StyleProp<ViewStyle>;
}

export function GoldHeroCard({ label, amount, change, stats, style }: GoldHeroCardProps) {
  const t = useTheme();
  return (
    <View style={[{
      margin: t.spacing.xxl,
      borderRadius: t.radius.xxl,
      backgroundColor: t.color.goldSoft,
      borderWidth: 1,
      borderColor: '#34302A',
      padding: t.spacing.lg,
      overflow: 'hidden',
    }, style]}>
      <Eyebrow color={t.color.goldWarm}>{label}</Eyebrow>
      <Row gap={10} style={{ marginTop: 6 }}>
        <T variant="hero">{amount}</T>
        {change && (
          <View style={{ backgroundColor: '#1F1810', borderRadius: t.radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
            <T variant="small" color={t.color.gold}>▲ {change}</T>
          </View>
        )}
      </Row>
      {stats && (
        <Row gap={0} style={{ marginTop: 14 }}>
          {stats.map((s, i) => (
            <View key={i} style={{ flex: 1 }}>
              <T variant="subtitle">{s.value}</T>
              <T variant="small" color={t.color.textSecondary}>{s.label}</T>
            </View>
          ))}
        </Row>
      )}
    </View>
  );
}

// ── StatusDot ────────────────────────────────────────────────────────────────

type StatusType = 'active' | 'break' | 'off' | 'open' | 'closing' | 'completed' | 'in_progress' | 'upcoming' | 'confirmed';

export function StatusDot({ status }: { status: StatusType }) {
  const t = useTheme();
  const colorMap: Record<StatusType, string> = {
    active:      t.color.success,
    open:        t.color.success,
    completed:   t.color.success,
    confirmed:   t.color.success,
    break:       t.color.pending,
    closing:     t.color.pending,
    in_progress: t.color.gold,
    upcoming:    '#444444',
    off:         '#444444',
  };
  return (
    <View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colorMap[status] ?? '#444444',
    }} />
  );
}

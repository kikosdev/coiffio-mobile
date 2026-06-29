export type Role = 'client' | 'staff' | 'owner';

export const base = {
  color: {
    bgBase: '#0E0E0E',
    bgSunken: '#070707',
    surfaceCard: '#161616',
    surfaceElevated: '#1E1E1E',
    surfaceInput: '#1A1A1A',
    tabBar: '#121212',
    borderSubtle: '#232323',
    borderStrong: '#2A2A2A',
    tabBorder: '#1E1E1E',

    gold: '#F4A62A',
    goldSoft: '#1F1810',
    goldWarm: '#CDB892',
    onGold: '#0E0E0E',

    textPrimary: '#FFFFFF',
    textSecondary: '#8A8A8A',
    textMuted: '#6E6E6E',

    success: '#3A8A4A',
    successBg: 'rgba(58,138,74,0.15)',
    successSoft: 'rgba(58,138,74,0.15)',
    pending: '#8A6A2A',
    pendingBg: 'rgba(138,106,42,0.15)',
    danger: '#8A3A3A',
    dangerBg: 'rgba(138,58,58,0.15)',
    dangerSoft: 'rgba(138,58,58,0.15)',

    proTag: '#F4A62A',
    proTagText: '#0E0E0E',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 100,
    full: 9999,
  },
  typography: {
    size: {
      xs: 10,
      sm: 11,
      md: 12,
      base: 13,
      lg: 14,
      xl: 15,
      xxl: 18,
      xxxl: 22,
      display: 27,
      hero: 34,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
      black: '900' as const,
    },
    letterSpacing: {
      tight: -0.3,
      normal: 0,
      wide: 0.05,
      wider: 0.1,
      widest: 0.14,
      brand: 0.18,
    },
    family: {
      sans: 'Inter_400Regular',
      sansMedium: 'Inter_500Medium',
      sansSemibold: 'Inter_600SemiBold',
      sansBold: 'Inter_700Bold',
      sansExtrabold: 'Inter_800ExtraBold',
      sansBlack: 'Inter_900Black',
    },
  },
} as const;

const overlays: Record<Role, { accent: string; accentSoft: string; accentWarm: string }> = {
  client: { accent: '#F4A62A', accentSoft: '#1F1810', accentWarm: '#CDB892' },
  staff:  { accent: '#F4A62A', accentSoft: '#1F1810', accentWarm: '#CDB892' },
  owner:  { accent: '#F4A62A', accentSoft: '#1F1810', accentWarm: '#CDB892' },
};

export function resolveTokens(role: Role) {
  const o = overlays[role];
  return {
    ...base,
    color: {
      ...base.color,
      gold: o.accent,
      goldSoft: o.accentSoft,
      goldWarm: o.accentWarm,
    },
  };
}

export type Tokens = ReturnType<typeof resolveTokens>;

import React, { createContext, useContext, useMemo } from 'react';
import { resolveTokens, Tokens, Role } from './tokens';
import { useRoleStore } from '../state/role';

const ThemeContext = createContext<Tokens>(resolveTokens('client'));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const role = useRoleStore((s) => s.role);
  const tokens = useMemo(() => resolveTokens(role), [role]);
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Tokens {
  return useContext(ThemeContext);
}

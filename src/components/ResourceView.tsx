import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { UseResourceResult } from '../hooks/useResource';
import { Button, T } from './kit';

interface ResourceViewProps<T> {
  state: UseResourceResult<T>;
  children: (data: T) => React.ReactNode;
  emptyLabel?: string;
  emptyCta?: { label: string; onPress: () => void };
}

export function ResourceView<T>({
  state,
  children,
  emptyLabel = 'Nothing here yet.',
  emptyCta,
}: ResourceViewProps<T>): React.JSX.Element {
  const t = useTheme();

  if (state.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <ActivityIndicator color={t.color.gold} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60, gap: 14 }}>
        <T variant="body" color={t.color.textSecondary} style={{ textAlign: 'center' }}>
          {state.error ?? 'Something went wrong.'}
        </T>
        <Button variant="dark" size="sm" onPress={state.reload}>
          Réessayer
        </Button>
      </View>
    );
  }

  if (state.status === 'empty') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60, gap: 14 }}>
        <T variant="body" color={t.color.textMuted} style={{ textAlign: 'center' }}>
          {emptyLabel}
        </T>
        {emptyCta && (
          <Button variant="gold" size="sm" onPress={emptyCta.onPress}>
            {emptyCta.label}
          </Button>
        )}
      </View>
    );
  }

  // status === 'ready' — state.data is non-null by construction (useResource only sets
  // 'ready' right after storing a non-empty result).
  return <>{children(state.data as T)}</>;
}

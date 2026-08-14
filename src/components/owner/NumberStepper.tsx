import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

/** Shared by stock/restock.tsx and stock/adjust.tsx — same +/- control, different min/max/step per caller. */
export function NumberStepper({ value, onChange, step = 1, min, max }: NumberStepperProps): React.JSX.Element {
  const t = useTheme();

  function clamp(n: number): number {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  }

  function handleTextChange(text: string): void {
    if (text === '' || text === '-') return;
    const n = Number(text);
    if (!Number.isNaN(n)) onChange(clamp(n));
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={() => onChange(clamp(value - step))}
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: t.color.surfaceCard, borderWidth: 1, borderColor: t.color.borderSubtle,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Minus size={18} color={t.color.textPrimary} />
      </TouchableOpacity>
      <TextInput
        style={{
          flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800',
          color: t.color.textPrimary, fontFamily: t.typography.family.sansExtrabold,
        }}
        value={String(value)}
        onChangeText={handleTextChange}
        keyboardType="numeric"
      />
      <TouchableOpacity
        onPress={() => onChange(clamp(value + step))}
        style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: t.color.surfaceCard, borderWidth: 1, borderColor: t.color.borderSubtle,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Plus size={18} color={t.color.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

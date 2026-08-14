import React, { useState } from 'react';
import { Modal, Platform, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/ThemeProvider';
import { T, Button } from '../kit';

interface PickerFieldProps {
  mode: 'time' | 'date';
  value: Date;
  label: string; // what the trigger button shows, e.g. '09:00' or a formatted date
  onChange: (date: Date) => void;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

/**
 * Cross-platform wrapper around @react-native-community/datetimepicker — Android renders its
 * own native dialog and fires onChange once (so it's mounted only while `open`, then
 * unmounted); iOS renders inline, so it needs a bottom-sheet Modal with an explicit "Terminé"
 * to commit the draft value. Shared by every owner hours/schedule screen that needs a
 * time-or-date picker, instead of re-implementing this platform branch three times.
 */
export function PickerField({
  mode, value, label, onChange, disabled, minimumDate, maximumDate,
}: PickerFieldProps): React.JSX.Element {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleAndroidChange(_event: DateTimePickerEvent, selected?: Date): void {
    setOpen(false);
    if (selected) onChange(selected);
  }

  function openPicker(): void {
    if (disabled) return;
    setDraft(value);
    setOpen(true);
  }

  return (
    <>
      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        style={{
          backgroundColor: t.color.surfaceCard,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.color.borderSubtle,
          paddingVertical: 10,
          paddingHorizontal: 14,
          opacity: disabled ? 0.5 : 1,
          alignItems: 'center',
        }}
      >
        <T variant="body">{label}</T>
      </TouchableOpacity>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      )}

      {open && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{
              backgroundColor: t.color.surfaceCard,
              borderTopLeftRadius: t.radius.xl,
              borderTopRightRadius: t.radius.xl,
              padding: t.spacing.lg,
            }}>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant="dark"
                onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                  if (selected) setDraft(selected);
                }}
              />
              <Button variant="gold" fullWidth onPress={() => { onChange(draft); setOpen(false); }} style={{ marginTop: t.spacing.md }}>
                Terminé
              </Button>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

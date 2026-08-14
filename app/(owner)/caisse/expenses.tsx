import React, { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Card, Button } from '../../../src/components/kit';
import { ResourceView } from '../../../src/components/ResourceView';
import { useResource } from '../../../src/hooks/useResource';
import { PickerField } from '../../../src/components/owner/PickerField';
import * as caisseApi from '../../../src/api/owner/caisse';
import { ApiError } from '../../../src/api/client';
import { Expense } from '../../../src/types/owner';
import { formatMoney } from '../../../src/utils/formatMoney';
import { formatSalonDate, localDateKey, nowAsSalonTime, parseLocalDateKey, salonDateKey } from '../../../src/utils/salonTime';

type Editing = 'new' | Expense | null;

function todayAsLocalDate(): Date {
  return parseLocalDateKey(salonDateKey(nowAsSalonTime()));
}

function ExpenseForm({
  initial, onSaved, onCancel,
}: { initial: Expense | null; onSaved: () => Promise<void>; onCancel: () => void }): React.JSX.Element {
  const t = useTheme();
  const [category, setCategory] = useState(initial?.category ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [date, setDate] = useState<Date>(() => (initial ? parseLocalDateKey(initial.date) : todayAsLocalDate()));
  const [note, setNote] = useState(initial?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount.replace(',', '.'));
  const canSave = category.trim().length > 0 && amount.trim().length > 0 && !Number.isNaN(amountNum) && amountNum >= 0 && !saving;

  const inputStyle = {
    backgroundColor: t.color.surfaceCard,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderSubtle,
    padding: t.spacing.md,
    color: t.color.textPrimary,
    fontSize: 14,
    fontFamily: t.typography.family.sansMedium,
  };

  async function handleSave(): Promise<void> {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const dto = { category: category.trim(), amount: amountNum, date: localDateKey(date), note: note.trim() || undefined };
      if (initial) {
        await caisseApi.updateExpense(initial._id, dto);
      } else {
        await caisseApi.createExpense(dto);
      }
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer cette dépense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ padding: t.spacing.md, gap: 10 }}>
      <TextInput style={inputStyle} placeholder="Catégorie (ex. Fournitures)" placeholderTextColor={t.color.textMuted} value={category} onChangeText={setCategory} />
      <TextInput style={inputStyle} placeholder="Montant (TND)" placeholderTextColor={t.color.textMuted} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <PickerField mode="date" value={date} label={format(date, 'EEE d MMM yyyy')} onChange={setDate} />
      <TextInput style={inputStyle} placeholder="Note (optionnel)" placeholderTextColor={t.color.textMuted} value={note} onChangeText={setNote} />

      {error != null && <T variant="small" color={t.color.danger}>{error}</T>}

      <Row gap={10}>
        <Button variant="dark" style={{ flex: 1 }} onPress={onCancel} disabled={saving}>Annuler</Button>
        <Button variant="white" style={{ flex: 1 }} disabled={!canSave} onPress={handleSave}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Row>
    </Card>
  );
}

export default function Expenses(): React.JSX.Element {
  const t = useTheme();
  const resource = useResource(() => caisseApi.listExpenses(), []);
  const [editing, setEditing] = useState<Editing>(null);

  async function handleDelete(expense: Expense): Promise<void> {
    Alert.alert(
      'Supprimer cette dépense ?',
      `${expense.category} · ${formatMoney(expense.amount)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await caisseApi.removeExpense(expense._id);
              await resource.reload();
            } catch (err) {
              Alert.alert('Erreur', err instanceof ApiError ? err.message : 'Impossible de supprimer cette dépense.');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg, marginBottom: t.spacing.md }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Dépenses</T>
        {editing === null ? (
          <TouchableOpacity onPress={() => setEditing('new')} hitSlop={8}>
            <Plus size={22} color={t.color.gold} />
          </TouchableOpacity>
        ) : <View style={{ width: 22 }} />}
      </Row>

      <View style={{ paddingHorizontal: t.spacing.xxl, gap: 10, paddingBottom: t.spacing.xxl }}>
        {editing !== null && (
          <ExpenseForm
            initial={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await resource.reload();
            }}
          />
        )}

        <ResourceView state={resource} emptyLabel="Aucune dépense enregistrée.">
          {(expenses) => (
            <>
              {expenses.map((e) => (
                <Card key={e._id} style={{ padding: t.spacing.md }} onPress={() => setEditing(e)}>
                  <Row justify="space-between">
                    <View style={{ flex: 1 }}>
                      <T variant="body">{e.category}</T>
                      <T variant="small" color={t.color.textMuted} style={{ marginTop: 2 }}>
                        {formatSalonDate(e.date, 'd MMM yyyy')}{e.note ? ` · ${e.note}` : ''}
                      </T>
                    </View>
                    <Row gap={12}>
                      <T variant="label">{formatMoney(e.amount)}</T>
                      <TouchableOpacity onPress={() => handleDelete(e)} hitSlop={8}>
                        <Trash2 size={16} color={t.color.danger} />
                      </TouchableOpacity>
                    </Row>
                  </Row>
                </Card>
              ))}
            </>
          )}
        </ResourceView>
      </View>
    </Screen>
  );
}

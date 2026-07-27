import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { useAuthStore } from '../../../src/stores/auth';
import { ApiError } from '../../../src/api/client';
import { createAppointment } from '../../../src/api/booking';
import { formatMoney } from '../../../src/utils/formatMoney';
import { DEFAULT_PHONE_PREFIX, joinPhoneNumber, normalizePhonePrefix, splitPhoneNumber } from '../../../src/utils/phone';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function MoreHorizontal({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Circle cx={6} cy={12} r={1.6} />
      <Circle cx={12} cy={12} r={1.6} />
      <Circle cx={18} cy={12} r={1.6} />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();
  const user = useAuthStore((s) => s.user);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [phonePrefix, setPhonePrefix] = useState(DEFAULT_PHONE_PREFIX);
  const [phoneLocal, setPhoneLocal] = useState('');

  // Pre-fill contact details from the signed-in profile — still editable, still required.
  useEffect(() => {
    if (!user || draft.contact.firstName || draft.contact.phone) return;
    const parts = (user.name ?? '').trim().split(' ');
    const split = splitPhoneNumber(user.phone ?? '');
    setPhonePrefix(split.prefix);
    setPhoneLocal(split.local);
    draft.setContact({
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
      phone: joinPhoneNumber(split.prefix, split.local),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const contact = draft.contact;
  useEffect(() => {
    if (phoneLocal || !contact.phone) return;
    const split = splitPhoneNumber(contact.phone);
    setPhonePrefix(split.prefix);
    setPhoneLocal(split.local);
  }, [contact.phone, phoneLocal]);

  const updatePhonePrefix = (value: string) => {
    const nextPrefix = normalizePhonePrefix(value);
    setPhonePrefix(nextPrefix);
    draft.setContact({ phone: joinPhoneNumber(nextPrefix, phoneLocal) });
  };

  const updatePhoneLocal = (value: string) => {
    setPhoneLocal(value);
    draft.setContact({ phone: joinPhoneNumber(phonePrefix, value) });
  };

  const contactValid =
    contact.firstName.trim() !== '' &&
    phoneLocal.trim() !== '';
  const canSubmit = contactValid && !!draft.barberId && !!draft.slotStartISO && draft.services.length > 0;

  const handleConfirmBooking = async () => {
    if (!canSubmit || !draft.barberId || !draft.slotStartISO) return;
    setSubmitting(true);
    setBookingError('');
    try {
      // Same POST /appointments the web storefront uses for both guest and signed-in
      // bookings — the backend resolves/creates the Client by phone (merge-on-phone).
      const appt = await createAppointment({
        serviceIds: draft.services.map((s) => s.id),
        stylistId: draft.barberId,
        start: draft.slotStartISO,
        ...(user?.clientId ? { clientId: user.clientId } : {}),
        clientName: `${contact.firstName} ${contact.lastName}`.trim(),
        clientPhone: contact.phone,
        source: 'online',
      });
      draft.setResult(appt);
      router.replace('/(client)/booking/confirmation');
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'Could not book this slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = draft.servicesSubtotal();
  const fee = draft.bookingFee();
  const total = draft.total();

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topWordmark, { color: t.color.textPrimary }]}>BLACK BOX</Text>
        <MoreHorizontal color={t.color.textPrimary} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: t.color.textPrimary }]}>Payment</Text>

        {/* ── Your details ── */}
        <View style={[styles.detailsCard, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.detailsTitle, { color: t.color.textPrimary }]}>Your details</Text>
          <View style={styles.detailsRow}>
            <TextInput
              style={[styles.detailsInput, { flex: 1, backgroundColor: t.color.surfaceElevated, color: t.color.textPrimary }]}
              value={contact.firstName}
              onChangeText={(v) => draft.setContact({ firstName: v })}
              placeholder="First name"
              placeholderTextColor={t.color.textMuted}
            />
            <TextInput
              style={[styles.detailsInput, { flex: 1, backgroundColor: t.color.surfaceElevated, color: t.color.textPrimary }]}
              value={contact.lastName}
              onChangeText={(v) => draft.setContact({ lastName: v })}
              placeholder="Last name (optional)"
              placeholderTextColor={t.color.textMuted}
            />
          </View>
          <View style={[styles.phoneField, { backgroundColor: t.color.surfaceElevated }]}>
            <View style={[styles.phonePrefix, { borderRightColor: t.color.borderSubtle }]}>
              <Text style={styles.phoneFlag}>🇹🇳</Text>
              <TextInput
                value={phonePrefix}
                onChangeText={updatePhonePrefix}
                placeholder="+216"
                placeholderTextColor={t.color.textMuted}
                keyboardType="phone-pad"
                style={[styles.phonePrefixInput, { color: t.color.textPrimary }]}
              />
            </View>
            <TextInput
              style={[styles.phoneLocalInput, { color: t.color.textPrimary }]}
              value={phoneLocal}
              onChangeText={updatePhoneLocal}
              placeholder="20 123 456"
              placeholderTextColor={t.color.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ── Booking details ── */}
        <View style={[styles.recap, { backgroundColor: t.color.surfaceCard }]}>
          <Text style={[styles.detailsTitle, { color: t.color.textPrimary }]}>Booking details</Text>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Salon</Text>
            <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>{draft.salonName || 'Salon'}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Barber</Text>
            <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>{draft.barberName || 'Barber'}</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Date & time</Text>
            <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>
              {draft.date ?? '-'} · {draft.time ?? '-'}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Payment</Text>
            <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>Cash at salon</Text>
          </View>
        </View>

        {/* ── Recap ── */}
        <View style={[styles.recap, { backgroundColor: t.color.surfaceCard }]}>
          <View style={styles.recapRow}>
            <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>
              Services ({draft.services.length})
            </Text>
            <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>
              {formatMoney(subtotal)}
            </Text>
          </View>

          {/* Booking fee — hidden if 0 */}
          {fee > 0 && (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Booking fee</Text>
              <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>{formatMoney(fee)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: t.color.bgBase,
            borderTopColor: t.color.borderSubtle,
          },
        ]}
      >
        {bookingError !== '' && (
          <Text style={[styles.promoFeedback, { color: t.color.danger }]}>{bookingError}</Text>
        )}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: t.color.textMuted }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: t.color.textPrimary }]}>{formatMoney(total)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: canSubmit ? t.color.textPrimary : t.color.surfaceElevated, opacity: pressed && canSubmit ? 0.88 : 1 },
          ]}
          disabled={!canSubmit || submitting}
          onPress={handleConfirmBooking}
        >
          <Text style={[styles.ctaBtnText, { color: canSubmit ? t.color.bgBase : t.color.textMuted }]}>
            {submitting ? 'Confirming…' : 'Confirm Booking'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topWordmark:    { fontSize: 14, fontWeight: '800', letterSpacing: 2.52 },
  scrollContent:  { paddingHorizontal: 20, paddingTop: 4 },
  title:          { fontSize: 28, fontWeight: '700', marginTop: 14, marginBottom: 18 },

  // Your details
  detailsCard:    { borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 },
  detailsTitle:   { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  detailsRow:     { flexDirection: 'row', gap: 10 },
  detailsInput:   { borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, fontWeight: '600' },
  phoneField:     { height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  phonePrefix:    { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, borderRightWidth: 1 },
  phoneFlag:      { fontSize: 14 },
  phonePrefixInput: { width: 54, fontSize: 14, fontWeight: '700', paddingVertical: 0 },
  phoneLocalInput:{ flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 14, fontWeight: '600' },

  // Method toggle
  methodRow:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 100, paddingVertical: 10 },
  methodActive:   {},
  methodText:     { fontSize: 13, fontWeight: '700' },
  soonChip:       { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  soonText:       { fontSize: 9, fontWeight: '700' },

  // Cash info card
  infoCard:       { borderRadius: 16, padding: 16, marginBottom: 16 },
  infoRow:        { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  infoTitle:      { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  infoBody:       { fontSize: 13, fontWeight: '400', lineHeight: 19 },

  // Recap
  recap:          { borderRadius: 16, padding: 16 },
  recapRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  recapLabel:     { fontSize: 13, fontWeight: '500' },
  recapValue:     { fontSize: 13, fontWeight: '700' },
  promoFeedback:  { fontSize: 12, fontWeight: '600', marginTop: 6 },

  // Footer
  footer:         { paddingHorizontal: 20, paddingTop: 14, gap: 10, borderTopWidth: 1 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { fontSize: 13, fontWeight: '500' },
  totalAmount:    { fontSize: 28, fontWeight: '700' },
  ctaBtn:         { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:     { fontSize: 15, fontWeight: '700' },
});

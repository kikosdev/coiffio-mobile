import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useBookingDraft } from '../../../src/stores/bookingDraft';
import { formatMoney } from '../../../src/utils/formatMoney';

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

function WalletIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
      <Path d="M16 12h4v4h-4a2 2 0 0 1 0-4z" />
    </Svg>
  );
}

function TagIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Circle cx={7} cy={7} r={1.5} />
    </Svg>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const draft = useBookingDraft();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState(false);

  // Pre-fill from pendingPromoCode set by Offers screen
  useEffect(() => {
    if (draft.pendingPromoCode) {
      setPromoInput(draft.pendingPromoCode);
      draft.setPendingPromo('');
    }
  }, []);

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess(false);
    if (!promoInput.trim()) return;
    const result = draft.applyPromo(promoInput);
    if (result.ok) {
      setPromoSuccess(true);
    } else {
      setPromoError(result.message ?? 'Invalid code');
    }
  };

  const handleConfirmBooking = () => {
    // V1 mock: auto-confirm cash booking
    router.replace('/(client)/booking/confirmation');
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

        {/* ── Method toggle ── */}
        <View style={styles.methodRow}>
          {/* Cash — active */}
          <View style={[styles.methodPill, styles.methodActive, { backgroundColor: t.color.textPrimary }]}>
            <Text style={[styles.methodText, { color: t.color.bgBase }]}>Cash</Text>
          </View>
          {/* Bank card — disabled */}
          <View style={[styles.methodPill, { backgroundColor: t.color.surfaceElevated, opacity: 0.45 }]}>
            <Text style={[styles.methodText, { color: t.color.textSecondary }]}>Bank Card</Text>
            <View style={[styles.soonChip, { backgroundColor: t.color.borderStrong }]}>
              <Text style={[styles.soonText, { color: t.color.textMuted }]}>Soon</Text>
            </View>
          </View>
          {/* Apple Pay — disabled */}
          <View style={[styles.methodPill, { backgroundColor: t.color.surfaceElevated, opacity: 0.45 }]}>
            <Text style={[styles.methodText, { color: t.color.textSecondary }]}>Apple Pay</Text>
            <View style={[styles.soonChip, { backgroundColor: t.color.borderStrong }]}>
              <Text style={[styles.soonText, { color: t.color.textMuted }]}>Soon</Text>
            </View>
          </View>
        </View>

        {/* ── Cash info card ── */}
        <View style={[styles.infoCard, { backgroundColor: t.color.surfaceCard }]}>
          <View style={styles.infoRow}>
            <WalletIcon color={t.color.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: t.color.textPrimary }]}>Payment in cash at the salon</Text>
              <Text style={[styles.infoBody, { color: t.color.textMuted }]}>
                Your booking is confirmed instantly. Pay {formatMoney(total)} on arrival.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Recap ── */}
        <View style={[styles.recap, { backgroundColor: t.color.surfaceCard }]}>
          {/* Services or Pack line */}
          {draft.pack ? (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>
                Pack · {draft.pack.name}
              </Text>
              <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>
                {formatMoney(subtotal)}
              </Text>
            </View>
          ) : (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>
                Services ({draft.services.length})
              </Text>
              <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>
                {formatMoney(subtotal)}
              </Text>
            </View>
          )}

          {/* Booking fee — hidden if 0 */}
          {fee > 0 && (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: t.color.textSecondary }]}>Booking fee</Text>
              <Text style={[styles.recapValue, { color: t.color.textPrimary }]}>{formatMoney(fee)}</Text>
            </View>
          )}

          {/* Promo discount */}
          {draft.promo && (
            <View style={styles.recapRow}>
              <Text style={[styles.recapLabel, { color: t.color.gold }]}>
                Promo · {draft.promo.code}
              </Text>
              <Text style={[styles.recapValue, { color: t.color.gold }]}>
                -{formatMoney(draft.promo.discount)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: t.color.borderSubtle }]} />

          {/* Promo input */}
          <View style={styles.promoRow}>
            <View style={[styles.promoInputWrap, { backgroundColor: t.color.surfaceElevated }]}>
              <TagIcon color={t.color.textMuted} />
              <TextInput
                style={[styles.promoInput, { color: t.color.textPrimary }]}
                value={promoInput}
                onChangeText={(v) => { setPromoInput(v.toUpperCase()); setPromoError(''); setPromoSuccess(false); }}
                placeholder="Promo code"
                placeholderTextColor={t.color.textMuted}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApplyPromo}
              />
            </View>
            <Pressable
              style={[styles.applyBtn, { backgroundColor: t.color.surfaceElevated }]}
              onPress={handleApplyPromo}
            >
              <Text style={[styles.applyBtnText, { color: t.color.textPrimary }]}>Apply</Text>
            </Pressable>
          </View>
          {promoError !== '' && (
            <Text style={[styles.promoFeedback, { color: t.color.danger }]}>{promoError}</Text>
          )}
          {promoSuccess && (
            <Text style={[styles.promoFeedback, { color: t.color.success }]}>Code applied!</Text>
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
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: t.color.textMuted }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: t.color.textPrimary }]}>{formatMoney(total)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: t.color.textPrimary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleConfirmBooking}
        >
          <Text style={[styles.ctaBtnText, { color: t.color.bgBase }]}>Confirm Booking</Text>
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
  divider:        { height: 1, marginVertical: 10 },
  promoRow:       { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 },
  promoInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  promoInput:     { flex: 1, fontSize: 14, fontWeight: '600', height: 44 },
  applyBtn:       { borderRadius: 12, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center' },
  applyBtnText:   { fontSize: 13, fontWeight: '700' },
  promoFeedback:  { fontSize: 12, fontWeight: '600', marginTop: 6 },

  // Footer
  footer:         { paddingHorizontal: 20, paddingTop: 14, gap: 10, borderTopWidth: 1 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { fontSize: 13, fontWeight: '500' },
  totalAmount:    { fontSize: 28, fontWeight: '700' },
  ctaBtn:         { borderRadius: 100, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText:     { fontSize: 15, fontWeight: '700' },
});

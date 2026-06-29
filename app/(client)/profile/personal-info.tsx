import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Image, StyleSheet, Alert, Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useProfile } from '../../../src/stores/profile';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male',        label: 'Male' },
  { value: 'female',      label: 'Female' },
  { value: 'other',       label: 'Other' },
  { value: 'unspecified', label: 'Prefer not to say' },
] as const;

const GENDER_LABEL: Record<string, string> = {
  male: 'Male', female: 'Female', other: 'Other', unspecified: 'Prefer not to say',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function AccountRow({ eyebrow, value, onPress, showDivider, borderColor, rightSlot }: {
  eyebrow: string; value: string; onPress: () => void;
  showDivider?: boolean; borderColor: string;
  rightSlot?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fieldRow,
        showDivider && { borderTopWidth: 1, borderTopColor: borderColor },
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.fieldEyebrow, { color: t.color.textMuted }]}>{eyebrow}</Text>
        <Text style={[styles.fieldValue, { color: t.color.textPrimary }]} numberOfLines={1}>{value}</Text>
      </View>
      {rightSlot ?? <PencilIcon color={t.color.textMuted} />}
    </Pressable>
  );
}

function AboutRow({ label, value, onPress, showDivider, borderColor }: {
  label: string; value: string; onPress: () => void;
  showDivider?: boolean; borderColor: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fieldRow,
        showDivider && { borderTopWidth: 1, borderTopColor: borderColor },
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.aboutLabel, { color: t.color.textSecondary, flex: 1 }]}>{label}</Text>
      <Text style={[styles.aboutValue, { color: t.color.textPrimary }]} numberOfLines={1}>{value}</Text>
      <View style={{ marginLeft: 8 }}>
        <ChevronRight color={t.color.textMuted} />
      </View>
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function PersonalInfoScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();

  const [showGenderSheet, setShowGenderSheet]     = useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [tempBirthday, setTempBirthday]           = useState<Date>(new Date(1992, 2, 14));

  const birthdayDate = profile.birthday
    ? parse(profile.birthday, 'yyyy-MM-dd', new Date())
    : new Date(1992, 2, 14);

  const birthdayDisplay = profile.birthday
    ? format(parse(profile.birthday, 'yyyy-MM-dd', new Date()), 'd MMM yyyy')
    : 'Not set';

  const genderDisplay = profile.gender ? (GENDER_LABEL[profile.gender] ?? 'Not set') : 'Not set';

  const initials = profile.fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // ── Photo picker ──────────────────────────────────────────────────────────

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      profile.setAvatar(result.assets[0].uri);
    }
  };

  // ── Birthday picker ───────────────────────────────────────────────────────

  const openBirthdayPicker = () => {
    setTempBirthday(birthdayDate);
    setShowBirthdayPicker(true);
  };

  const handleBirthdayChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowBirthdayPicker(false);
      if (date) profile.updateField('birthday', format(date, 'yyyy-MM-dd'));
    } else {
      if (date) setTempBirthday(date);
    }
  };

  const handleBirthdayDone = () => {
    profile.updateField('birthday', format(tempBirthday, 'yyyy-MM-dd'));
    setShowBirthdayPicker(false);
  };

  // ── Edit field navigation ─────────────────────────────────────────────────

  const goEdit = (
    field: string, label: string, value: string,
    opts?: { helper?: string; maxLength?: number; keyboard?: string; kind?: string },
  ) => {
    router.push({
      pathname: '/(client)/profile/edit-field',
      params: { field, label, value, ...opts },
    });
  };

  // ── Deactivate ────────────────────────────────────────────────────────────

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate account?',
      'Your account will be hidden. Contact support to reactivate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            profile.deactivateAccount();
            Alert.alert('Account deactivated', 'Your account has been deactivated.');
            router.back();
          },
        },
      ],
    );
  };

  // ── Verified badge ────────────────────────────────────────────────────────

  const VerifiedBadge = ({ verified }: { verified: boolean }) => (
    <View style={[
      styles.verifiedBadge,
      { backgroundColor: verified ? t.color.successSoft : t.color.surfaceElevated },
    ]}>
      <Text style={{ color: verified ? t.color.success : t.color.goldWarm, fontSize: 9, fontWeight: '800' }}>
        {verified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: t.color.bgBase }]}>
      {/* ── TopBar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={t.color.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: t.color.textPrimary }]}>Personal information</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Change photo ── */}
        <View style={styles.photoSection}>
          <Pressable onPress={handleChangePhoto} style={{ alignItems: 'center' }}>
            <View style={styles.avatarWrap}>
              {profile.avatarUri ? (
                <Image
                  source={{ uri: profile.avatarUri }}
                  style={[styles.avatar, { borderRadius: 44 }]}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: t.color.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.initials, { color: t.color.textPrimary }]}>{initials}</Text>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: t.color.gold, borderColor: t.color.bgBase }]}>
                <CameraIcon color={t.color.onGold} />
              </View>
            </View>
            <Text style={{ color: t.color.gold, fontSize: 13, fontWeight: '600', marginTop: 10 }}>
              Change photo
            </Text>
          </Pressable>
        </View>

        {/* ── ACCOUNT ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted, marginTop: 24 }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <AccountRow
            eyebrow="FULL NAME"
            value={profile.fullName}
            borderColor={t.color.borderSubtle}
            onPress={() => goEdit('fullName', 'Full name', profile.fullName, {
              helper: 'Your real name, as barbers see you.',
              maxLength: 50,
            })}
          />
          <AccountRow
            eyebrow="USERNAME"
            value={`@${profile.username}`}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => goEdit('username', 'Username', profile.username, {
              helper: 'Letters, numbers, dots and underscores only.',
              maxLength: 30,
            })}
          />
          <AccountRow
            eyebrow="EMAIL"
            value={profile.email}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => goEdit('email', 'Email', profile.email, {
              kind: 'email',
              keyboard: 'email-address',
              helper: "We'll send a verification link.",
            })}
            rightSlot={<VerifiedBadge verified={profile.emailVerified} />}
          />
          <AccountRow
            eyebrow="PHONE"
            value={profile.phone}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => goEdit('phone', 'Phone', profile.phone, {
              kind: 'phone',
              keyboard: 'phone-pad',
              helper: 'Format: +216 XX XXX XXX',
            })}
          />
        </View>

        {/* ── ABOUT YOU ── */}
        <Text style={[styles.eyebrow, { color: t.color.textMuted, marginTop: 20 }]}>ABOUT YOU</Text>
        <View style={[styles.card, { backgroundColor: t.color.surfaceCard }]}>
          <AboutRow
            label="Gender"
            value={genderDisplay}
            borderColor={t.color.borderSubtle}
            onPress={() => setShowGenderSheet(true)}
          />
          <AboutRow
            label="Birthday"
            value={birthdayDisplay}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={openBirthdayPicker}
          />
          <AboutRow
            label="Location"
            value={profile.location ?? 'Not set'}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => goEdit('location', 'Location', profile.location ?? '', {
              helper: 'Your city, e.g. Tunis, TN',
              maxLength: 60,
            })}
          />
        </View>

        {/* ── Deactivate ── */}
        <Pressable
          onPress={handleDeactivate}
          style={({ pressed }) => [styles.deactivateBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ color: t.color.danger, fontSize: 14, fontWeight: '600' }}>
            Deactivate account
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Gender bottom sheet ── */}
      <Modal
        visible={showGenderSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowGenderSheet(false)} />
        <View style={[styles.sheet, { backgroundColor: t.color.surfaceCard, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: t.color.borderStrong }]} />
          <Text style={[styles.sheetTitle, { color: t.color.textPrimary, marginBottom: 4 }]}>Gender</Text>
          {GENDER_OPTIONS.map((o, i) => (
            <Pressable
              key={o.value}
              style={({ pressed }) => [
                styles.sheetOption,
                i > 0 && { borderTopWidth: 1, borderTopColor: t.color.borderSubtle },
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                profile.updateField('gender', o.value);
                setShowGenderSheet(false);
              }}
            >
              <Text style={[styles.sheetOptionText, { color: profile.gender === o.value ? t.color.gold : t.color.textPrimary }]}>
                {o.label}
              </Text>
              {profile.gender === o.value && <CheckIcon color={t.color.gold} />}
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* ── Birthday picker ── */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showBirthdayPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBirthdayPicker(false)}
        >
          <Pressable style={styles.sheetOverlay} onPress={() => setShowBirthdayPicker(false)} />
          <View style={[styles.sheet, { backgroundColor: t.color.surfaceCard, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: t.color.borderStrong }]} />
            <View style={styles.birthdayHeader}>
              <Pressable onPress={() => setShowBirthdayPicker(false)} hitSlop={12}>
                <Text style={{ color: t.color.textMuted, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Text style={[styles.sheetTitle, { color: t.color.textPrimary, marginBottom: 0 }]}>Birthday</Text>
              <Pressable onPress={handleBirthdayDone} hitSlop={12}>
                <Text style={{ color: t.color.gold, fontSize: 14, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempBirthday}
              mode="date"
              display="spinner"
              onChange={handleBirthdayChange}
              textColor={t.color.textPrimary}
              maximumDate={new Date()}
              style={{ marginTop: 4 }}
            />
          </View>
        </Modal>
      ) : (
        showBirthdayPicker && (
          <DateTimePicker
            value={birthdayDate}
            mode="date"
            display="default"
            onChange={handleBirthdayChange}
            maximumDate={new Date()}
          />
        )
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:        { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 4 },
  topTitle:    { fontSize: 15, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 8 },

  // Photo
  photoSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 4 },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 88, height: 88, borderRadius: 44 },
  initials:     { fontSize: 28, fontWeight: '800' },
  cameraBadge:  { position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: 15, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },

  // Eyebrow
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },

  // Card
  card: { borderRadius: 18, overflow: 'hidden' },

  // Field rows
  fieldRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  fieldEyebrow:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  fieldValue:    { fontSize: 15, fontWeight: '600', marginTop: 2 },
  verifiedBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, flexShrink: 0 },

  // About rows
  aboutLabel:    { fontSize: 14, fontWeight: '500' },
  aboutValue:    { fontSize: 14, fontWeight: '600', flexShrink: 1 },

  // Deactivate
  deactivateBtn: { alignItems: 'center', marginTop: 28 },

  // Bottom sheet
  sheetOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.50)' },
  sheet:           { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle:      { fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  sheetOptionText: { fontSize: 15, fontWeight: '600' },
  birthdayHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
});

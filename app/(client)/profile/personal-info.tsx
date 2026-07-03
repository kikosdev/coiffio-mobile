import {
  View, Text, ScrollView, Pressable, Image, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function AccountRow({ eyebrow, value, onPress, showDivider, borderColor, rightSlot }: {
  eyebrow: string; value: string; onPress?: () => void;
  showDivider?: boolean; borderColor: string;
  rightSlot?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.fieldRow,
        showDivider && { borderTopWidth: 1, borderTopColor: borderColor },
        { opacity: pressed && onPress ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.fieldEyebrow, { color: t.color.textMuted }]}>{eyebrow}</Text>
        <Text style={[styles.fieldValue, { color: t.color.textPrimary }]} numberOfLines={1}>{value}</Text>
      </View>
      {rightSlot ?? (onPress ? <PencilIcon color={t.color.textMuted} /> : null)}
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function PersonalInfoScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();

  const initials = profile.fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // ── Photo picker ──────────────────────────────────────────────────────────
  // Local-only: picks a real photo from the device library, but there's no backend
  // avatar storage yet, so it doesn't persist across reinstalls/devices.

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
            eyebrow="EMAIL"
            value={profile.email}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => goEdit('email', 'Email', profile.email, {
              kind: 'email',
              keyboard: 'email-address',
            })}
          />
          <AccountRow
            eyebrow="PHONE"
            value={profile.phone}
            borderColor={t.color.borderSubtle}
            showDivider
            onPress={() => Alert.alert(
              'Phone number',
              'Your phone number is tied to your account and can’t be changed here. Contact support if you need to update it.',
            )}
            rightSlot={<View />}
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

  // Deactivate
  deactivateBtn: { alignItems: 'center', marginTop: 28 },
});

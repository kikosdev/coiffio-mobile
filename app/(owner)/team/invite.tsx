import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Screen, Row, T, Eyebrow, Avatar, Button } from '../../../src/components/kit';

export default function InviteBarber() {
  const t = useTheme();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('+216 ');

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

  function handleSend() {
    // TODO: POST /team/invite { fullName, mobile }
    router.back();
  }

  return (
    <Screen>
      {/* Header */}
      <Row justify="space-between" style={{ paddingHorizontal: t.spacing.xxl, paddingTop: t.spacing.lg }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <X size={22} color={t.color.textPrimary} />
        </TouchableOpacity>
        <T variant="label">Invite barber</T>
        <View style={{ width: 30 }} />
      </Row>

      {/* Avatar placeholder */}
      <View style={{ alignItems: 'center', paddingVertical: t.spacing.xl }}>
        <View style={{ position: 'relative' }}>
          <Avatar initials="+" size={76} />
          <View style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: t.color.gold,
            borderWidth: 3, borderColor: t.color.bgBase,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <T variant="small" style={{ fontSize: 14, lineHeight: 14 }} color={t.color.onGold}>+</T>
          </View>
        </View>
      </View>

      {/* Form fields */}
      <View style={{ paddingHorizontal: t.spacing.xxl, gap: t.spacing.lg }}>
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Full Name</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Yusuf Al-Amin"
            placeholderTextColor={t.color.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>
        <View>
          <Eyebrow style={{ marginBottom: 7 }}>Mobile</Eyebrow>
          <TextInput
            style={inputStyle}
            placeholder="+216 XX XXX XXX"
            placeholderTextColor={t.color.textMuted}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Send CTA */}
      <View style={{ paddingHorizontal: t.spacing.xxl, marginTop: t.spacing.xxxl }}>
        <Button
          variant="white"
          size="lg"
          fullWidth
          disabled={fullName.trim().length < 2}
          onPress={handleSend}
        >
          Send invite
        </Button>
      </View>
    </Screen>
  );
}

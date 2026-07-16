import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { useAuth } from '@/src/auth';

export default function Register() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handle = async () => {
    setErr('');
    if (!name || !surname || !email || !password) { setErr('Tüm alanlar zorunlu'); return; }
    if (password.length < 6) { setErr('Şifre en az 6 karakter olmalı'); return; }
    setBusy(true);
    try {
      await register(name.trim(), surname.trim(), email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) { setErr(e?.message || 'Kayıt olunamadı'); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} testID="back-button">
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.sub}>Yeni çalışan hesabı oluşturun</Text>

          <View style={styles.card}>
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ad</Text>
                <TextInput testID="reg-name-input" value={name} onChangeText={setName} placeholder="Ayşe"
                  style={styles.input} placeholderTextColor={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Soyad</Text>
                <TextInput testID="reg-surname-input" value={surname} onChangeText={setSurname} placeholder="Yılmaz"
                  style={styles.input} placeholderTextColor={colors.muted} />
              </View>
            </View>
            <Text style={[styles.label, { marginTop: spacing.md }]}>E-posta</Text>
            <TextInput testID="reg-email-input" value={email} onChangeText={setEmail} placeholder="ornek@sirket.com"
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              style={styles.input} placeholderTextColor={colors.muted} />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Şifre</Text>
            <TextInput testID="reg-password-input" value={password} onChangeText={setPassword}
              placeholder="En az 6 karakter" secureTextEntry style={styles.input} placeholderTextColor={colors.muted} />

            {err ? <Text testID="reg-error" style={styles.err}>{err}</Text> : null}

            <Pressable testID="reg-submit-button" onPress={handle} disabled={busy}
              style={({ pressed }) => [styles.cta, (pressed || busy) && { opacity: 0.85 }]}>
              <Text style={styles.ctaText}>{busy ? 'Kaydediliyor…' : 'Hesap Oluştur'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footText}>Zaten hesabınız var mı?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable testID="goto-login-button"><Text style={styles.link}> Giriş Yap</Text></Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  wrap: { padding: spacing.xl, flexGrow: 1 },
  back: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.onSurfaceSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  rowInputs: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceSecondary, marginBottom: spacing.xs, letterSpacing: 0.3 },
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: 15, color: colors.onSurface, backgroundColor: colors.surfaceSecondary },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.md },
  cta: { marginTop: spacing.lg, height: 52, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.strong },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footText: { color: colors.onSurfaceSecondary, fontSize: 14 },
  link: { color: colors.brand, fontSize: 14, fontWeight: '700' },
});

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, fonts } from '@/src/theme';
import { useAuth } from '@/src/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handle = async () => {
    setErr('');
    if (!email || !password) { setErr('E-posta ve şifre gerekli'); return; }
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role === 'admin') router.replace('/(admin)/dashboard');
      else router.replace('/(tabs)');
    } catch (e: any) {
      setErr(e?.message || 'Giriş yapılamadı');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logoBadge}><Ionicons name="business" size={22} color={colors.brand} /></View>
            <Text style={styles.brandText}>Atlas PDKS</Text>
          </View>
          <Text style={styles.title}>Hoş geldiniz</Text>
          <Text style={styles.sub}>Konum doğrulamalı çalışan takibi</Text>

          <View style={styles.card}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              testID="login-email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@sirket.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Şifre</Text>
            <TextInput
              testID="login-password-input"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
              placeholderTextColor={colors.muted}
            />

            {err ? <Text testID="login-error" style={styles.err}>{err}</Text> : null}

            <Pressable
              testID="login-submit-button"
              onPress={handle}
              disabled={busy}
              style={({ pressed }) => [styles.cta, (pressed || busy) && { opacity: 0.85 }]}
            >
              <Text style={styles.ctaText}>{busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footText}>Hesabınız yok mu?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable testID="goto-register-button"><Text style={styles.link}> Kayıt Ol</Text></Pressable>
            </Link>
          </View>

          <View style={styles.hint} testID="admin-hint">
            <Ionicons name="shield-checkmark" size={16} color={colors.brand} />
            <Text style={styles.hintText}>Admin: admin@atlaspdks.com / Admin1234!</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  wrap: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  logoBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '700', color: colors.brand, letterSpacing: -0.3 },
  title: { fontSize: 28, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.onSurfaceSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceSecondary, marginBottom: spacing.xs, letterSpacing: 0.3 },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
  },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.md },
  cta: {
    marginTop: spacing.lg, height: 52, borderRadius: radius.md,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
    ...shadow.strong,
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footText: { color: colors.onSurfaceSecondary, fontSize: 14 },
  link: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  hint: {
    marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md,
  },
  hintText: { color: colors.brand, fontSize: 12, fontWeight: '600' },
});

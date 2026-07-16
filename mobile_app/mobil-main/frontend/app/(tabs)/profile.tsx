import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { useAuth } from '@/src/auth';
import { api } from '@/src/api';

type Workplace = { id: number; name: string; latitude: number; longitude: number; radius: number; start_time: string };

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [wp, setWp] = useState<Workplace | null>(null);
  const fullName = `${user?.name || ''} ${user?.surname || ''}`.trim();
  const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    (async () => {
      if (!user?.workplace_id || user.role !== 'admin') return;
      // Referans backend'de /workplaces/ admin gerektiriyor; sadece admin çekebilir.
      try {
        const wps = await api.get<Workplace[]>('/workplaces/');
        setWp(wps.find(w => w.id === user.workplace_id) || null);
      } catch {}
    })();
  }, [user?.workplace_id, user?.role]);

  const doLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="profile-screen">
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.avatarLg}><Text style={styles.avatarLgText}>{initials || 'AY'}</Text></View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.rolePill}><Text style={styles.rolePillText}>{user?.role === 'admin' ? 'Yönetici' : 'Çalışan'}</Text></View>
        </View>

        <View style={styles.list}>
          <Row icon="business" label="İş Yeri" value={wp?.name || 'Atanmamış'} />
          <Row icon="location" label="Konum" value={wp ? `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}` : '—'} />
          <Row icon="navigate" label="İzin verilen yarıçap" value={wp ? `${wp.radius} m` : '—'} />
          <Row icon="time" label="Vardiya başlangıcı" value={wp?.start_time || '—'} />
        </View>

        <Pressable testID="logout-button" onPress={doLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.brand} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  body: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.brandTertiary, borderRadius: radius.lg },
  avatarLg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.strong },
  avatarLgText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.onSurface, marginTop: spacing.md },
  email: { fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  rolePill: { marginTop: spacing.sm, backgroundColor: colors.brand, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  rolePillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: '600' },
  rowValue: { fontSize: 14, color: colors.onSurface, fontWeight: '700', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorBg, borderRadius: radius.md, paddingVertical: 14 },
  logoutText: { color: colors.error, fontWeight: '800', fontSize: 14 },
});

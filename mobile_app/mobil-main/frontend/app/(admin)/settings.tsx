import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/src/theme';
import { api } from '@/src/api';
import { formatHM } from '@/src/format';

type MonthlyRow = { user_id?: number; personel: string; email?: string; calisma_gunu: number; toplam_saat: string; gecikme_dakika: number; gecikme_sayisi?: number; izin_gunu?: number; fazla_mesai?: number; eksik_mesai?: number; fazla_mesai_dakika?: number; eksik_mesai_dakika?: number };
type UserBasic = { id: number; name: string; surname: string; role: string };

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get<MonthlyRow[]>(`/reports/monthly/all?year=${year}&month=${month}`)); }
    catch {} finally { setLoading(false); }
  }, [year, month]);
  useEffect(() => { load(); }, [load]);

  const shift = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m); setYear(y);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="reports-screen">
      <View style={styles.header}>
        <Text style={styles.h1}>Aylık Rapor</Text>
      </View>
      <View style={styles.monthNav}>
        <Pressable testID="prev-month" onPress={() => shift(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.brand} />
        </Pressable>
        <Text style={styles.monthText}>{MONTHS_TR[month - 1]} {year}</Text>
        <Pressable testID="next-month" onPress={() => shift(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.brand} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {loading && <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />}
        {!loading && rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="stats-chart-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Bu ay için veri bulunamadı.</Text>
          </View>
        )}
        {rows.map((r, idx) => (
          <View key={r.user_id ?? `${r.personel}-${idx}`} style={styles.card} testID={`rep-${r.user_id ?? idx}`}>
            <View style={styles.top}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{r.personel.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.personel}</Text>
                {r.email ? <Text style={styles.mail}>{r.email}</Text> : null}
              </View>
              <View style={styles.hoursBadge}>
                <Text style={styles.hoursBadgeText}>{r.toplam_saat}</Text>
              </View>
            </View>
            <View style={styles.metrics}>
              <Cell label="Çalışma Günü" value={String(r.calisma_gunu)} />
              <Cell label="İzin" value={`${r.izin_gunu ?? 0} gün`} />
              <Cell label="Geç" value={`${r.gecikme_sayisi ?? 0}x`} c={colors.error} />
            </View>
            <View style={styles.metrics}>
              <Cell label="Geç Dakika" value={formatHM(r.gecikme_dakika || 0)} c={colors.error} />
              <Cell label="Fazla Mesai" value={formatHM(r.fazla_mesai_dakika ?? r.fazla_mesai ?? 0)} c={colors.success} />
              <Cell label="Eksik Mesai" value={formatHM(r.eksik_mesai_dakika ?? r.eksik_mesai ?? 0)} c={colors.warning} />
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Cell({ label, value, c }: { label: string; value: string; c?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={[styles.cellVal, c ? { color: c } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  h1: { fontSize: 22, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: '800', color: colors.onSurface },
  body: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  name: { fontSize: 14, fontWeight: '800', color: colors.onSurface },
  mail: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  hoursBadge: { backgroundColor: colors.brandTertiary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  hoursBadgeText: { color: colors.brand, fontSize: 13, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cellLabel: { fontSize: 10, color: colors.onSurfaceSecondary, fontWeight: '600' },
  cellVal: { fontSize: 13, color: colors.onSurface, fontWeight: '800', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },
});

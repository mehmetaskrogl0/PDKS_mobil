import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { formatHM, timeOnly, dateShort } from '@/src/format';

type Dash = {
  total_employees: number; total_workplaces: number;
  today_checkins: number; today_checkouts: number; active_employees: number;
  today_absent: number; late_today: number;
  pending_leaves: number; approved_leaves: number; rejected_leaves: number;
  work_statistics: { total_overtime_minutes: number; total_missing_minutes: number; total_late_minutes: number };
  recent_attendance: { name: string; check_in: string; check_out: string | null; late: boolean; late_minutes: number }[];
};

type Chart = { daily_checkins: { date: string; count: number }[]; monthly_late_minutes: number; monthly_overtime_minutes: number };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [d, setD] = useState<Dash | null>(null);
  const [c, setC] = useState<Chart | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dash, chart] = await Promise.all([
        api.get<Dash>('/dashboard/admin'),
        api.get<Chart>('/dashboard/chart'),
      ]);
      setD(dash); setC(chart);
    } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="admin-dashboard">
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Yönetici Paneli</Text>
          <Text style={styles.sub}>Hoşgeldiniz, {user?.name}</Text>
        </View>
        <Pressable testID="admin-logout" onPress={logout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {/* Primary metrics */}
        <View style={styles.metrics}>
          <Metric icon="people" label="Çalışan" value={d?.total_employees ?? 0} color={colors.brand} testID="stat-employees" />
          <Metric icon="pulse" label="Aktif" value={d?.active_employees ?? 0} color={colors.success} testID="stat-active" />
          <Metric icon="alarm" label="Geç" value={d?.late_today ?? 0} color={colors.error} testID="stat-late" />
        </View>
        <View style={styles.metrics}>
          <Metric icon="log-in" label="Bugün Giriş" value={d?.today_checkins ?? 0} color={colors.brand} testID="stat-checkins" />
          <Metric icon="log-out" label="Bugün Çıkış" value={d?.today_checkouts ?? 0} color={colors.brandSecondary} testID="stat-checkouts" />
          <Metric icon="alert-circle" label="Devamsız" value={d?.today_absent ?? 0} color={colors.warning} testID="stat-absent" />
        </View>

        {/* Leaves */}
        <Text style={styles.sectionTitle}>İzin Durumu</Text>
        <View style={styles.metrics}>
          <Metric icon="hourglass" label="Bekleyen" value={d?.pending_leaves ?? 0} color={colors.warning} testID="stat-pending" />
          <Metric icon="checkmark-circle" label="Onaylı" value={d?.approved_leaves ?? 0} color={colors.success} testID="stat-approved" />
          <Metric icon="close-circle" label="Red" value={d?.rejected_leaves ?? 0} color={colors.error} testID="stat-rejected" />
        </View>

        {/* Work Statistics */}
        <Text style={styles.sectionTitle}>Çalışma İstatistikleri</Text>
        <View style={styles.statsCard}>
          <StatLine label="Toplam Fazla Mesai" value={formatHM(d?.work_statistics.total_overtime_minutes || 0)} color={colors.success} />
          <StatLine label="Toplam Eksik Mesai" value={formatHM(d?.work_statistics.total_missing_minutes || 0)} color={colors.warning} />
          <StatLine label="Toplam Geç Kalma" value={formatHM(d?.work_statistics.total_late_minutes || 0)} color={colors.error} />
        </View>

        {/* Chart */}
        {c && c.daily_checkins.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Son 30 Gün Giriş Trendi</Text>
            <View style={styles.chartCard}>
              <MiniChart data={c.daily_checkins} />
              <View style={styles.chartFoot}>
                <Text style={styles.chartFootText}>Aylık geç: <Text style={styles.chartFootBold}>{formatHM(c.monthly_late_minutes)}</Text></Text>
                <Text style={styles.chartFootText}>Fazla: <Text style={styles.chartFootBold}>{formatHM(c.monthly_overtime_minutes)}</Text></Text>
              </View>
            </View>
          </>
        )}

        {/* Recent */}
        <Text style={styles.sectionTitle}>Son Giriş / Çıkışlar</Text>
        <View style={{ gap: spacing.sm }}>
          {(!d || d.recent_attendance.length === 0) && <Text style={styles.empty}>Henüz kayıt yok.</Text>}
          {d?.recent_attendance.slice(0, 10).map((a, i) => (
            <View key={`${a.name}-${a.check_in}-${i}`} style={styles.row} testID={`admin-att-${i}`}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(a.name || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{a.name}</Text>
                <Text style={styles.rowSub}>{dateShort(a.check_in)} · {timeOnly(a.check_in)} → {timeOnly(a.check_out)}</Text>
              </View>
              {a.late ? (
                <View style={styles.lateBadge}><Text style={styles.lateBadgeText}>+{a.late_minutes}dk</Text></View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value, color, testID }: any) {
  return (
    <View style={styles.metric} testID={testID}>
      <View style={[styles.metricIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statLine}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statLineLabel}>{label}</Text>
      <Text style={styles.statLineVal}>{value}</Text>
    </View>
  );
}

function MiniChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <View style={styles.chart}>
      {data.slice(-14).map((d, i) => {
        const h = (d.count / max) * 60;
        return (
          <View key={i} style={styles.chartBarCol}>
            <View style={[styles.chartBar, { height: Math.max(4, h) }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  h1: { fontSize: 22, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg, gap: spacing.md },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start', ...shadow.card },
  metricIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricVal: { fontSize: 22, fontWeight: '800', color: colors.onSurface, marginTop: spacing.sm },
  metricLabel: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm },
  statsCard: { backgroundColor: colors.brandTertiary, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLineLabel: { flex: 1, fontSize: 13, color: colors.onSurface, fontWeight: '600' },
  statLineVal: { fontSize: 13, color: colors.onSurface, fontWeight: '800' },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 68, marginBottom: spacing.sm },
  chartBarCol: { flex: 1, alignItems: 'center', height: 60 },
  chartBar: { width: '100%', backgroundColor: colors.brand, borderRadius: 3, minWidth: 4 },
  chartFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
  chartFootText: { fontSize: 12, color: colors.onSurfaceSecondary },
  chartFootBold: { color: colors.onSurface, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  rowSub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  lateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.errorBg },
  lateBadgeText: { color: '#991B1B', fontSize: 11, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl },
});

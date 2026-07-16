import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/src/theme';
import { api } from '@/src/api';
import { formatHM, timeOnly, dateShort, dayLabel } from '@/src/format';

type Row = { id: string; check_in: string; check_out: string | null; duration: string | null; worked_minutes: number; late: boolean; late_minutes: number; overtime_minutes: number; missing_minutes: number };

export default function History() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get<Row[]>('/attendance/my-attendance'); setRows(r); } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, r) => s + (r.worked_minutes || 0), 0);
  const totalLate = rows.reduce((s, r) => s + (r.late_minutes || 0), 0);
  const totalOvertime = rows.reduce((s, r) => s + (r.overtime_minutes || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="history-screen">
      <View style={styles.header}>
        <Text style={styles.h1}>Geçmiş</Text>
        <Text style={styles.sub}>Tüm mesai kayıtları</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Toplam çalışma</Text>
          <Text style={styles.totalVal}>{formatHM(total)}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalMini}>
              <Ionicons name="alarm" size={12} color={colors.error} />
              <Text style={[styles.totalMiniText, { color: colors.error }]}>Geç: {formatHM(totalLate)}</Text>
            </View>
            <View style={styles.totalMini}>
              <Ionicons name="trending-up" size={12} color={colors.success} />
              <Text style={[styles.totalMiniText, { color: colors.success }]}>Fazla: {formatHM(totalOvertime)}</Text>
            </View>
            <View style={styles.totalMini}>
              <Ionicons name="document-text" size={12} color={colors.brand} />
              <Text style={[styles.totalMiniText, { color: colors.brand }]}>{rows.length} gün</Text>
            </View>
          </View>
        </View>

        {loading && <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />}
        {!loading && rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Henüz kayıt bulunmuyor.</Text>
          </View>
        )}
        {rows.map(r => (
          <View key={r.id} style={styles.row} testID={`history-row-${r.id}`}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{dateShort(r.check_in)}</Text>
              <Text style={styles.dateLabel}>{dayLabel(r.check_in)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.timeRow}>
                <Ionicons name="log-in" size={14} color={colors.brand} />
                <Text style={styles.timeText}>{timeOnly(r.check_in)}</Text>
                <View style={styles.dot} />
                <Ionicons name="log-out" size={14} color={colors.brandSecondary} />
                <Text style={styles.timeText}>{timeOnly(r.check_out)}</Text>
              </View>
              <Text style={styles.dur}>{r.duration || 'Devam ediyor'}</Text>
              <View style={styles.tags}>
                {r.late && r.late_minutes > 0 && (
                  <View style={[styles.tag, { backgroundColor: colors.errorBg }]}>
                    <Text style={[styles.tagText, { color: '#991B1B' }]}>Geç {r.late_minutes}dk</Text>
                  </View>
                )}
                {r.overtime_minutes > 0 && (
                  <View style={[styles.tag, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.tagText, { color: '#065F46' }]}>Fazla {r.overtime_minutes}dk</Text>
                  </View>
                )}
                {r.missing_minutes > 0 && (
                  <View style={[styles.tag, { backgroundColor: colors.warningBg }]}>
                    <Text style={[styles.tagText, { color: '#92400E' }]}>Eksik {r.missing_minutes}dk</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  h1: { fontSize: 24, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  body: { padding: spacing.lg, gap: spacing.sm },
  totalCard: { backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  totalLabel: { fontSize: 12, fontWeight: '700', color: colors.brand },
  totalVal: { fontSize: 32, fontWeight: '800', color: colors.onSurface, marginTop: 4, letterSpacing: -0.6 },
  totalRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' },
  totalMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalMiniText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dateBox: { width: 60, alignItems: 'center' },
  dateDay: { fontSize: 15, fontWeight: '800', color: colors.brand },
  dateLabel: { fontSize: 11, color: colors.onSurfaceSecondary, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  dur: { marginTop: 4, fontSize: 12, color: colors.onSurfaceSecondary, fontWeight: '600' },
  tags: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tagText: { fontSize: 10, fontWeight: '700' },
});

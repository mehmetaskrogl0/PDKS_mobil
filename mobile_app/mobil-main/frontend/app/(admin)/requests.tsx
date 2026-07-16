import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/src/theme';
import { api } from '@/src/api';
import { timeOnly, dateShort } from '@/src/format';

type Leave = { id: number; user_id: number; personel?: string; email?: string; start_date: string; end_date: string; reason: string; status: string; created_at: string; review_note?: string };

export default function AdminLeaves() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rows, setRows] = useState<Leave[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const url = tab === 'pending' ? '/leave/pending' : '/leave/all';
      setRows(await api.get<Leave[]>(url));
    } catch {}
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    if (busy) return;
    setBusy(id);
    try { await api.put(`/leave/${id}/${action}`, { note: null }); await load(); }
    catch {} finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="admin-leaves">
      <View style={styles.header}>
        <Text style={styles.h1}>İzin Talepleri</Text>
      </View>
      <View style={styles.tabs}>
        {(['pending', 'all'] as const).map(t => (
          <Pressable key={t} testID={`ltab-${t}`} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? 'Bekleyen' : 'Tümü'}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Bu durumda talep yok.</Text>
          </View>
        )}
        {rows.map(r => (
          <View key={r.id} style={styles.card} testID={`ad-leave-${r.id}`}>
            <View style={styles.rowHead}>
              <View style={styles.dateRange}>
                <Ionicons name="calendar" size={14} color={colors.brand} />
                <Text style={styles.dates}>{r.start_date} → {r.end_date}</Text>
              </View>
              {statusBadge(r.status)}
            </View>
            <Text style={styles.user}>{r.personel} · {r.email}</Text>
            <Text style={styles.reason}>{r.reason}</Text>
            <Text style={styles.meta}>{dateShort(r.created_at)} · {timeOnly(r.created_at)}</Text>
            {r.status === 'pending' && (
              <View style={styles.actions}>
                <Pressable testID={`ad-reject-${r.id}`} onPress={() => act(r.id, 'reject')} disabled={busy === r.id}
                  style={[styles.rejectBtn, busy === r.id && { opacity: 0.5 }]}>
                  <Ionicons name="close" size={16} color={colors.error} />
                  <Text style={styles.rejectText}>Reddet</Text>
                </Pressable>
                <Pressable testID={`ad-approve-${r.id}`} onPress={() => act(r.id, 'approve')} disabled={busy === r.id}
                  style={[styles.approveBtn, busy === r.id && { opacity: 0.5 }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.approveText}>Onayla</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function statusBadge(status: string) {
  const map: Record<string, { text: string; c: string; bg: string }> = {
    pending: { text: 'Beklemede', c: '#92400E', bg: colors.warningBg },
    approved: { text: 'Onaylandı', c: '#065F46', bg: colors.successBg },
    rejected: { text: 'Reddedildi', c: '#991B1B', bg: colors.errorBg },
  };
  const b = map[status] || map.pending;
  return <View style={[styles.badge, { backgroundColor: b.bg }]}><Text style={[styles.badgeText, { color: b.c }]}>{b.text}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  h1: { fontSize: 22, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tab: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary },
  tabTextActive: { color: '#fff' },
  body: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRange: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dates: { fontSize: 14, fontWeight: '800', color: colors.onSurface },
  user: { fontSize: 12, color: colors.brand, marginTop: 6, fontWeight: '700' },
  reason: { fontSize: 13, color: colors.onSurface, marginTop: 6 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 4, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorBg, borderRadius: radius.md },
  rejectText: { color: colors.error, fontWeight: '700', fontSize: 13 },
  approveBtn: { flex: 1, flexDirection: 'row', gap: 4, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: radius.md },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },
});

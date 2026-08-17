import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api } from '@/src/api';
import { dateShort, timeOnly } from '@/src/format';

type Leave = { id: string; start_date: string; end_date: string; reason: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; review_note?: string };

export default function LeaveTab() {
  const [rows, setRows] = useState<Leave[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await api.get<Leave[]>('/leave/my')); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setErr('');
    if (!startDate || !endDate || !reason.trim()) { setErr('Tüm alanlar zorunlu'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setErr('Tarih formatı: YYYY-AA-GG'); return;
    }
    setBusy(true);
    try {
      await api.post('/leave/', { start_date: startDate, end_date: endDate, reason: reason.trim() });
      setOpen(false); setStartDate(''); setEndDate(''); setReason('');
      await load();
    } catch (e: any) { setErr(e?.message || 'Gönderilemedi'); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="leave-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>İzin Talepleri</Text>
          <Text style={styles.sub}>Onay için yöneticinize gönderilir</Text>
        </View>
        <Pressable testID="open-new-leave" onPress={() => setOpen(true)} style={styles.newBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Henüz izin talebiniz yok.</Text>
          </View>
        )}
        {rows.map(r => (
          <View key={r.id} style={styles.card} testID={`leave-row-${r.id}`}>
            <View style={styles.rowHead}>
              <View style={styles.dateRange}>
                <Ionicons name="calendar" size={16} color={colors.brand} />
                <Text style={styles.dates}>{r.start_date} → {r.end_date}</Text>
              </View>
              {statusBadge(r.status)}
            </View>
            <Text style={styles.reason}>{r.reason}</Text>
            <Text style={styles.meta}>{dateShort(r.created_at)} · {timeOnly(r.created_at)}</Text>
            {r.review_note ? <Text style={styles.note}>Not: {r.review_note}</Text> : null}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet} testID="new-leave-sheet">
            <View style={styles.handle} />
            <Text style={styles.sTitle}>Yeni İzin Talebi</Text>
            <Text style={styles.sSub}>Tarih formatı: YYYY-AA-GG (örn. 2026-08-15)</Text>

            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Başlangıç</Text>
                <TextInput testID="leave-start" value={startDate} onChangeText={setStartDate}
                  placeholder="2026-08-15" style={styles.input} placeholderTextColor={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bitiş</Text>
                <TextInput testID="leave-end" value={endDate} onChangeText={setEndDate}
                  placeholder="2026-08-17" style={styles.input} placeholderTextColor={colors.muted} />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Sebep</Text>
            <TextInput testID="leave-reason" value={reason} onChangeText={setReason}
              placeholder="Örn: Aile ziyareti" multiline
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholderTextColor={colors.muted} />

            {err ? <Text style={styles.err}>{err}</Text> : null}

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
                <Text style={styles.cancelText}>İptal</Text>
              </Pressable>
              <Pressable testID="leave-submit" onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: 0.6 }]}>
                <Text style={styles.submitText}>{busy ? 'Gönderiliyor…' : 'Gönder'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.divider },
  h1: { fontSize: 24, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.onSurfaceSecondary, marginTop: 2 },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.strong },
  body: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRange: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dates: { fontSize: 14, fontWeight: '800', color: colors.onSurface },
  reason: { fontSize: 13, color: colors.onSurface, marginTop: 6 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  note: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 4, fontStyle: 'italic' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  sTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
  sSub: { fontSize: 12, color: colors.onSurfaceSecondary, marginBottom: spacing.md, marginTop: 4 },
  rowGap: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6 },
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: 14, color: colors.onSurface, backgroundColor: colors.surfaceSecondary },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
  cancel: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  cancelText: { color: colors.onSurfaceSecondary, fontWeight: '700' },
  submit: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  submitText: { color: '#fff', fontWeight: '700' },
});

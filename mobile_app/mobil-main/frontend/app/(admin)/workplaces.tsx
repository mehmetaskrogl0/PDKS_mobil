import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api } from '@/src/api';

type WP = { id: number; name: string; latitude: number; longitude: number; radius: number; start_time: string };

export default function Workplaces() {
  const [rows, setRows] = useState<WP[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<WP | null>(null);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radius: '150', start_time: '09:00' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await api.get<WP[]>('/workplaces/')); } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEdit(null);
    setForm({ name: '', latitude: '', longitude: '', radius: '150', start_time: '09:00' });
    setErr(''); setOpen(true);
  };
  const openEdit = (w: WP) => {
    setEdit(w);
    setForm({ name: w.name, latitude: String(w.latitude), longitude: String(w.longitude), radius: String(w.radius), start_time: w.start_time });
    setErr(''); setOpen(true);
  };

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radius: parseInt(form.radius, 10),
        start_time: form.start_time.trim() || '09:00',
      };
      if (!body.name || isNaN(body.latitude) || isNaN(body.longitude) || !body.radius) {
        setErr('Tüm alanlar geçerli olmalı'); setBusy(false); return;
      }
      if (edit) await api.put(`/workplaces/${edit.id}`, body);
      else await api.post('/workplaces/', body);
      setOpen(false); await load();
    } catch (e: any) { setErr(e?.message || 'Kaydedilemedi'); }
    finally { setBusy(false); }
  };

  const del = async (w: WP) => {
    if (!confirm(`${w.name} silinsin mi?`)) return;
    try { await api.del(`/workplaces/${w.id}`); await load(); } catch (e: any) { alert(e?.message || 'Silinemedi'); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="workplaces-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>İşyerleri</Text>
          <Text style={styles.sub}>{rows.length} işyeri</Text>
        </View>
        <Pressable testID="new-workplace" onPress={openNew} style={styles.newBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {rows.map(w => (
          <View key={w.id} style={styles.card} testID={`wp-row-${w.id}`}>
            <View style={styles.wpIcon}><Ionicons name="business" size={20} color={colors.brand} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wpName}>{w.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{w.latitude.toFixed(4)}, {w.longitude.toFixed(4)}</Text>
              </View>
              <View style={styles.pills}>
                <View style={[styles.pill, { backgroundColor: colors.brandTertiary }]}>
                  <Ionicons name="navigate" size={10} color={colors.brand} />
                  <Text style={[styles.pillText, { color: colors.brand }]}>{w.radius}m</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: colors.warningBg }]}>
                  <Ionicons name="time" size={10} color="#92400E" />
                  <Text style={[styles.pillText, { color: '#92400E' }]}>{w.start_time}</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Pressable testID={`edit-wp-${w.id}`} onPress={() => openEdit(w)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={14} color={colors.brand} />
              </Pressable>
              <Pressable testID={`del-wp-${w.id}`} onPress={() => del(w)} style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}>
                <Ionicons name="trash" size={14} color={colors.error} />
              </Pressable>
            </View>
          </View>
        ))}
        {rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Henüz işyeri eklenmemiş.</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sTitle}>{edit ? 'İşyeri Düzenle' : 'Yeni İşyeri'}</Text>
              <Text style={styles.label}>Ad</Text>
              <TextInput testID="wp-name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Kale Kapı Ofis" style={styles.input} placeholderTextColor={colors.muted} />
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Enlem</Text>
                  <TextInput testID="wp-lat" value={form.latitude} onChangeText={v => setForm({ ...form, latitude: v })} keyboardType="numeric" placeholder="41.0082" style={styles.input} placeholderTextColor={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Boylam</Text>
                  <TextInput testID="wp-lng" value={form.longitude} onChangeText={v => setForm({ ...form, longitude: v })} keyboardType="numeric" placeholder="28.9784" style={styles.input} placeholderTextColor={colors.muted} />
                </View>
              </View>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Yarıçap (m)</Text>
                  <TextInput testID="wp-radius" value={form.radius} onChangeText={v => setForm({ ...form, radius: v })} keyboardType="numeric" style={styles.input} placeholderTextColor={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Vardiya başlangıç</Text>
                  <TextInput testID="wp-start" value={form.start_time} onChangeText={v => setForm({ ...form, start_time: v })} placeholder="09:00" style={styles.input} placeholderTextColor={colors.muted} />
                </View>
              </View>
              {err ? <Text style={styles.err}>{err}</Text> : null}
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                <Pressable onPress={() => setOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>İptal</Text></Pressable>
                <Pressable testID="wp-submit" onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: 0.6 }]}>
                  <Text style={styles.submitText}>{busy ? '...' : edit ? 'Güncelle' : 'Oluştur'}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.divider },
  h1: { fontSize: 22, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  newBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.strong },
  body: { padding: spacing.lg, gap: spacing.sm },
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  wpIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  wpName: { fontSize: 14, fontWeight: '800', color: colors.onSurface },
  metaRow: { marginTop: 2 },
  meta: { fontSize: 12, color: colors.onSurfaceSecondary },
  pills: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 10, fontWeight: '800' },
  actionBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  sTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: spacing.md },
  rowGap: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6 },
  input: { height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: 14, color: colors.onSurface, backgroundColor: colors.surfaceSecondary },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
  cancel: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  cancelText: { color: colors.onSurfaceSecondary, fontWeight: '700' },
  submit: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  submitText: { color: '#fff', fontWeight: '700' },
});

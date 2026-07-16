import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api } from '@/src/api';

type Emp = { id: number; name: string; surname: string; email: string; role: string; workplace_id: number | null };
type EmpEnriched = Emp & { workplace_name: string | null; active: boolean };
type Workplace = { id: number; name: string };
type ActiveRec = { personel: string; email: string; check_in: string };

export default function Employees() {
  const [rows, setRows] = useState<EmpEnriched[]>([]);
  const [wps, setWps] = useState<Workplace[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Emp | null>(null);
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '', role: 'employee' as 'employee' | 'admin', workplace_id: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [emps, w, active] = await Promise.all([
        api.get<Emp[]>('/users/'),
        api.get<Workplace[]>('/workplaces/'),
        api.get<ActiveRec[]>('/attendance/active').catch(() => []),
      ]);
      const wpMap = Object.fromEntries(w.map(x => [x.id, x.name]));
      const activeEmails = new Set(active.map(a => a.email));
      setRows(emps.map(e => ({
        ...e,
        workplace_name: e.workplace_id ? (wpMap[e.workplace_id] || null) : null,
        active: activeEmails.has(e.email),
      })));
      setWps(w);
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditEmp(null);
    setForm({ name: '', surname: '', email: '', password: '', role: 'employee', workplace_id: wps[0]?.id || 0 });
    setErr(''); setModalOpen(true);
  };
  const openEdit = (e: Emp) => {
    setEditEmp(e);
    setForm({ name: e.name, surname: e.surname, email: e.email, password: '', role: e.role as any, workplace_id: e.workplace_id || 0 });
    setErr(''); setModalOpen(true);
  };

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      if (editEmp) {
        const body: any = { name: form.name, surname: form.surname, email: form.email, role: form.role, workplace_id: form.workplace_id || null };
        if (form.password) body.password = form.password;
        await api.put(`/users/${editEmp.id}`, body);
      } else {
        if (!form.password || form.password.length < 6) { setErr('Şifre en az 6 karakter'); setBusy(false); return; }
        await api.post('/users/', { ...form, workplace_id: form.workplace_id || null });
      }
      setModalOpen(false);
      await load();
    } catch (e: any) { setErr(e?.message || 'Kaydedilemedi'); }
    finally { setBusy(false); }
  };

  const del = async (e: Emp) => {
    if (!confirm(`${e.name} ${e.surname} silinsin mi?`)) return;
    try { await api.del(`/users/${e.id}`); await load(); } catch (er: any) { alert(er?.message || 'Silinemedi'); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="employees-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Çalışanlar</Text>
          <Text style={styles.sub}>{rows.length} kayıt</Text>
        </View>
        <Pressable testID="new-employee" onPress={openCreate} style={styles.newBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.brand} />}>
        {rows.map(e => {
          const full = `${e.name} ${e.surname}`.trim();
          return (
            <View key={e.id} style={styles.row} testID={`emp-row-${e.id}`}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{full.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{full}</Text>
                  {e.role === 'admin' && <View style={styles.adminPill}><Text style={styles.adminPillText}>Admin</Text></View>}
                </View>
                <Text style={styles.email}>{e.email}</Text>
                {e.workplace_name && <Text style={styles.wp}><Ionicons name="business" size={10} /> {e.workplace_name}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.pill, { backgroundColor: e.active ? colors.successBg : colors.divider }]}>
                  <View style={[styles.dot, { backgroundColor: e.active ? colors.success : colors.muted }]} />
                  <Text style={[styles.pillText, { color: e.active ? '#065F46' : colors.muted }]}>{e.active ? 'İşte' : 'Dışarıda'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Pressable testID={`edit-${e.id}`} onPress={() => openEdit(e)} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={13} color={colors.brand} />
                  </Pressable>
                  <Pressable testID={`del-${e.id}`} onPress={() => del(e)} style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}>
                    <Ionicons name="trash" size={13} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
        {rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>Henüz çalışan yok.</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.backdrop}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sTitle}>{editEmp ? 'Çalışan Düzenle' : 'Yeni Çalışan'}</Text>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Ad</Text>
                  <TextInput testID="emp-name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} style={styles.input} placeholderTextColor={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Soyad</Text>
                  <TextInput testID="emp-surname" value={form.surname} onChangeText={v => setForm({ ...form, surname: v })} style={styles.input} placeholderTextColor={colors.muted} />
                </View>
              </View>
              <Text style={[styles.label, { marginTop: spacing.md }]}>E-posta</Text>
              <TextInput testID="emp-email" value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholderTextColor={colors.muted} />
              <Text style={[styles.label, { marginTop: spacing.md }]}>Şifre {editEmp ? '(değiştirmek için doldurun)' : ''}</Text>
              <TextInput testID="emp-password" value={form.password} onChangeText={v => setForm({ ...form, password: v })} secureTextEntry style={styles.input} placeholderTextColor={colors.muted} />

              <Text style={[styles.label, { marginTop: spacing.md }]}>Rol</Text>
              <View style={styles.roleRow}>
                {(['employee', 'admin'] as const).map(r => (
                  <Pressable key={r} testID={`role-${r}`} onPress={() => setForm({ ...form, role: r })} style={[styles.roleChip, form.role === r && styles.roleActive]}>
                    <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>{r === 'admin' ? 'Yönetici' : 'Çalışan'}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: spacing.md }]}>İşyeri</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
                {wps.map(w => (
                  <Pressable key={w.id} onPress={() => setForm({ ...form, workplace_id: w.id })} testID={`wp-${w.id}`}
                    style={[styles.wpChip, form.workplace_id === w.id && styles.wpChipActive]}>
                    <Text style={[styles.wpChipText, form.workplace_id === w.id && styles.wpChipTextActive]}>{w.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {err ? <Text style={styles.err}>{err}</Text> : null}

              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                <Pressable onPress={() => setModalOpen(false)} style={styles.cancel}>
                  <Text style={styles.cancelText}>İptal</Text>
                </Pressable>
                <Pressable testID="emp-submit" onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: 0.6 }]}>
                  <Text style={styles.submitText}>{busy ? '...' : editEmp ? 'Güncelle' : 'Oluştur'}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  email: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  wp: { fontSize: 11, color: colors.brand, marginTop: 2, fontWeight: '600' },
  adminPill: { backgroundColor: colors.brand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  adminPillText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  pillText: { fontSize: 10, fontWeight: '700' },
  actionBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  sTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface, marginBottom: spacing.md },
  rowGap: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6 },
  input: { height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: 14, color: colors.onSurface, backgroundColor: colors.surfaceSecondary },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleChip: { flex: 1, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  roleActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  roleText: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary },
  roleTextActive: { color: '#fff' },
  wpChip: { paddingHorizontal: 14, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  wpChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  wpChipText: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary },
  wpChipTextActive: { color: '#fff' },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
  cancel: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  cancelText: { color: colors.onSurfaceSecondary, fontWeight: '700' },
  submit: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  submitText: { color: '#fff', fontWeight: '700' },
});

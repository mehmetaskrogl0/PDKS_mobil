import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';

import { colors, spacing, radius, shadow } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/auth';
import { formatHM, timeOnly } from '@/src/format';

type Workplace = { id: number; name: string; latitude: number; longitude: number; radius: number; start_time: string };
type Dash = { user: string; status: string; check_in: string | null; check_out: string | null; late: boolean; late_minutes: number; overtime_minutes: number; missing_minutes: number; approved_leave_count: number };
type Att = { id: number; check_in: string; check_out: string | null; duration: string | null; late: boolean; late_minutes: number; overtime_minutes: number; missing_minutes: number };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [wp, setWp] = useState<Workplace | null>(null);
  const [dash, setDash] = useState<Dash | null>(null);
  const [recent, setRecent] = useState<Att[]>([]);
  const [todayMin, setTodayMin] = useState(0);
  const [weekMin, setWeekMin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [gpsMeters, setGpsMeters] = useState<number | null>(null);
  const [gpsMsg, setGpsMsg] = useState('');
  const [punching, setPunching] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([
        api.get<Dash>('/dashboard/'),
        api.get<Att[]>('/attendance/my-attendance'),
      ]);
      setDash(d);
      // Sort recent by check_in desc
      const sorted = [...r].sort((a, b) => (a.check_in < b.check_in ? 1 : -1));
      setRecent(sorted.slice(0, 6));
      // Compute today/week minutes locally
      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(dayStart);
      const dow = weekStart.getDay(); const daysFromMon = dow === 0 ? 6 : dow - 1;
      weekStart.setDate(weekStart.getDate() - daysFromMon);
      let today = 0, week = 0;
      for (const a of r) {
        const ci = new Date(a.check_in);
        const co = a.check_out ? new Date(a.check_out) : now;
        const mins = Math.max(0, Math.floor((co.getTime() - ci.getTime()) / 60000));
        if (ci >= dayStart) today += mins;
        if (ci >= weekStart) week += mins;
      }
      setTodayMin(today); setWeekMin(week);
    } catch (e) { /* ignore */ }
    // Load workplace if user has one (workplaces list is admin-only in ref;
    // fall back to just showing name from dash for employees).
    if (user?.role === 'admin' && user.workplace_id) {
      try {
        const wps = await api.get<Workplace[]>('/workplaces/');
        setWp(wps.find(w => w.id === user.workplace_id) || null);
      } catch {}
    }
    setLoading(false);
  }, [user?.role, user?.workplace_id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const acquireLocation = async () => {
    setGpsStatus('checking'); setGpsMsg('');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsStatus('error'); setGpsMsg('Konum izni reddedildi. Ayarlardan izin verin.');
      return null;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsMeters(Math.round(loc.coords.accuracy || 0)); setGpsStatus('ok');
      return loc.coords;
    } catch {
      setGpsStatus('error'); setGpsMsg('GPS sinyali alınamadı.');
      return null;
    }
  };

  const doPunch = async (mode: 'in' | 'out') => {
    if (punching) return;
    setPunching(true);
    try {
      const coords = await acquireLocation();
      if (!coords) { setPunching(false); return; }
      // Ref backend expects {latitude, longitude}
      const body = { latitude: coords.latitude, longitude: coords.longitude };
      if (mode === 'in') await api.post('/attendance/check-in', body);
      else await api.post('/attendance/check-out', body);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    } catch (e: any) {
      setGpsStatus('error'); setGpsMsg(e?.message || 'İşlem başarısız');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setPunching(false); }
  };

  if (loading) {
    return <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.brand} /></View>
    </SafeAreaView>;
  }

  const isIn = dash?.status === 'Çalışıyor';
  const fullName = `${user?.name || ''} ${user?.surname || ''}`.trim();
  const initials = fullName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="employee-dashboard">
      <ScrollView contentContainerStyle={styles.wrap}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}><Ionicons name="business" size={18} color={colors.brand} /></View>
            <Text style={styles.brandName}>Atlas PDKS</Text>
          </View>
          <Pressable testID="user-chip" onPress={logout} style={styles.userChip}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'AY'}</Text></View>
            <View>
              <Text style={styles.userName} numberOfLines={1}>{fullName || 'Kullanıcı'}</Text>
              <Text style={styles.userRole}>Çalışan</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.greetCard} testID="greeting-card">
          <Text style={styles.greetHi}>Hoşgeldiniz, {user?.name || ''}</Text>
          <Text style={styles.greetShift}>{wp?.name || 'İşyeri atanmamış'} · Vardiya {wp?.start_time || '09:00'} itibaren</Text>
          <View style={styles.greetPills}>
            <View style={[styles.pillMini, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark-circle" size={12} color="#065F46" />
              <Text style={[styles.pillMiniText, { color: '#065F46' }]}>{dash?.approved_leave_count || 0} onaylı izin</Text>
            </View>
            <View style={[styles.pillMini, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="information-circle" size={12} color={colors.brand} />
              <Text style={[styles.pillMiniText, { color: colors.brand }]}>{dash?.status || 'Bilinmiyor'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.punchWrap}>
          <View style={styles.punchOuter}>
            <Pressable
              testID={isIn ? 'punch-out-button' : 'punch-in-button'}
              onPress={() => doPunch(isIn ? 'out' : 'in')}
              disabled={punching}
              style={({ pressed }) => [styles.punchInner, isIn && styles.punchInnerOut, (pressed || punching) && { transform: [{ scale: 0.97 }] }]}>
              <Text style={styles.punchTitle}>{punching ? '...' : isIn ? 'Çıkış Yap' : 'Giriş Yap'}</Text>
              <Text style={styles.punchSub}>Konum kaydı ile</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chipsRow}>
          <Pressable testID="quick-in" onPress={() => !isIn && doPunch('in')} disabled={isIn || punching}
            style={[styles.chip, !isIn && styles.chipActive]}>
            <Ionicons name="log-in-outline" size={16} color={!isIn ? '#fff' : colors.onSurfaceSecondary} />
            <Text style={[styles.chipText, !isIn && styles.chipTextActive]}>Giriş</Text>
          </Pressable>
          <Pressable testID="quick-out" onPress={() => isIn && doPunch('out')} disabled={!isIn || punching}
            style={[styles.chip, isIn && styles.chipActiveOut]}>
            <Ionicons name="log-out-outline" size={16} color={isIn ? '#fff' : colors.onSurfaceSecondary} />
            <Text style={[styles.chipText, isIn && styles.chipTextActive]}>Çıkış</Text>
          </Pressable>
        </View>

        <View style={styles.lastRow}>
          <View style={styles.lastCell}>
            <Ionicons name="location" size={14} color={colors.brand} />
            <Text style={styles.lastText} numberOfLines={1}>
              Son kayıt: {timeOnly(dash?.check_in)} · {wp?.name || 'İş yeri'}
            </Text>
          </View>
          <View style={styles.lastCell}>
            <Ionicons name="navigate" size={14} color={colors.brand} />
            <Text style={styles.lastText}>GPS: {gpsMeters !== null ? `${gpsMeters}m` : '—'}</Text>
          </View>
        </View>

        {gpsStatus === 'error' && !!gpsMsg && (
          <View style={styles.warn} testID="gps-warning">
            <Ionicons name="warning" size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>Konum doğrulanamadı</Text>
              <Text style={styles.warnMsg}>{gpsMsg}</Text>
            </View>
          </View>
        )}

        {/* Late banner */}
        {dash?.late && dash.late_minutes > 0 && (
          <View style={styles.lateBanner} testID="late-banner">
            <Ionicons name="alarm" size={18} color={colors.error} />
            <Text style={styles.lateBannerText}>Bugün {dash.late_minutes} dk geç geldiniz</Text>
          </View>
        )}

        <View style={styles.statsWrap} testID="stats-container">
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Bugün</Text>
            <Text style={styles.statVal}>{formatHM(todayMin)}</Text>
            <Text style={styles.statHint}>Toplam çalışma</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Hafta</Text>
            <Text style={styles.statVal}>{formatHM(weekMin)}</Text>
            <Text style={styles.statHint}>Bu hafta</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Vardiya</Text>
            <Text style={styles.statVal}>8s</Text>
            <Text style={styles.statHint}>Planlanan</Text>
          </View>
        </View>

        {/* Late / Overtime / Missing summary if last shift closed */}
        {dash && dash.check_out && (
          <View style={styles.dashRow}>
            <View style={[styles.dashBox, { backgroundColor: colors.errorBg }]}>
              <Text style={[styles.dashLabel, { color: '#991B1B' }]}>Geç</Text>
              <Text style={[styles.dashVal, { color: '#991B1B' }]}>{formatHM(dash.late_minutes)}</Text>
            </View>
            <View style={[styles.dashBox, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.dashLabel, { color: '#065F46' }]}>Fazla</Text>
              <Text style={[styles.dashVal, { color: '#065F46' }]}>{formatHM(dash.overtime_minutes)}</Text>
            </View>
            <View style={[styles.dashBox, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.dashLabel, { color: '#92400E' }]}>Eksik</Text>
              <Text style={[styles.dashVal, { color: '#92400E' }]}>{formatHM(dash.missing_minutes)}</Text>
            </View>
          </View>
        )}

        <View style={styles.recentHead}>
          <Text style={styles.sectionTitle}>Son Hareketler</Text>
        </View>
        <View style={styles.recentList}>
          {recent.length === 0 && (
            <Text style={styles.emptyText}>Henüz hareket kaydı yok.</Text>
          )}
          {recent.map(a => <RecentRow key={a.id} a={a} wp={wp?.name} />)}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RecentRow({ a, wp }: { a: Att; wp?: string }) {
  const closed = !!a.check_out;
  return (
    <View style={styles.row} testID={`recent-row-${a.id}`}>
      <View style={[styles.rowIcon, { backgroundColor: colors.brandTertiary }]}>
        <Ionicons name={closed ? 'log-out' : 'log-in'} size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{closed ? 'Mesai' : 'Giriş'} · {wp || ''}</Text>
        <Text style={styles.rowSub}>
          {timeOnly(a.check_in)}{closed ? ` → ${timeOnly(a.check_out)}` : ''}
          {a.duration ? ` · ${a.duration}` : ''}
        </Text>
      </View>
      {a.late ? (
        <View style={[styles.badge, { backgroundColor: colors.errorBg }]}>
          <Text style={[styles.badgeText, { color: '#991B1B' }]}>+{a.late_minutes}dk</Text>
        </View>
      ) : closed && a.overtime_minutes > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.successBg }]}>
          <Text style={[styles.badgeText, { color: '#065F46' }]}>+{a.overtime_minutes}dk</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoBadge: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 15, fontWeight: '700', color: colors.brand },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSecondary, paddingLeft: 4, paddingRight: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  userName: { fontSize: 12, fontWeight: '700', color: colors.onSurface, maxWidth: 96 },
  userRole: { fontSize: 10, color: colors.brand, fontWeight: '600' },

  greetCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  greetHi: { fontSize: 16, fontWeight: '800', color: colors.onSurface },
  greetShift: { marginTop: 4, fontSize: 13, color: colors.onSurfaceSecondary },
  greetPills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  pillMini: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  pillMiniText: { fontSize: 11, fontWeight: '700' },

  punchWrap: { alignItems: 'center', marginTop: spacing.xl },
  punchOuter: { width: 190, height: 190, borderRadius: 95, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  punchInner: { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.strong },
  punchInnerOut: { backgroundColor: colors.brandSecondary },
  punchTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  punchSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },

  chipsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, height: 42, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipActiveOut: { backgroundColor: colors.brandSecondary, borderColor: colors.brandSecondary },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.onSurfaceSecondary },
  chipTextActive: { color: '#fff' },

  lastRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap' },
  lastCell: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  lastText: { fontSize: 12, color: colors.onSurfaceSecondary, flexShrink: 1 },

  warn: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.warningBg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.warning },
  warnTitle: { color: '#92400E', fontWeight: '700', fontSize: 13 },
  warnMsg: { color: '#92400E', fontSize: 12, marginTop: 2 },

  lateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorBg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.error },
  lateBannerText: { color: '#991B1B', fontWeight: '700', fontSize: 13 },

  statsWrap: { flexDirection: 'row', backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, alignItems: 'stretch' },
  statCol: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, backgroundColor: 'rgba(46,91,255,0.15)', marginHorizontal: 2 },
  statLabel: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  statVal: { color: colors.onSurface, fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  statHint: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 2 },

  dashRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  dashBox: { flex: 1, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  dashLabel: { fontSize: 11, fontWeight: '700' },
  dashVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },

  recentHead: { marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.onSurface },
  recentList: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  rowSub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.muted, paddingVertical: spacing.lg },
});

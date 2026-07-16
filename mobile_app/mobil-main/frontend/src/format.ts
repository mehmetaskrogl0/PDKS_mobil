export function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0 && mm > 0) return `${h}s ${mm}dk`;
  if (h > 0) return `${h}s`;
  return `${mm}dk`;
}

export function timeOnly(iso: string | null | undefined): string {
  if (!iso) return '--:--';
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--:--';
  }
}

export function dateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mo}`;
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[d.getDay()];
}

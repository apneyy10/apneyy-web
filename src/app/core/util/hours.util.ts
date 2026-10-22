import { OpeningHours, Weekday } from '../models/directory.model';

export const WEEKDAYS: readonly { key: Weekday; short: string; label: string; schema: string }[] = [
  { key: 'monday', short: 'Mon', label: 'Monday', schema: 'Monday' },
  { key: 'tuesday', short: 'Tue', label: 'Tuesday', schema: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday', schema: 'Wednesday' },
  { key: 'thursday', short: 'Thu', label: 'Thursday', schema: 'Thursday' },
  { key: 'friday', short: 'Fri', label: 'Friday', schema: 'Friday' },
  { key: 'saturday', short: 'Sat', label: 'Saturday', schema: 'Saturday' },
  { key: 'sunday', short: 'Sun', label: 'Sunday', schema: 'Sunday' },
];

/** Weekday and HH:mm right now in the business's own timezone. */
export function localNow(timezone: string, now = new Date()): { day: Weekday; hhmm: string } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  }
  const day = (parts.find(p => p.type === 'weekday')?.value.toLowerCase() ?? 'monday') as Weekday;
  const hhmm = `${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}`;
  return { day, hhmm };
}

function inRange(hhmm: string, open: string, close: string): boolean {
  return close > open ? hhmm >= open && hhmm < close : hhmm >= open || hhmm < close;
}

/** true/false when hours are known, null when the business didn't share them. */
export function isOpenNow(hours: OpeningHours | null | undefined, timezone: string, now = new Date()): boolean | null {
  if (!hours) return null;
  const { day, hhmm } = localNow(timezone, now);
  const today = hours[day];
  if (today?.isOpen && today.ranges.some(r => inRange(hhmm, r.open, r.close))) return true;
  // Still open from last night's late shift?
  const idx = WEEKDAYS.findIndex(d => d.key === day);
  const yesterday = hours[WEEKDAYS[(idx + 6) % 7].key];
  if (yesterday?.isOpen && yesterday.ranges.some(r => r.close < r.open && hhmm < r.close)) return true;
  return false;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  if (h === 0 && m === 0) return 'Midnight';
  const suffix = h >= 12 && h < 24 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
}

export function formatRanges(ranges: { open: string; close: string }[]): string {
  return ranges.map(r => `${formatTime(r.open)} – ${formatTime(r.close)}`).join(', ');
}

/** "Closes 10pm", "Opens 11:30am", "Opens Tue 11am". */
export function statusLine(hours: OpeningHours | null | undefined, timezone: string, now = new Date()): string {
  if (!hours) return '';
  const { day, hhmm } = localNow(timezone, now);
  const idx = WEEKDAYS.findIndex(d => d.key === day);
  const today = hours[day];
  if (today?.isOpen) {
    const current = today.ranges.find(r => inRange(hhmm, r.open, r.close));
    if (current) return `Closes ${formatTime(current.close)}`;
    const later = today.ranges.filter(r => r.open > hhmm).sort((a, b) => a.open.localeCompare(b.open))[0];
    if (later) return `Opens ${formatTime(later.open)}`;
  }
  for (let i = 1; i <= 7; i++) {
    const d = WEEKDAYS[(idx + i) % 7];
    const h = hours[d.key];
    if (h?.isOpen && h.ranges.length) {
      const first = [...h.ranges].sort((a, b) => a.open.localeCompare(b.open))[0];
      return `Opens ${i === 1 ? 'tomorrow' : d.short} ${formatTime(first.open)}`;
    }
  }
  return '';
}

export function todayKey(timezone: string): Weekday {
  return localNow(timezone).day;
}

export function getIsoWeek(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

export function getDayOfWeek(date: Date = new Date()): number {
  const dow = date.getDay();
  return dow === 0 ? 7 : dow;
}

export function todayStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthPrefixOf(date: Date = new Date()): string {
  return todayStr(date).slice(0, 7);
}

export function labelOfDate(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return '今天';

  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === todayStr(y)) return '昨天';

  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** 距离某个日期还有几天：负数表示已过期 */
export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  const target = new Date(y, m - 1, d);
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

/** 取件倒计时的中文说法 */
export function countdownLabel(dateStr: string, from: Date = new Date()): string {
  const n = daysUntil(dateStr, from);
  if (Number.isNaN(n)) return '';
  if (n < 0) return `已过期 ${-n} 天`;
  if (n === 0) return '今天到期';
  if (n === 1) return '明天到期';
  return `还有 ${n} 天`;
}
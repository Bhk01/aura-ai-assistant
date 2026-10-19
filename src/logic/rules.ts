// Business rules: expected return = sent date + contract business days; late only after expected date.
export const DEFAULT_WEEKEND = [0, 6]; // Sunday, Saturday

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addBusinessDays(from: Date, days: number, weekend = DEFAULT_WEEKEND) {
  const d = startOfDay(from);
  const step = days >= 0 ? 1 : -1;
  let left = Math.abs(days);
  while (left > 0) {
    d.setDate(d.getDate() + step);
    if (!weekend.includes(d.getDay())) left--;
  }
  return d;
}

export function businessDaysBetween(a: Date, b: Date, weekend = DEFAULT_WEEKEND) {
  const start = startOfDay(a),
    end = startOfDay(b);
  const sign = end >= start ? 1 : -1;
  const d = new Date(start);
  let n = 0;
  while (sign > 0 ? d < end : d > end) {
    d.setDate(d.getDate() + sign);
    if (!weekend.includes(d.getDay())) n += sign;
  }
  return n;
}

export function expectedReturn(sent: Date, deadlineDays: number, weekend = DEFAULT_WEEKEND) {
  return addBusinessDays(sent, deadlineDays, weekend);
}

export function isLate(expected: Date, today = new Date()) {
  return startOfDay(today) > startOfDay(expected);
}

export function contractWarning(expiry: Date, today = new Date()) {
  const days = Math.round((startOfDay(expiry).getTime() - startOfDay(today).getTime()) / 86400000);
  return days >= 0 && days <= 30;
}

export function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function formatTND(amount: number) {
  return `${amount.toFixed(3)} TND`;
}

/** Critical departments first, then most days late (negative = days left). */
export function sortAway<T extends { critical: boolean; daysLate: number }>(items: T[]) {
  return [...items].sort(
    (a, b) => Number(b.critical) - Number(a.critical) || b.daysLate - a.daysLate,
  );
}

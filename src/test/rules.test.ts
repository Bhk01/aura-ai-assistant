import { describe, expect, it } from 'vitest';
import { addBusinessDays, expectedReturn, isLate, sortAway, contractWarning, formatDate, formatTND } from '@/logic/rules';
import { createDemoData } from '@/logic/demo-data';
import { awayList } from '@/logic/store';

describe('business rules', () => {
  it('expected return skips weekends (Fri + 5 business days = next Fri)', () => {
    expect(formatDate(expectedReturn(new Date(2026, 9, 16), 5))).toBe('23/10/2026');
  });
  it('is late only when today is after the expected date', () => {
    const expected = new Date(2026, 9, 16);
    expect(isLate(expected, new Date(2026, 9, 16, 18))).toBe(false);
    expect(isLate(expected, new Date(2026, 9, 17))).toBe(true);
  });
  it('sorts critical departments first, then most days late', () => {
    const sorted = sortAway([{ critical: false, daysLate: 9 }, { critical: true, daysLate: 1 }, { critical: true, daysLate: 4 }]);
    expect(sorted.map(s => s.daysLate)).toEqual([4, 1, 9]);
  });
  it('contract warning starts 30 days before expiry', () => {
    expect(contractWarning(new Date(2026, 10, 15), new Date(2026, 9, 16))).toBe(true);
    expect(contractWarning(new Date(2026, 10, 20), new Date(2026, 9, 16))).toBe(false);
  });
  it('shows TND with 3 decimals', () => { expect(formatTND(12.5)).toBe('12.500 TND'); });
  it('weekday addition', () => { expect(addBusinessDays(new Date(2026, 9, 12), 1).getDate()).toBe(13); });
});

describe('demo data', () => {
  const today = new Date(2026, 9, 14);
  const data = createDemoData(today);
  const away = awayList(data.devices, data.companies, today);
  it('has 40 devices, 3 companies, 3 papers, 5 away', () => {
    expect([data.devices.length, data.companies.length, data.papers.length, away.length]).toEqual([40, 3, 3, 5]);
  });
  it('has exactly 2 late devices, one in Emergency', () => {
    const late = away.filter(a => a.late);
    expect(late.length).toBe(2);
    expect(late.filter(a => a.device.departmentId === 'urg').length).toBe(1);
  });
  it('contracts are 5, 7 and 10 business days', () => { expect(data.companies.map(c => c.deadlineDays)).toEqual([5, 7, 10]); });
});

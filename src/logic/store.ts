import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDemoData, departments, type Company, type Device, type Paper } from './demo-data';
import { mergeImported } from './csv-import';
import { businessDaysBetween, expectedReturn, isLate, sortAway } from './rules';

type State = ReturnType<typeof createDemoData> & {
  markReturned: (id: string) => void;
  undoReturned: (id: string) => void;
  send: (id: string, companyId: string, problem: string) => void;
  importDevices: (records: Device[]) => void;
  resetDemo: () => void;
};

export const useStore = create<State>()(persist(set => ({
  ...createDemoData(),
  markReturned: id => set(s => ({ devices: s.devices.map(d => d.id === id ? { ...d, status: 'service', returnedDate: new Date().toISOString() } : d), papers: [...s.papers, { id: `p${Date.now()}`, kind: 'reception', deviceId: id, companyId: s.devices.find(d => d.id === id)?.companyId ?? '', date: new Date().toISOString() }] })),
  undoReturned: id => set(s => ({ devices: s.devices.map(d => d.id === id ? { ...d, status: 'away', returnedDate: undefined } : d), papers: s.papers.filter(p => !(p.deviceId === id && p.kind === 'reception' && Date.now() - new Date(p.date).getTime() < 60000)) })),
  send: (id, companyId, problem) => set(s => ({ devices: s.devices.map(d => d.id === id ? { ...d, status: 'away', companyId, problem, sentDate: new Date().toISOString(), returnedDate: undefined } : d), papers: [...s.papers, { id: `p${Date.now()}`, kind: 'dispatch', deviceId: id, companyId, date: new Date().toISOString() }] })),
  importDevices: records => set(s => ({ devices: mergeImported(s.devices, records) })),
  resetDemo: () => set(createDemoData()),
}), { name: 's-it-hub-data', version: 1 }));

export type AwayItem = { device: Device; company: Company; critical: boolean; expected: Date; daysLate: number; late: boolean };

export function awayList(devices: Device[], companies: Company[], today = new Date()): AwayItem[] {
  return sortAway(devices.filter(d => d.status === 'away' && d.sentDate && d.companyId).map(device => {
    const company = companies.find(c => c.id === device.companyId);
    if (!company || !device.sentDate) return null;
    const expected = expectedReturn(new Date(device.sentDate), company.deadlineDays);
    return { device, company, critical: departmentOf(device).critical, expected, daysLate: businessDaysBetween(expected, today), late: isLate(expected, today) };
  }).filter((item): item is AwayItem => item !== null));
}

export const departmentOf = (d: Device) => {
  const department = departments.find(x => x.id === d.departmentId);
  if (!department) throw new Error('Unknown department');
  return department;
};
export type { Paper };

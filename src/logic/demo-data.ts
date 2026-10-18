import { addBusinessDays } from './rules';

export type DeviceType = 'printer' | 'monitor' | 'pc';
export type Department = { id: string; fr: string; en: string; ar: string; critical: boolean };
export type Company = { id: string; name: string; phone: string; deadlineDays: number; contract: 'warranty' | 'contract' | 'none'; contractEnd: string };
export type Device = { id: string; inventory: string; serial: string; type: DeviceType; brand: string; departmentId: string; status: 'service' | 'away'; companyId?: string; sentDate?: string; problem?: string; returnedDate?: string | undefined; returnedNotes?: string | undefined };
export type Paper = { id: string; kind: 'dispatch' | 'reception' | 'invoice'; deviceId: string; companyId: string; date: string };

export const departments: Department[] = [
  { id: 'urg', fr: 'Urgences', en: 'Emergency', ar: 'الاستعجالي', critical: true },
  { id: 'rea', fr: 'Réanimation', en: 'ICU', ar: 'الإنعاش', critical: true },
  { id: 'bloc', fr: 'Bloc opératoire', en: 'Operating room', ar: 'قاعة العمليات', critical: true },
  { id: 'cardio', fr: 'Cardiologie', en: 'Cardiology', ar: 'أمراض القلب', critical: false },
  { id: 'radio', fr: 'Radiologie', en: 'Radiology', ar: 'الأشعة', critical: false },
  { id: 'admin', fr: 'Administration', en: 'Administration', ar: 'الإدارة', critical: false },
];

const iso = (d: Date) => d.toISOString();

export function createDemoData(today = new Date()) {
  const in6Months = new Date(today); in6Months.setMonth(in6Months.getMonth() + 6);
  const in3Weeks = new Date(today); in3Weeks.setDate(in3Weeks.getDate() + 21);
  const companies: Company[] = [
    { id: 'nimbus', name: 'Nimbus Service', phone: '+216 70 000 101', deadlineDays: 5, contract: 'contract', contractEnd: iso(in6Months) },
    { id: 'zenith', name: 'Zenith Repair', phone: '+216 70 000 202', deadlineDays: 7, contract: 'warranty', contractEnd: iso(in3Weeks) },
    { id: 'atlas', name: 'Atlas Tech', phone: '+216 70 000 303', deadlineDays: 10, contract: 'none', contractEnd: iso(in6Months) },
  ];
  const types: [DeviceType, string][] = [['pc', 'Dell OptiPlex'], ['printer', 'HP LaserJet'], ['monitor', 'Dell 24″'], ['pc', 'Lenovo ThinkCentre'], ['printer', 'Canon i-SENSYS']];
  const devices: Device[] = Array.from({ length: 40 }, (_, i) => {
    const [type, brand] = types[i % types.length]!;
    const n = String(100 + i * 7).padStart(4, '0');
    return { id: `d${i}`, inventory: `INV-${n}`, serial: `DEMO-SN-${n}`, type, brand, departmentId: departments[i % 6]!.id, status: 'service' };
  });
  // Away devices: sent so that expected return lands relative to today (negative = late by N business days).
  const away: { inv: string; type: DeviceType; brand: string; dep: string; company: string; offset: number; problem: string }[] = [
    { inv: 'INV-0402', type: 'printer', brand: 'HP LaserJet', dep: 'urg', company: 'nimbus', offset: -3, problem: 'Bourrage papier répété' },
    { inv: 'INV-0186', type: 'monitor', brand: 'Dell 24″', dep: 'cardio', company: 'zenith', offset: -1, problem: 'Écran noir au démarrage' },
    { inv: 'INV-0233', type: 'pc', brand: 'Dell OptiPlex', dep: 'rea', company: 'atlas', offset: 2, problem: 'Ne démarre plus' },
    { inv: 'INV-0317', type: 'pc', brand: 'Lenovo ThinkCentre', dep: 'radio', company: 'nimbus', offset: 3, problem: 'Disque dur bruyant' },
    { inv: 'INV-0158', type: 'printer', brand: 'Canon i-SENSYS', dep: 'admin', company: 'zenith', offset: 6, problem: 'Impression pâle' },
  ];
  away.forEach((a, i) => {
    const company = companies.find(c => c.id === a.company)!;
    const expected = addBusinessDays(today, a.offset);
    const sent = addBusinessDays(expected, -company.deadlineDays);
    devices[i] = { ...devices[i]!, id: `d${i}`, inventory: a.inv, serial: `DEMO-SN-${a.inv.slice(4)}`, type: a.type, brand: a.brand, departmentId: a.dep, status: 'away', companyId: a.company, sentDate: iso(sent), problem: a.problem };
  });
  const papers: Paper[] = [
    { id: 'p1', kind: 'dispatch', deviceId: 'd0', companyId: 'nimbus', date: devices[0]!.sentDate! },
    { id: 'p2', kind: 'dispatch', deviceId: 'd1', companyId: 'zenith', date: devices[1]!.sentDate! },
    { id: 'p3', kind: 'reception', deviceId: 'd7', companyId: 'atlas', date: iso(addBusinessDays(today, -4)) },
  ];
  return { companies, devices, papers };
}

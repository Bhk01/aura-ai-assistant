import Papa from 'papaparse';
import { departments, type Device } from './demo-data';

const required = ['inventory_no', 'serial_no', 'type', 'department', 'problem', 'reported_date'];
export function previewCsv(text: string, devices: Device[]) {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim() });
  if (result.errors.length || required.some(h => !result.meta.fields?.includes(h))) throw new Error('csvInvalid');
  const seen = new Set<string>();
  const records = result.data.map(row => {
    const inventory = row.inventory_no?.trim();
    const serial = row.serial_no?.trim();
    const type = row.type?.trim().toLowerCase();
    const dept = departments.find(d => [d.id, d.fr, d.en, d.ar].some(v => v.toLowerCase() === row.department?.trim().toLowerCase()));
    if (!inventory || !serial || seen.has(inventory) || !dept || !['pc', 'printer', 'monitor'].includes(type ?? '')) throw new Error('csvInvalid');
    seen.add(inventory);
    const existing = devices.find(d => d.inventory === inventory);
    return { ...existing, id: existing?.id ?? crypto.randomUUID(), inventory, serial, type: type as Device['type'], departmentId: dept.id, problem: row.problem?.trim() ?? '', brand: existing?.brand ?? type ?? '', status: existing?.status ?? 'service' } satisfies Device;
  });
  if (!records.length) throw new Error('csvInvalid');
  return { records, added: records.filter(r => !devices.some(d => d.id === r.id)).length, changed: records.filter(r => devices.some(d => d.id === r.id)).length };
}

export function mergeImported(devices: Device[], records: Device[]) {
  const byInventory = new Map(records.map(r => [r.inventory, r]));
  return [...devices.map(d => byInventory.get(d.inventory) ?? d), ...records.filter(r => !devices.some(d => d.inventory === r.inventory))];
}
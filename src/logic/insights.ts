import type { Company, Device, Paper } from "./demo-data";
import { expectedReturn, isLate } from "./rules";

export type Health = { count: number; level: "good" | "watch" | "replace" };

/** A device sent out 3+ times is advised for replacement; 2 times is watched. */
export function deviceHealth(deviceId: string, papers: Paper[]): Health {
  const count = papers.filter((p) => p.deviceId === deviceId && p.kind === "dispatch").length;
  return { count, level: count >= 3 ? "replace" : count === 2 ? "watch" : "good" };
}

export type MonthlySummary = {
  sent: number;
  returned: number;
  returnedOnTime: number;
  pending: number;
  late: number;
  byDepartment: Record<string, number>;
  toReplace: Device[];
};

export function monthlySummary(
  devices: Device[],
  companies: Company[],
  papers: Paper[],
  month = new Date(),
): MonthlySummary {
  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  };
  const sentPapers = papers.filter((p) => p.kind === "dispatch" && inMonth(p.date));
  const returnedPapers = papers.filter((p) => p.kind === "reception" && inMonth(p.date));
  let returnedOnTime = 0;
  for (const r of returnedPapers) {
    const company = companies.find((c) => c.id === r.companyId);
    const sent = papers
      .filter((p) => p.kind === "dispatch" && p.deviceId === r.deviceId && p.date <= r.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!company || !sent) {
      returnedOnTime += 1;
      continue;
    }
    if (!isLate(expectedReturn(new Date(sent.date), company.deadlineDays), new Date(r.date)))
      returnedOnTime += 1;
  }
  const away = devices.filter((d) => d.status === "away");
  const late = away.filter((d) => {
    const c = companies.find((x) => x.id === d.companyId);
    return c && d.sentDate && isLate(expectedReturn(new Date(d.sentDate), c.deadlineDays));
  }).length;
  const byDepartment: Record<string, number> = {};
  for (const p of sentPapers) {
    const dep = devices.find((d) => d.id === p.deviceId)?.departmentId ?? "?";
    byDepartment[dep] = (byDepartment[dep] ?? 0) + 1;
  }
  return {
    sent: sentPapers.length,
    returned: returnedPapers.length,
    returnedOnTime,
    pending: away.length,
    late,
    byDepartment,
    toReplace: devices.filter((d) => deviceHealth(d.id, papers).level === "replace"),
  };
}

export const TIMELINE_STEPS = [
  "stepReported",
  "stepDispatched",
  "stepRepair",
  "stepExpected",
  "stepReceived",
] as const;

/** Index of the current step for a device (0..4). */
export function timelineStep(device: Device, today = new Date(), expected?: Date | null): number {
  if (device.status === "service") return device.returnedDate ? 4 : 0;
  if (!device.sentDate) return 0;
  const days = (today.getTime() - new Date(device.sentDate).getTime()) / 86_400_000;
  if (expected && today >= expected) return 3;
  return days >= 1 ? 2 : 1;
}

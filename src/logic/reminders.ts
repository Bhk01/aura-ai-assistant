import { expectedReturn } from "./rules";
import type { Company, Device } from "./demo-data";

/** Foreground only: never shorten a future reminder to fit a timer. */
export function dueTomorrowReminders(devices: Device[], companies: Company[], now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return devices.flatMap((device) => {
    const company = companies.find((c) => c.id === device.companyId);
    if (device.status !== "away" || !device.sentDate || !company) return [];
    const expected = expectedReturn(new Date(device.sentDate), company.deadlineDays);
    if (expected.getTime() !== tomorrow.getTime()) return [];
    return [{ id: `${device.id}:${expected.toISOString()}`, device, company, expected }];
  });
}

export function withinQuietHours(now: Date) {
  return now.getHours() >= 20 || now.getHours() < 7;
}

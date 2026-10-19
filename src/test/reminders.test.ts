import { describe, expect, it } from "vitest";
import { dueTomorrowReminders, withinQuietHours } from "@/logic/reminders";
import { createDemoData } from "@/logic/demo-data";

describe("reminder timing", () => {
  const data = createDemoData(new Date(2026, 9, 14));
  it("does not fire reminders days early", () => {
    expect(
      dueTomorrowReminders(data.devices, data.companies, new Date(2026, 9, 14, 8)),
    ).toHaveLength(0);
  });
  it("fires due-tomorrow only one calendar day before expected return", () => {
    expect(
      dueTomorrowReminders(data.devices, data.companies, new Date(2026, 9, 15, 8)).map(
        (r) => r.device.inventory,
      ),
    ).toEqual(["INV-0233"]);
  });
  it("cancels a reminder when the device is returned", () => {
    expect(
      dueTomorrowReminders(
        data.devices.map((d) => ({ ...d, status: "service" })),
        data.companies,
        new Date(2026, 9, 15, 8),
      ),
    ).toHaveLength(0);
  });
  it("honors quiet hours from 20:00 through 07:00", () => {
    expect([6, 7, 19, 20].map((h) => withinQuietHours(new Date(2026, 9, 15, h)))).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });
});

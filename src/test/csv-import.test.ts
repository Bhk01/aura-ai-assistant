import { expect, it } from "vitest";
import { previewCsv, mergeImported } from "@/logic/csv-import";
import { createDemoData } from "@/logic/demo-data";

it("previews new and changed devices and never deletes omitted devices", () => {
  const data = createDemoData(new Date(2026, 9, 14));
  const csv =
    'inventory_no,serial_no,type,department,problem,reported_date\nINV-0402,SN-NEW,printer,urg,"Paper, jam",2026-10-14\nINV-9999,SN-9999,pc,admin,,2026-10-14';
  const preview = previewCsv(csv, data.devices);
  expect([preview.added, preview.changed]).toEqual([1, 1]);
  const merged = mergeImported(data.devices, preview.records);
  expect(merged).toHaveLength(41);
  expect(merged.find((d) => d.inventory === "INV-0402")?.problem).toBe("Paper, jam");
  expect(merged.find((d) => d.inventory === "INV-0402")?.status).toBe("away");
});
it("rejects missing columns", () => {
  expect(() => previewCsv("inventory_no\nINV-1", [])).toThrow("csvInvalid");
});

import { afterEach, describe, expect, it } from "vitest";
import {
  isAutoLockMinutes,
  readLockSettings,
  saveAutoLockMinutes,
  savePin,
  verifyPin,
} from "@/logic/local-lock";

afterEach(() => {
  window.localStorage.clear();
});

describe("local PIN lock", () => {
  it("stores a salted digest and verifies only the matching PIN", async () => {
    const settings = await savePin("024680", 5);
    const stored = window.localStorage.getItem("s-it-hub-local-lock-v1");

    expect(stored).not.toContain("024680");
    expect(await verifyPin("024680", settings)).toBe(true);
    expect(await verifyPin("024681", settings)).toBe(false);
    expect(readLockSettings()).toEqual(settings);
  });

  it("persists a supported auto-lock interval and rejects unsupported values", async () => {
    await savePin("135790", 5);

    expect(isAutoLockMinutes(15)).toBe(true);
    expect(isAutoLockMinutes(2)).toBe(false);
    expect(saveAutoLockMinutes(15).autoLockMinutes).toBe(15);
    expect(readLockSettings()?.autoLockMinutes).toBe(15);
  });

  it("does not set an auto-lock interval before a PIN exists", () => {
    expect(() => saveAutoLockMinutes(1)).toThrow("A PIN must be configured");
  });
});

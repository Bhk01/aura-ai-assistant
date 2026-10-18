import { expect, it } from "vitest";
import { useStore } from "@/logic/store";

it("records the return date and technician notes on the device and reception paper", () => {
  const original = useStore.getState();
  try {
    useStore.getState().resetDemo();
    const awayDevice = useStore.getState().devices.find((device) => device.status === "away");
    expect(awayDevice).toBeDefined();
    if (!awayDevice) return;

    const returnedAt = "2026-10-18T09:00:00.000Z";
    useStore.getState().markReturned(awayDevice.id, returnedAt, "Power supply replaced");

    const state = useStore.getState();
    expect(state.devices.find((device) => device.id === awayDevice.id)).toMatchObject({
      status: "service",
      returnedDate: returnedAt,
      returnedNotes: "Power supply replaced",
    });
    expect(state.papers.at(-1)).toMatchObject({
      kind: "reception",
      deviceId: awayDevice.id,
      date: returnedAt,
    });
  } finally {
    useStore.setState(original, true);
  }
});

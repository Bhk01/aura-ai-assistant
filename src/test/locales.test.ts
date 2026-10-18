import { expect, it } from "vitest";
import fr from "@/logic/locales/fr.json";
import en from "@/logic/locales/en.json";
import ar from "@/logic/locales/ar.json";

it("keeps the French, English, and Arabic UI keys aligned", () => {
  const frenchKeys = Object.keys(fr).sort();
  expect(Object.keys(en).sort()).toEqual(frenchKeys);
  expect(Object.keys(ar).sort()).toEqual(frenchKeys);
});

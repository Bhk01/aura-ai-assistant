import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DesignPreview } from "@/components/hub/design-preview";
import { savePin } from "@/logic/local-lock";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

it("hides device data behind the configured PIN immediately on startup", async () => {
  await savePin("024680", 5);

  render(<DesignPreview />);

  expect(
    await screen.findByRole("dialog", { name: "Votre espace est verrouillé" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("INV-0402")).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

it("fails closed when saved lock settings cannot be verified", async () => {
  window.localStorage.setItem("s-it-hub-local-lock-v1", "invalid");

  render(<DesignPreview />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Impossible de vérifier le verrouillage",
  );
  expect(screen.queryByText("INV-0402")).not.toBeInTheDocument();
});

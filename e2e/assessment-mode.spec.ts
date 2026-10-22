import { test, expect } from "@playwright/test";
import { loginAsLearner } from "./helpers";

test("ASSESSMENT mode: no AI-suggested lines, learner speaks freely via text and reaches a report", async ({
  page,
}) => {
  const sessionId = process.env.E2E_ASSESSMENT_SESSION_ID;
  if (!sessionId) throw new Error("E2E_ASSESSMENT_SESSION_ID was not set by global-setup.ts");

  await loginAsLearner(page);
  await page.goto(`/simulation/${sessionId}`);

  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText("Incoming Customer Call")).toBeHidden();

  // ASSESSMENT mode never offers a suggested line (CLAUDE.md "Modes"): the
  // coach card stays on its idle copy, and the input falls back to its plain
  // placeholder instead of "Leave blank to send the suggestion as-is…".
  await expect(page.getByText("Suggestions appear here during the live call.")).toBeVisible();
  const textInput = page.locator('input[type="text"][placeholder="Type your response…"]');
  await expect(textInput).toBeVisible();

  await textInput.fill("I'm looking for a compact SUV with good mileage for city driving.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("I'm looking for a compact SUV with good mileage for city driving.")).toBeVisible();

  // Still no suggestion after speaking — confirms it's suppressed for the
  // whole call, not just before the first turn.
  await expect(page.getByText("Suggestions appear here during the live call.")).toBeVisible();

  await page.getByRole("button", { name: "End call" }).click();
  await page.waitForURL(`**/simulation/${sessionId}/results`, { timeout: 15_000 });
  await expect(page.getByText("Loading your results…")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText("Report not ready yet")).not.toBeVisible();
});

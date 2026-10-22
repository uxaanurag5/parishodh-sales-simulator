import { test, expect } from "@playwright/test";
import { loginAsLearner } from "./helpers";

test("SCRIPTED mode: autoplay replays the golden call end-to-end to a results report", async ({ page }) => {
  const sessionId = process.env.E2E_SCRIPTED_SESSION_ID;
  if (!sessionId) throw new Error("E2E_SCRIPTED_SESSION_ID was not set by global-setup.ts");

  await loginAsLearner(page);

  await page.goto(`/simulation/${sessionId}?autoplay=1`);

  // Autoplay drives the whole call with no user input: accepts the ringing
  // call, then sends each golden-transcript suggestion as it becomes ready.
  await expect(page.getByText("Incoming Customer Call")).toBeVisible();
  await expect(page.getByText("Incoming Customer Call")).toBeHidden({ timeout: 15_000 });

  // The call runs for several turns, so give it a generous window before the
  // post-ENDED redirect to the results page.
  await page.waitForURL(`**/simulation/${sessionId}/results`, { timeout: 60_000 });

  // The results page's own data fetch has its own retry/loading state.
  await expect(page.getByText("Loading your results…")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText("Report not ready yet")).not.toBeVisible();
  await expect(page.getByText("Judgment Engine", { exact: true })).toBeVisible();
});

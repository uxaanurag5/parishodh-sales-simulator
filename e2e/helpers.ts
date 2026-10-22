import type { Page } from "@playwright/test";

export async function loginAsLearner(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("aarav@demo.in");
  await page.locator('input[type="password"]').fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/dashboard");
}

import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync("pnpm", ["demo:reset"], { cwd: process.cwd(), stdio: "pipe" });
});

test("renders a truthful bilingual private-demo foundation", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveTitle(/Private goal workspace · LifeThread/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("learning routine");
  await expect(page.getByText("Recorded AI fixture · local private demo").last()).toBeVisible();
  await expect(page.getByText("Private demo · no public sharing").last()).toBeVisible();
  await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute("href", "/ko");
  await expect(page.getByLabel("category")).toHaveCount(0);

  await page.getByRole("link", { name: "한국어" }).click();
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.getByText("비공개 데모 · 공개 공유 없음").last()).toBeVisible();
});

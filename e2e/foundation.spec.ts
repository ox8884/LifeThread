import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test.skip(
  process.env["LIFETHREAD_E2E_AUTHENTICATED_SESSION"] !== "true",
  "Requires a live Docker Supabase instance and authenticated session fixture; unavailable in this environment.",
);

test.beforeEach(() => {
  execFileSync(process.execPath, ["--import", "tsx", "scripts/demo/reset.ts"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});

test("renders a truthful bilingual private-demo foundation", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveTitle(/Private goal workspace · LifeThread/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("learning routine");
  await page.getByLabel("Thread options").click();
  await expect(page.getByText("Recorded AI fixture · local private demo")).toBeVisible();
  await expect(page.getByText("Private demo · no public sharing")).toBeVisible();
  await page.getByRole("button", { name: "Start fresh" }).click();
  await expect(page.getByRole("heading", { name: "What are you trying to get done?" })).toBeVisible();
  await expect(page.getByLabel("Your goal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start planning" })).toBeVisible();
  await expect(page.getByText("Recorded AI fixture · local private demo")).toBeHidden();
  await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute("href", "/ko");
  await expect(page.getByLabel("category")).toHaveCount(0);

  await page.getByRole("link", { name: "한국어" }).click();
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.getByRole("heading", { name: "무엇을 끝내고 싶으신가요?" })).toBeVisible();
});

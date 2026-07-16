import { expect, test } from "@playwright/test";

test("protects the multi-goal dashboard with the verified user boundary", async ({ page }) => {
  await page.goto("/en");

  await expect(page).toHaveURL(/\/en\/sign-in\?redirect=%2Fen$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("preserves a direct thread return path without revealing its existence", async ({ page }) => {
  await page.goto("/ko/threads/another-users-thread");

  await expect(page).toHaveURL(
    /\/ko\/sign-in\?redirect=%2Fko%2Fthreads%2Fanother-users-thread$/,
  );
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});

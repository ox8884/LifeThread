import { expect, test } from "@playwright/test";

test("redirects a signed-out workspace request to its locale-aware sign-in page", async ({ page }) => {
  // Given a signed-out visitor opening an English workspace path
  await page.goto("/en");

  // When the verified user boundary runs without Supabase credentials

  // Then the visitor receives a safe English sign-in destination
  await expect(page).toHaveURL(/\/en\/sign-in\?redirect=%2Fen$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("renders an accessible Korean sign-up form with a preserved relative return path", async ({ page }) => {
  // Given a visitor opens Korean sign-up with a same-origin return path
  await page.goto("/ko/sign-up?redirect=%2Fko%3Ffrom%3Dconsent");

  // When the authentication page finishes rendering

  // Then its labelled controls and free-email disclosure are usable
  await expect(page.getByRole("heading", { name: "무료로 가입" })).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("비밀번호")).toBeVisible();
  await expect(page.getByText("이메일과 비밀번호만 사용합니다.")).toBeVisible();
});

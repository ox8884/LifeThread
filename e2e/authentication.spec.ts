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
  await expect(page.getByText("이메일과 비밀번호로 가입합니다.")).toBeVisible();
});

test("uses the approved focus and control-boundary contrast on Korean sign-up", async ({ page }) => {
  // Given a keyboard user on the Korean sign-up surface
  await page.goto("/ko/sign-up");
  const email = page.getByLabel("이메일");

  // When the email field receives keyboard focus
  await email.focus();

  // Then the focus ring and control border use the approved opaque focus token
  await expect(email).toHaveCSS("outline-color", "rgb(79, 128, 109)");
  await expect(email).toHaveCSS("border-top-color", "rgb(79, 128, 109)");
  const alternateLinkBox = await page.getByRole("link", { name: "로그인" }).boundingBox();
  expect(alternateLinkBox?.width).toBeGreaterThanOrEqual(44);
  expect(alternateLinkBox?.height).toBeGreaterThanOrEqual(44);
});

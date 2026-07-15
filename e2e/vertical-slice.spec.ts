import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync("pnpm", ["demo:reset"], { cwd: process.cwd(), stdio: "pipe" });
});

test("completes the private bilingual living-state journey", async ({ page }, testInfo) => {
  const startedAt = Date.now();
  const screenshotDirectory = ".omo/evidence/task-14-demo/screens";
  mkdirSync(screenshotDirectory, { recursive: true });
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/en");
  await expect(page.getByText("Recorded AI fixture · local private demo").last()).toBeVisible();
  await page.getByRole("button", { name: "Start fresh" }).click();
  await page.screenshot({
    path: `${screenshotDirectory}/creation-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/creation-viewport-${testInfo.project.name}.png`,
  });
  await page.getByLabel("Goal").fill("주말에만 가능한 sustainable learning routine 만들기");
  await page.getByRole("button", { name: "Create living thread" }).click();

  await expect(page.getByRole("heading", { name: /sustainable learning routine/ })).toBeVisible();
  const threadId = await page.getByTestId("thread-id").textContent();
  await expect(page.getByTestId("task-row")).toHaveCount(3);
  await expect(page.getByText("AI suggested").first()).toBeVisible();

  const firstTask = page.getByTestId("task-row").nth(0);
  await firstTask.getByRole("button", { name: "Accept" }).click();
  await firstTask.getByRole("button", { name: "Complete" }).click();
  await firstTask.getByRole("button", { name: "Reopen" }).click();

  const secondTask = page.getByTestId("task-row").nth(1);
  await secondTask.getByLabel("Edit task").fill("Review one bilingual checkpoint");
  await secondTask.getByRole("button", { name: "Save edit" }).click();

  const thirdTask = page.getByTestId("task-row").nth(2);
  await thirdTask.getByRole("button", { name: "Reject" }).click();

  await page.getByLabel("New task").fill("Write a manual reflection");
  await page.getByRole("button", { name: "Add task" }).click();
  const manualTask = page.getByTestId("task-row").filter({ hasText: "Write a manual reflection" });
  await expect(manualTask.getByText("User created")).toBeVisible();
  await manualTask.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Removed tasks", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Confirm fact" }).click();
  await page.getByLabel("Evidence note").fill("사실 일정이 바뀌어서 주말에만 진행할 수 있습니다.");
  await page.getByRole("button", { name: "Add private note" }).click();
  await expect(page.getByText("Unresolved conflict")).toBeVisible();
  await expect(page.getByText("Source ko", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Generate draft" }).click();
  await expect(page.getByText("Draft · not sent")).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-en-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-en-viewport-${testInfo.project.name}.png`,
  });

  const versionBeforeLocale = await page.getByTestId("thread-version").textContent();
  await page.getByRole("link", { name: "한국어" }).click();
  await expect(page).toHaveURL(/\/ko$/);
  await expect(page.getByText("비공개 데모 · 공개 공유 없음").last()).toBeVisible();
  expect(await page.getByTestId("thread-id").textContent()).toBe(threadId);
  expect(await page.getByTestId("thread-version").textContent()).toBe(versionBeforeLocale);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-ko-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-ko-viewport-${testInfo.project.name}.png`,
  });
  expect(Date.now() - startedAt).toBeLessThan(180_000);
  expect(consoleErrors).toEqual([]);
});

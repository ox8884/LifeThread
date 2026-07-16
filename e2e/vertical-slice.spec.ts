import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.beforeEach(() => {
  execFileSync(process.execPath, ["--import", "tsx", "scripts/demo/reset.ts"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});

test("completes the private bilingual living-state journey", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(10_000);
  const startedAt = Date.now();
  const screenshotDirectory = ".omo/evidence/action-first-redesign/screens";
  mkdirSync(screenshotDirectory, { recursive: true });
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/en");
  await page.getByLabel("Thread options").click();
  await expect(page.getByText("Recorded AI fixture · local private demo")).toBeVisible();
  await page.getByRole("button", { name: "Start fresh" }).click();
  await page.screenshot({
    path: `${screenshotDirectory}/creation-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/creation-viewport-${testInfo.project.name}.png`,
  });
  await page.getByLabel("Your goal").fill("주말에만 가능한 sustainable learning routine 만들기");
  await page.getByRole("button", { name: "Start planning" }).click();

  await expect(page.getByRole("heading", { name: /sustainable learning routine/ })).toBeVisible();
  const threadId = await page.getByTestId("thread-id").textContent();
  await expect(page.getByTestId("task-row")).toHaveCount(3);
  const firstPlanTask = page.getByTestId("task-row").filter({ hasText: "Review the first proposal" });
  await expect(firstPlanTask.getByText("AI suggested")).toBeVisible();
  await expect(page.getByTestId("next-action")).toContainText("Review the first proposal");
  await expect(page.getByTestId("thread-progress")).toHaveText("0 / 3 complete");
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
  await expect(page.getByLabel("What changed?")).toBeVisible();
  await expect(page.getByTestId("review-count")).toContainText("3");
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-initial-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-initial-viewport-${testInfo.project.name}.png`,
  });

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("next-action")).toContainText("Clarify the success criteria");
  await expect(page.getByTestId("thread-progress")).toHaveText("1 / 3 complete");
  const workspaceUpdateStatus = page.getByTestId("workspace-update-status");
  await expect(workspaceUpdateStatus).toHaveAttribute("aria-live", "polite");
  await expect(workspaceUpdateStatus).toHaveAttribute("aria-atomic", "true");
  await expect(workspaceUpdateStatus).toHaveText(
    "Workspace updated · revision 3",
  );

  const reviewPanel = page.locator(".candidate-review");
  const reviewDisclosure = reviewPanel.locator(".review-disclosure");
  await reviewPanel.getByLabel("Review changes").click();
  const acceptedSuggestion = reviewPanel.locator(".review-item").filter({
    hasText: "Add the first evidence note",
  });
  await acceptedSuggestion.getByRole("button", { name: "Accept" }).click();

  const rejectedSuggestion = page.getByTestId("task-row").filter({
    hasText: "Clarify the success criteria",
  });
  await rejectedSuggestion.getByLabel(/Task options/).click();
  await rejectedSuggestion.getByRole("button", { name: "Reject" }).click();

  await page.getByLabel("New task").fill("Write a manual reflection");
  await page.getByRole("button", { name: "Add task" }).click();
  const manualTask = page.getByTestId("task-row").filter({
    hasText: "Write a manual reflection",
  });
  await expect(manualTask.getByText("User created")).toBeVisible();
  await manualTask.getByLabel(/Task options/).click();
  await manualTask.getByLabel("Edit task").fill("Write a bilingual reflection");
  await manualTask.getByRole("button", { name: "Save edit" }).click();

  const editedManualTask = page.getByTestId("task-row").filter({
    hasText: "Write a bilingual reflection",
  });
  await editedManualTask.getByRole("button", { name: "Remove" }).click();
  await page.getByText("Removed tasks: 1", { exact: true }).click();
  await page.getByRole("button", { name: "Restore" }).click();

  if ((await reviewDisclosure.getAttribute("open")) === null) {
    await reviewPanel.getByLabel("Review changes").click();
  }
  await page.getByRole("button", { name: "Confirm fact" }).click();
  await page.getByLabel("What changed?").fill("사실 일정이 바뀌어서 주말에만 진행할 수 있습니다.");
  await page.getByRole("button", { name: "Add update" }).click();

  const threadDetails = page.locator(".thread-details");
  await threadDetails.locator("summary").filter({ hasText: "Evidence" }).click();
  await expect(threadDetails.getByText("Source ko", { exact: false })).toBeVisible();
  await threadDetails.locator("summary").filter({ hasText: "Conflicts" }).click();
  await expect(threadDetails.getByText("Unresolved conflict")).toBeVisible();

  const communicationSummary = threadDetails.locator("summary").filter({
    hasText: "Communication draft",
  });
  const communicationDisclosure = communicationSummary.locator("..");
  await communicationSummary.click();
  await page.getByRole("button", { name: "Generate draft" }).click();
  if ((await communicationDisclosure.getAttribute("open")) === null) {
    await communicationSummary.click();
  }
  await expect(threadDetails.locator(".draft-row").getByText("Draft · not sent")).toBeVisible();
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
  expect(await page.getByTestId("thread-id").textContent()).toBe(threadId);
  expect(await page.getByTestId("thread-version").textContent()).toBe(versionBeforeLocale);
  await expect(page.getByTestId("thread-progress")).toHaveText("1 / 3 완료");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-ko-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `${screenshotDirectory}/workspace-ko-viewport-${testInfo.project.name}.png`,
  });
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  expect(await page.getByTestId("thread-id").textContent()).toBe(threadId);
  expect(await page.getByTestId("thread-version").textContent()).toBe(versionBeforeLocale);
  await expect(page.getByTestId("thread-progress")).toHaveText("1 / 3 complete");
  expect(Date.now() - startedAt).toBeLessThan(180_000);
  expect(consoleErrors).toEqual([]);
});

test("shows an accessible error when an action request is invalid", async ({ page }, testInfo) => {
  await page.goto("/en");
  const doneForm = page.getByTestId("next-action").locator("form").filter({
    has: page.getByRole("button", { name: "Done" }),
  });
  await doneForm.locator('input[name="version"]').evaluate((element) => {
    if (element instanceof HTMLInputElement) element.value = "invalid";
  });
  await doneForm.getByRole("button", { name: "Done" }).click();
  const actionAlert = page.getByRole("alert").filter({
    hasText: "LifeThread could not apply that request.",
  });
  await expect(actionAlert).toBeVisible();
  await expect(page.getByTestId("next-action")).toBeVisible();
  const screenshotDirectory = ".omo/evidence/action-first-redesign/screens";
  mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: `${screenshotDirectory}/action-error-viewport-${testInfo.project.name}.png`,
  });
  const tryAgain = page.getByRole("link", { name: "Try again" });
  await expect(tryAgain).toBeVisible();
  await tryAgain.click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(actionAlert).toHaveCount(0);
});

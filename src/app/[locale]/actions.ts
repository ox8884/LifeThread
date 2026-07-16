"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateDraft } from "@/application/communication/generate-draft";
import { resetDemo } from "@/application/demo/reset-demo";
import { ingestNoteEvidence } from "@/application/evidence/ingest-evidence";
import { confirmFact } from "@/application/facts/confirm-fact";
import { runTaskCommand } from "@/application/tasks/task-commands";
import { createThread } from "@/application/threads/create-thread";
import { recordedFixtureOwnerId } from "@/domain/actors";
import { canonicalStatusSchema } from "@/domain/status";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";
import { getRuntimeRepository } from "@/infrastructure/runtime";
import { isLocale, type Locale } from "@/i18n/locales";

const integerSchema = z.coerce.number().int().nonnegative();

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function refreshWorkspace(): void {
  revalidatePath("/", "layout");
}

function actionFailed(locale: Locale): never {
  redirect(`/${locale}?action_error=1`);
}

function readLocale(formData: FormData): Locale {
  const localeValue = textValue(formData, "locale");
  if (!isLocale(localeValue)) actionFailed("en");
  return localeValue;
}

export async function createThreadAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const result = await createThread(
    {
      goal: textValue(formData, "goal"),
      locale: localeValue,
      now: new Date().toISOString(),
    },
    {
      repository: getRuntimeRepository(),
      gateway: new RecordedAnalysisGateway(),
    },
  );
  if (result.kind !== "created") actionFailed(localeValue);
  refreshWorkspace();
}

export async function startFreshAction(): Promise<void> {
  await getRuntimeRepository().resetOwner(recordedFixtureOwnerId);
  refreshWorkspace();
}

export async function resetDemoAction(): Promise<void> {
  await resetDemo(getRuntimeRepository());
  refreshWorkspace();
}

export async function taskAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const kind = textValue(formData, "kind");
  const taskId = textValue(formData, "taskId");
  const base = {
    owner_id: recordedFixtureOwnerId,
    thread_id: textValue(formData, "threadId"),
    expected_version: version.data,
    now: new Date().toISOString(),
  };
  let result: Awaited<ReturnType<typeof runTaskCommand>>;
  switch (kind) {
    case "add":
      result = await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        content: textValue(formData, "content"),
      });
      break;
    case "edit":
      result = await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        content: textValue(formData, "content"),
      });
      break;
    case "transition": {
      const status = canonicalStatusSchema.safeParse(textValue(formData, "status"));
      if (!status.success) actionFailed(localeValue);
      result = await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        status: status.data,
      });
      break;
    }
    case "tombstone":
    case "restore":
      result = await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
      });
      break;
    case "reorder": {
      const position = integerSchema.safeParse(textValue(formData, "position"));
      if (!position.success) actionFailed(localeValue);
      result = await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        position: position.data,
      });
      break;
    }
    default:
      actionFailed(localeValue);
  }
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

export async function evidenceAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await ingestNoteEvidence(
    getRuntimeRepository(),
    new RecordedAnalysisGateway(),
    {
      owner_id: recordedFixtureOwnerId,
      thread_id: textValue(formData, "threadId"),
      note: textValue(formData, "note"),
      locale: localeValue,
      expected_version: version.data,
      now: new Date().toISOString(),
    },
  );
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

export async function confirmFactAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await confirmFact(getRuntimeRepository(), {
    owner_id: recordedFixtureOwnerId,
    thread_id: textValue(formData, "threadId"),
    fact_id: textValue(formData, "factId"),
    expected_version: version.data,
    now: new Date().toISOString(),
  });
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

export async function draftAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await generateDraft(getRuntimeRepository(), {
    owner_id: recordedFixtureOwnerId,
    thread_id: textValue(formData, "threadId"),
    locale: localeValue,
    expected_version: version.data,
    now: new Date().toISOString(),
  });
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

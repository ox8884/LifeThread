"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateDraft } from "@/application/communication/generate-draft";
import { ingestNoteEvidence } from "@/application/evidence/ingest-evidence";
import { confirmFact } from "@/application/facts/confirm-fact";
import { runTaskCommand } from "@/application/tasks/task-commands";
import { createThread } from "@/application/threads/create-thread";
import { canonicalStatusSchema } from "@/domain/status";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";
import { getAuthenticatedRuntimeRepository } from "@/infrastructure/runtime";
import { isLocale, type Locale } from "@/i18n/locales";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";

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

async function authenticatedActionRuntime(locale: Locale) {
  if (!hasRuntimeEnvironment(process.env)) actionFailed(locale);
  const client = await createServerSupabaseClient();
  try {
    return {
      ownerId: await requireUser(client, { locale, redirect: `/${locale}` }),
      repository: getAuthenticatedRuntimeRepository(client),
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) actionFailed(locale);
    throw error;
  }
}

export async function createThreadAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const { ownerId, repository } = await authenticatedActionRuntime(localeValue);
  const result = await createThread(
    {
      goal: textValue(formData, "goal"),
      locale: localeValue,
      now: new Date().toISOString(),
      owner_id: ownerId,
    },
    {
      repository,
      gateway: new RecordedAnalysisGateway(),
    },
  );
  if (result.kind !== "created") actionFailed(localeValue);
  refreshWorkspace();
  redirect("/" + localeValue + "/threads/" + result.aggregate.thread.id);
}

export async function taskAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const { ownerId, repository } = await authenticatedActionRuntime(localeValue);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const kind = textValue(formData, "kind");
  const taskId = textValue(formData, "taskId");
  const base = {
    owner_id: ownerId,
    thread_id: textValue(formData, "threadId"),
    expected_version: version.data,
    now: new Date().toISOString(),
    actor: { actor_type: "user", actor_user_id: ownerId },
  };
  let result: Awaited<ReturnType<typeof runTaskCommand>>;
  switch (kind) {
    case "add":
      result = await runTaskCommand(repository, {
        ...base,
        kind,
        content: textValue(formData, "content"),
      });
      break;
    case "edit":
      result = await runTaskCommand(repository, {
        ...base,
        kind,
        task_id: taskId,
        content: textValue(formData, "content"),
      });
      break;
    case "transition": {
      const status = canonicalStatusSchema.safeParse(textValue(formData, "status"));
      if (!status.success) actionFailed(localeValue);
      result = await runTaskCommand(repository, {
        ...base,
        kind,
        task_id: taskId,
        status: status.data,
      });
      break;
    }
    case "tombstone":
    case "restore":
      result = await runTaskCommand(repository, {
        ...base,
        kind,
        task_id: taskId,
      });
      break;
    case "reorder": {
      const position = integerSchema.safeParse(textValue(formData, "position"));
      if (!position.success) actionFailed(localeValue);
      result = await runTaskCommand(repository, {
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
  const { ownerId, repository } = await authenticatedActionRuntime(localeValue);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await ingestNoteEvidence(
    repository,
    new RecordedAnalysisGateway(),
    {
      owner_id: ownerId,
      thread_id: textValue(formData, "threadId"),
      note: textValue(formData, "note"),
      locale: localeValue,
      expected_version: version.data,
      now: new Date().toISOString(),
      actor: { actor_type: "user", actor_user_id: ownerId },
    },
  );
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

export async function confirmFactAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const { ownerId, repository } = await authenticatedActionRuntime(localeValue);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await confirmFact(repository, {
    owner_id: ownerId,
    thread_id: textValue(formData, "threadId"),
    fact_id: textValue(formData, "factId"),
    expected_version: version.data,
    now: new Date().toISOString(),
    actor: { actor_type: "user", actor_user_id: ownerId },
  });
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

export async function draftAction(formData: FormData): Promise<void> {
  const localeValue = readLocale(formData);
  const { ownerId, repository } = await authenticatedActionRuntime(localeValue);
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) actionFailed(localeValue);
  const result = await generateDraft(repository, {
    owner_id: ownerId,
    thread_id: textValue(formData, "threadId"),
    locale: localeValue,
    expected_version: version.data,
    now: new Date().toISOString(),
    actor: { actor_type: "user", actor_user_id: ownerId },
  });
  if (result.kind !== "applied") actionFailed(localeValue);
  refreshWorkspace();
}

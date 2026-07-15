"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateDraft } from "@/application/communication/generate-draft";
import { resetDemo } from "@/application/demo/reset-demo";
import { ingestNoteEvidence } from "@/application/evidence/ingest-evidence";
import { confirmFact } from "@/application/facts/confirm-fact";
import { runTaskCommand } from "@/application/tasks/task-commands";
import { createThread } from "@/application/threads/create-thread";
import { canonicalStatusSchema } from "@/domain/status";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";
import { getRuntimeRepository } from "@/infrastructure/runtime";
import { isLocale } from "@/i18n/locales";

const integerSchema = z.coerce.number().int().nonnegative();

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function refreshWorkspace(): void {
  revalidatePath("/", "layout");
}

export async function createThreadAction(formData: FormData): Promise<void> {
  const localeValue = textValue(formData, "locale");
  if (!isLocale(localeValue)) return;
  await createThread(
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
  refreshWorkspace();
}

export async function startFreshAction(): Promise<void> {
  await getRuntimeRepository().reset(null);
  refreshWorkspace();
}

export async function resetDemoAction(): Promise<void> {
  await resetDemo(getRuntimeRepository());
  refreshWorkspace();
}

export async function taskAction(formData: FormData): Promise<void> {
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) return;
  const kind = textValue(formData, "kind");
  const taskId = textValue(formData, "taskId");
  const base = {
    expected_version: version.data,
    now: new Date().toISOString(),
  };
  switch (kind) {
    case "add":
      await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        content: textValue(formData, "content"),
      });
      break;
    case "edit":
      await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        content: textValue(formData, "content"),
      });
      break;
    case "transition": {
      const status = canonicalStatusSchema.safeParse(textValue(formData, "status"));
      if (!status.success) return;
      await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        status: status.data,
      });
      break;
    }
    case "tombstone":
    case "restore":
      await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
      });
      break;
    case "reorder": {
      const position = integerSchema.safeParse(textValue(formData, "position"));
      if (!position.success) return;
      await runTaskCommand(getRuntimeRepository(), {
        ...base,
        kind,
        task_id: taskId,
        position: position.data,
      });
      break;
    }
    default:
      return;
  }
  refreshWorkspace();
}

export async function evidenceAction(formData: FormData): Promise<void> {
  const version = integerSchema.safeParse(textValue(formData, "version"));
  const localeValue = textValue(formData, "locale");
  if (!version.success || !isLocale(localeValue)) return;
  await ingestNoteEvidence(
    getRuntimeRepository(),
    new RecordedAnalysisGateway(),
    {
      note: textValue(formData, "note"),
      locale: localeValue,
      expected_version: version.data,
      now: new Date().toISOString(),
    },
  );
  refreshWorkspace();
}

export async function confirmFactAction(formData: FormData): Promise<void> {
  const version = integerSchema.safeParse(textValue(formData, "version"));
  if (!version.success) return;
  await confirmFact(getRuntimeRepository(), {
    fact_id: textValue(formData, "factId"),
    expected_version: version.data,
    now: new Date().toISOString(),
  });
  refreshWorkspace();
}

export async function draftAction(formData: FormData): Promise<void> {
  const version = integerSchema.safeParse(textValue(formData, "version"));
  const localeValue = textValue(formData, "locale");
  if (!version.success || !isLocale(localeValue)) return;
  await generateDraft(getRuntimeRepository(), {
    locale: localeValue,
    expected_version: version.data,
    now: new Date().toISOString(),
  });
  refreshWorkspace();
}

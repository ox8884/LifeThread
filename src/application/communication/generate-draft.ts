import type { ThreadRepository } from "@/application/threads/thread-repository";
import type { Communication, LifeThreadAggregate } from "@/domain/entities";
import { ownsThread, parseUserActor } from "@/domain/actors";
import { stableId } from "@/domain/identity";
import type { Locale } from "@/i18n/locales";

type GenerateDraftInput = Readonly<{
  owner_id: string;
  thread_id: string;
  locale: Locale;
  expected_version: number;
  now: string;
  actor?: unknown;
}>;

export async function generateDraft(
  repository: ThreadRepository,
  input: GenerateDraftInput,
) {
  const actor = parseUserActor(input.actor);
  if (!actor) return { kind: "unauthorized_actor" } as const;
  if (actor.actor_user_id !== input.owner_id) return { kind: "unauthorized_actor" } as const;
  const aggregate = await repository.load(input.owner_id, input.thread_id);
  if (!aggregate) return { kind: "missing_thread" } as const;
  if (!ownsThread(actor, aggregate.thread.owner_id)) return { kind: "unauthorized_actor" } as const;
  if (aggregate.thread.version !== input.expected_version) return { kind: "stale_version" } as const;
  const reference = aggregate.source_references[0];
  if (!reference) return { kind: "insufficient_evidence" } as const;
  const revision = aggregate.revisions.at(-1);
  if (!revision) return { kind: "insufficient_evidence" } as const;
  const firstTask = aggregate.tasks.find((task) => !task.deleted_at && task.status !== "rejected");
  const content = input.locale === "ko"
    ? `안녕하세요. 현재 목표를 검토하고 있습니다. 다음 단계는 ${firstTask?.content ?? "확인 중"}입니다. 중요한 내용은 회신으로 확인해 주세요.`
    : `Hello, I am reviewing the current goal. The next step is ${firstTask?.content ?? "under review"}. Please confirm any important details in your reply.`;
  const version = aggregate.thread.version + 1;
  const communication: Communication = {
    id: stableId("communication", `${aggregate.thread.id}:${input.locale}:${version}`),
    thread_id: aggregate.thread.id,
    locale: input.locale,
    kind: "follow_up",
    content,
    revision_id: revision.id,
    source_reference_ids: [reference.id],
    sent: false,
    created_at: input.now,
  };
  const updated: LifeThreadAggregate = {
    ...aggregate,
    thread: { ...aggregate.thread, version, updated_at: input.now },
    communications: [...aggregate.communications, communication],
    revisions: [...aggregate.revisions, {
      id: stableId("revision", `${aggregate.thread.id}:${version}`),
      thread_id: aggregate.thread.id,
      version,
      ...actor,
      command: "generate_draft",
      change_summary: "Created a cited draft without sending it.",
      previous_version: aggregate.thread.version,
      created_at: input.now,
    }],
  };
  const saved = await repository.save(
    input.owner_id,
    updated,
    input.expected_version,
  );
  return saved.kind === "saved" ? { kind: "applied", aggregate: updated } as const : { kind: "stale_version" } as const;
}

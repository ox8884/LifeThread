import type { ThreadRepository } from "@/application/threads/thread-repository";
import type { LifeThreadAggregate } from "@/domain/entities";
import { userActorForOwner } from "@/domain/actors";
import { stableId } from "@/domain/identity";

type ConfirmFactInput = Readonly<{ fact_id: string; expected_version: number; now: string }>;

export async function confirmFact(
  repository: ThreadRepository,
  input: ConfirmFactInput,
) {
  const aggregate = await repository.load();
  if (!aggregate) return { kind: "missing_thread" } as const;
  if (aggregate.thread.version !== input.expected_version) {
    return { kind: "stale_version" } as const;
  }
  const fact = aggregate.facts.find((candidate) => candidate.id === input.fact_id);
  if (!fact) return { kind: "missing_fact" } as const;
  const actor = userActorForOwner(aggregate.thread.owner_id);
  const version = aggregate.thread.version + 1;
  const updated: LifeThreadAggregate = {
    ...aggregate,
    thread: { ...aggregate.thread, version, updated_at: input.now },
    facts: aggregate.facts.map((candidate) => candidate.id === fact.id ? {
      ...candidate,
      status: "pending",
      user_confirmed: true,
      confirmed_by: actor.actor_user_id,
      confirmed_at: input.now,
      updated_at: input.now,
    } : candidate),
    revisions: [...aggregate.revisions, {
      id: stableId("revision", `${aggregate.thread.id}:${version}`),
      thread_id: aggregate.thread.id,
      version,
      ...actor,
      command: "confirm_fact",
      change_summary: "Confirmed one cited fact.",
      previous_version: aggregate.thread.version,
      created_at: input.now,
    }],
  };
  const saved = await repository.save(updated, input.expected_version);
  return saved.kind === "saved" ? { kind: "applied", aggregate: updated } as const : { kind: "stale_version" } as const;
}

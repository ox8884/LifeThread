import { z } from "zod";
import type { AnalysisGateway } from "@/application/analysis/analysis-gateway";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import type { ThreadRepository } from "@/application/threads/thread-repository";
import { candidateDeltaSchema } from "@/domain/candidate-delta";
import { userActorForOwner } from "@/domain/actors";
import type { LifeThreadAggregate } from "@/domain/entities";
import { detectSourceLanguage, sha256, stableId } from "@/domain/identity";
import type { Locale } from "@/i18n/locales";

const noteSchema = z.string().transform((value) => value.normalize("NFC").trim()).pipe(z.string().min(1).max(50_000));
type IngestNoteInput = Readonly<{ note: string; locale: Locale; expected_version: number; now: string }>;

export async function ingestNoteEvidence(
  repository: ThreadRepository,
  gateway: AnalysisGateway,
  input: IngestNoteInput,
) {
  const parsed = noteSchema.safeParse(input.note);
  if (!parsed.success) return { kind: "invalid_note" } as const;
  const aggregate = await repository.load();
  if (!aggregate) return { kind: "missing_thread" } as const;
  if (aggregate.thread.version !== input.expected_version) return { kind: "stale_version" } as const;
  const checksum = sha256(parsed.data);
  if (aggregate.evidence.some((item) => item.checksum === checksum)) {
    return { kind: "duplicate", aggregate } as const;
  }
  const evidenceId = stableId("evidence", `${aggregate.thread.id}:${checksum}`);
  const sourceId = stableId("source", evidenceId);
  const version = aggregate.thread.version + 1;
  const actor = userActorForOwner(aggregate.thread.owner_id);
  const withEvidence: LifeThreadAggregate = {
    ...aggregate,
    thread: { ...aggregate.thread, version, updated_at: input.now },
    evidence: [...aggregate.evidence, {
      id: evidenceId,
      thread_id: aggregate.thread.id,
      kind: "note",
      note: parsed.data,
      private_object_key: null,
      checksum,
      media_type: "text/plain",
      size_bytes: Buffer.byteLength(parsed.data, "utf8"),
      original_filename: null,
      source_language: detectSourceLanguage(parsed.data),
      capture_date: null,
      ingestion_state: "final",
      created_at: input.now,
      deleted_at: null,
    }],
    source_references: [...aggregate.source_references, {
      id: sourceId,
      thread_id: aggregate.thread.id,
      evidence_id: evidenceId,
      locator_kind: "text_span",
      locator: `chars:0-${parsed.data.length}`,
      quoted_hash: checksum,
      created_at: input.now,
    }],
    revisions: [...aggregate.revisions, {
      id: stableId("revision", `${aggregate.thread.id}:${version}`),
      thread_id: aggregate.thread.id,
      version,
      ...actor,
      command: "ingest_note_evidence",
      change_summary: "Preserved one original evidence note and its locator.",
      previous_version: aggregate.thread.version,
      created_at: input.now,
    }],
  };
  const rawCandidate = await gateway.analyze({
    aggregate: withEvidence,
    locale: input.locale,
    reason: "new_evidence",
    source_reference_id: sourceId,
  });
  const candidate = candidateDeltaSchema.safeParse(rawCandidate);
  if (!candidate.success) return { kind: "analysis_rejected" } as const;
  const reconciled = reconcileCandidate(withEvidence, candidate.data, input.now, gateway.actor);
  if (reconciled.kind !== "applied") return { kind: "analysis_rejected" } as const;
  const saved = await repository.save(reconciled.aggregate, input.expected_version);
  return saved.kind === "saved"
    ? { kind: "applied", aggregate: reconciled.aggregate } as const
    : { kind: "stale_version" } as const;
}

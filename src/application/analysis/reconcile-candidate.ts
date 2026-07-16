import type { CandidateDelta } from "@/domain/candidate-delta";
import { canReconcileThread, type RevisionActor } from "@/domain/actors";
import type {
  Conflict,
  Fact,
  LifeThreadAggregate,
  Milestone,
  Task,
} from "@/domain/entities";
import {
  createDerivedItem,
  proposalSource,
  sourcesResolve,
  stableId,
  type ReconciliationResult,
} from "@/application/analysis/reconcile-support";

export type { ReconciliationResult } from "@/application/analysis/reconcile-support";

export function reconcileCandidate(
  aggregate: LifeThreadAggregate,
  candidate: CandidateDelta,
  now: string,
  actor: RevisionActor,
): ReconciliationResult {
  if (candidate.thread_id !== aggregate.thread.id) return { kind: "rejected", reason: "cross_thread" };
  if (!canReconcileThread(actor, aggregate.thread.owner_id)) return { kind: "rejected", reason: "unauthorized_actor" };
  if (!sourcesResolve(aggregate, candidate)) {
    return { kind: "rejected", reason: "missing_source" };
  }
  if (aggregate.applied_analysis_run_ids.includes(candidate.analysis_run_id)) {
    return { kind: "duplicate", aggregate };
  }
  const currentRevision = aggregate.revisions.at(-1);
  if (!currentRevision || currentRevision.id !== candidate.base_revision_id) {
    return { kind: "rejected", reason: "stale_version" };
  }

  const tasks: Task[] = [...aggregate.tasks];
  const milestones: Milestone[] = [...aggregate.milestones];
  const facts: Fact[] = [...aggregate.facts];
  const conflicts: Conflict[] = [...aggregate.conflicts];
  const timelineEvents = [...aggregate.timeline_events];
  const openLoops = [...aggregate.open_loops];
  const waitingStates = [...aggregate.waiting_states];
  const deadlines = [...aggregate.deadlines];
  const risks = [...aggregate.risks];
  const recommendations = [...aggregate.recommendations];
  const communications = [...aggregate.communications];
  const appliedOperationIds = [...aggregate.applied_operation_ids];

  for (const operation of candidate.operations) {
    if (appliedOperationIds.includes(operation.operation_id)) continue;
    switch (operation.kind) {
      case "create_task":
        if (!tasks.some((task) => task.id === stableId("task", operation.semantic_key))) {
          tasks.push({
            id: stableId("task", operation.semantic_key),
            thread_id: aggregate.thread.id,
            milestone_id: null,
            content: operation.content,
            status: "proposed",
            priority: operation.priority,
            position: tasks.length,
            source_type: "ai_suggested",
            derivation: operation.derivation,
            ...(operation.inference_reason
              ? { inference_reason: operation.inference_reason }
              : {}),
            source_reference_ids: operation.source_reference_ids,
            confidence: operation.confidence,
            analysis_run_id: candidate.analysis_run_id,
            user_confirmed: false,
            confirmed_by: null,
            confirmed_at: null,
            deleted_at: null,
            deleted_by: null,
            created_at: now,
            updated_at: now,
          });
        }
        break;
      case "create_milestone":
        milestones.push({
          id: stableId("milestone", operation.semantic_key),
          thread_id: aggregate.thread.id,
          content: operation.content,
          status: "proposed",
          position: operation.position,
          source_type: "ai_suggested",
          derivation: operation.derivation,
          ...(operation.inference_reason
            ? { inference_reason: operation.inference_reason }
            : {}),
          source_reference_ids: operation.source_reference_ids,
          confidence: operation.confidence,
          analysis_run_id: candidate.analysis_run_id,
          user_confirmed: false,
          confirmed_by: null,
          confirmed_at: null,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        });
        break;
      case "propose_fact": {
        const confirmed = facts.find(
          (fact) => fact.semantic_key === operation.semantic_key && fact.user_confirmed,
        );
        if (confirmed && confirmed.content !== operation.content) {
          conflicts.push({
            id: stableId("conflict", `${confirmed.id}:${operation.content}`),
            thread_id: aggregate.thread.id,
            existing_entity_id: confirmed.id,
            existing_value: confirmed.content,
            candidate_value: operation.content,
            reason: "Candidate contradicts a user-confirmed fact.",
            source_reference_ids: operation.source_reference_ids,
            status: "unresolved",
            created_at: now,
          });
        } else if (!confirmed) {
          facts.push({
            id: stableId("fact", operation.semantic_key),
            semantic_key: operation.semantic_key,
            thread_id: aggregate.thread.id,
            content: operation.content,
            status: "proposed",
            source_type: proposalSource(candidate, operation),
            derivation: operation.derivation,
            ...(operation.inference_reason
              ? { inference_reason: operation.inference_reason }
              : {}),
            source_reference_ids: operation.source_reference_ids,
            confidence: operation.confidence,
            analysis_run_id: candidate.analysis_run_id,
            user_confirmed: false,
            confirmed_by: null,
            confirmed_at: null,
            relevant_date: operation.relevant_date ?? null,
            date_precision: operation.date_precision ?? "unknown",
            created_at: now,
            updated_at: now,
          });
        }
        break;
      }
      case "propose_timeline_event":
        timelineEvents.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_open_loop":
        openLoops.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_waiting_state":
        waitingStates.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_deadline":
        deadlines.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_risk":
        risks.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_recommendation":
        recommendations.push(createDerivedItem(operation, candidate, now));
        break;
      case "propose_communication":
        communications.push({
          id: stableId("communication", operation.semantic_key),
          thread_id: aggregate.thread.id,
          locale: candidate.requested_locale,
          kind: "follow_up",
          content: operation.content,
          revision_id: currentRevision.id,
          source_reference_ids: operation.source_reference_ids,
          sent: false,
          created_at: now,
        });
        break;
      case "raise_conflict": {
        const existing = facts.find((fact) => fact.id === operation.entity_id);
        if (existing) {
          conflicts.push({
            id: stableId("conflict", operation.operation_id),
            thread_id: aggregate.thread.id,
            existing_entity_id: existing.id,
            existing_value: existing.content,
            candidate_value: operation.candidate_value,
            reason: operation.reason,
            source_reference_ids: operation.source_reference_ids,
            status: "unresolved",
            created_at: now,
          });
        }
        break;
      }
      case "update_task":
      case "tombstone_task":
      case "reorder_task":
      case "update_milestone":
      case "tombstone_milestone":
        return { kind: "rejected", reason: "unauthorized_operation" };
    }
    appliedOperationIds.push(operation.operation_id);
  }

  const nextVersion = aggregate.thread.version + 1;
  const revisionId = stableId("revision", `${aggregate.thread.id}:${nextVersion}`);
  return {
    kind: "applied",
    aggregate: {
      ...aggregate,
      thread: {
        ...aggregate.thread,
        version: nextVersion,
        interpretation: candidate.current_state_summary,
        updated_at: now,
      },
      tasks,
      milestones,
      facts,
      conflicts,
      timeline_events: timelineEvents,
      open_loops: openLoops,
      waiting_states: waitingStates,
      deadlines,
      risks,
      recommendations,
      communications,
      revisions: [
        ...aggregate.revisions,
        {
          id: revisionId,
          thread_id: aggregate.thread.id,
          version: nextVersion,
          ...actor,
          command: `reconcile:${candidate.analysis_reason}`,
          change_summary: candidate.change_explanation,
          previous_version: aggregate.thread.version,
          created_at: now,
        },
      ],
      applied_analysis_run_ids: [
        ...aggregate.applied_analysis_run_ids,
        candidate.analysis_run_id,
      ],
      applied_operation_ids: appliedOperationIds,
      living_state: {
        summary: candidate.current_state_summary,
        occurred_at: null,
        date_precision: "unknown",
      },
    },
  };
}

import type {
  AnalysisGateway,
  AnalysisRequest,
} from "@/application/analysis/analysis-gateway";
import {
  candidateDeltaSchema,
  type CandidateDelta,
} from "@/domain/candidate-delta";
import { recordedFixtureActor } from "@/domain/actors";
import { stableId } from "@/domain/identity";

function initialOperations(request: AnalysisRequest): CandidateDelta["operations"] {
  const sourceIds = [request.source_reference_id];
  const taskContents = request.locale === "ko"
    ? ["첫 제안 검토하기", "성공 기준 명확히 하기", "첫 번째 근거 추가하기"]
    : ["Review the first proposal", "Clarify the success criteria", "Add the first evidence note"];
  return [
    {
      operation_id: "operation_initial_milestone",
      kind: "create_milestone",
      semantic_key: "milestone:foundation",
      content: request.locale === "ko" ? "실행 가능한 기반 만들기" : "Build an actionable foundation",
      position: 0,
      derivation: "inferred",
      inference_reason: "A small first milestone makes an open goal reviewable.",
      confidence: 0.82,
      source_reference_ids: sourceIds,
    },
    ...taskContents.map((content, index) => ({
      operation_id: `operation_initial_task_${index + 1}`,
      kind: "create_task" as const,
      semantic_key: `task:initial:${index + 1}`,
      content,
      priority: index === 0 ? "high" as const : "normal" as const,
      derivation: "inferred" as const,
      inference_reason: "The recorded adapter proposes a generic reviewable step.",
      confidence: 0.8 - index * 0.05,
      source_reference_ids: sourceIds,
    })),
    {
      operation_id: "operation_initial_fact",
      kind: "propose_fact",
      semantic_key: "fact:focus",
      content: request.locale === "ko"
        ? "현재 목표는 꾸준한 진전을 우선합니다."
        : "The current goal prioritizes steady progress.",
      derivation: "inferred",
      inference_reason: "The open goal describes a desired ongoing outcome.",
      confidence: 0.7,
      source_reference_ids: sourceIds,
      relevant_date: null,
      date_precision: "unknown",
    },
    {
      operation_id: "operation_initial_loop",
      kind: "propose_open_loop",
      semantic_key: "loop:success-criteria",
      content: request.locale === "ko" ? "성공 기준을 확인해야 합니다." : "The success criteria still need review.",
      priority: "high",
      derivation: "inferred",
      inference_reason: "No confirmed success criteria exist yet.",
      confidence: 0.86,
      source_reference_ids: sourceIds,
    },
    {
      operation_id: "operation_initial_risk",
      kind: "propose_risk",
      semantic_key: "risk:scope",
      content: request.locale === "ko" ? "범위가 넓으면 첫 행동이 흐려질 수 있습니다." : "Broad scope may obscure the first action.",
      severity: "medium",
      derivation: "inferred",
      inference_reason: "Only free-form goal context is available.",
      confidence: 0.65,
      source_reference_ids: sourceIds,
    },
    {
      operation_id: "operation_initial_recommendation",
      kind: "propose_recommendation",
      semantic_key: "recommendation:review",
      content: request.locale === "ko" ? "첫 번째 제안을 검토하고 수락하세요." : "Review and accept the first proposal.",
      priority: "high",
      derivation: "inferred",
      inference_reason: "Explicit acceptance keeps the human in control.",
      confidence: 0.92,
      source_reference_ids: sourceIds,
    },
  ];
}

function evidenceOperations(request: AnalysisRequest): CandidateDelta["operations"] {
  return [
    {
      operation_id: stableId("operation", `${request.source_reference_id}:fact`),
      kind: "propose_fact",
      semantic_key: "fact:focus",
      content: request.locale === "ko"
        ? "새 근거에 따르면 가능한 일정이 변경되었습니다."
        : "The latest evidence says the available schedule changed.",
      derivation: "direct",
      confidence: 0.94,
      source_reference_ids: [request.source_reference_id],
      relevant_date: null,
      date_precision: "unknown",
    },
    {
      operation_id: stableId("operation", `${request.source_reference_id}:loop`),
      kind: "propose_open_loop",
      semantic_key: stableId("loop", request.source_reference_id),
      content: request.locale === "ko" ? "변경된 일정에 맞춰 계획을 검토하세요." : "Review the plan against the changed schedule.",
      priority: "high",
      derivation: "direct",
      confidence: 0.9,
      source_reference_ids: [request.source_reference_id],
    },
  ];
}

export class RecordedAnalysisGateway implements AnalysisGateway {
  readonly actor = recordedFixtureActor;

  async analyze(request: AnalysisRequest): Promise<unknown> {
    const revision = request.aggregate.revisions.at(-1);
    if (!revision) throw new MissingRevisionError();
    const operations = request.reason === "initial_goal"
      ? initialOperations(request)
      : evidenceOperations(request);
    const candidate: CandidateDelta = {
      schema_version: "lifethread.candidate_delta.v1",
      thread_id: request.aggregate.thread.id,
      base_revision_id: revision.id,
      analysis_run_id: stableId(
        "analysis",
        `${request.aggregate.thread.id}:${revision.id}:${request.reason}:${request.source_reference_id}`,
      ),
      analysis_reason: request.reason,
      requested_locale: request.locale,
      detected_source_languages: [
        request.aggregate.evidence.at(-1)?.source_language ?? "en",
      ],
      operations,
      current_state_summary: request.locale === "ko"
        ? "인용 가능한 근거를 바탕으로 현재 계획을 검토할 수 있습니다."
        : "The current plan is ready for review with traceable evidence.",
      next_best_action: {
        action: request.locale === "ko" ? "첫 번째 제안을 검토하세요." : "Review the first proposal.",
        rationale: request.locale === "ko" ? "명시적 검토가 사용자 통제를 유지합니다." : "Explicit review keeps the user in control.",
        dependencies: [],
        confidence: 0.92,
        source_reference_ids: [request.source_reference_id],
        alternative: request.locale === "ko" ? "수락하기 전에 제안을 수정하세요." : "Edit the proposal before accepting it.",
      },
      change_explanation: request.locale === "ko"
        ? "인용된 제안과 다음 행동을 추가했습니다."
        : "Added cited proposals and one next action.",
    };
    return candidateDeltaSchema.parse(candidate);
  }
}

export class MissingRevisionError extends Error {
  constructor() {
    super("Analysis requires a canonical revision");
    this.name = "MissingRevisionError";
  }
}

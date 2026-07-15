import { z } from "zod";
import { canonicalStatusSchema, prioritySchema } from "@/domain/status";

const citedProposalShape = {
  operation_id: z.string().min(1),
  semantic_key: z.string().min(1),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1),
  derivation: z.enum(["direct", "inferred"]),
  inference_reason: z.string().min(1).optional(),
  source_reference_ids: z.array(z.string().min(1)).min(1),
} as const;

const candidateTaskSchema = z
  .object({
    ...citedProposalShape,
    kind: z.literal("create_task"),
    priority: prioritySchema,
    milestone_semantic_key: z.string().min(1).nullable().optional(),
  })
  .strict();

const updateTaskSchema = z
  .object({
    operation_id: z.string().min(1),
    kind: z.literal("update_task"),
    entity_id: z.string().min(1),
    expected_status: canonicalStatusSchema,
    proposed_status: canonicalStatusSchema.optional(),
    content: z.string().min(1).optional(),
    source_reference_ids: z.array(z.string().min(1)).min(1),
  })
  .strict();

const taskControlSchemas = [
  z
    .object({
      operation_id: z.string().min(1),
      kind: z.literal("tombstone_task"),
      entity_id: z.string().min(1),
      expected_status: canonicalStatusSchema,
      reason: z.string().min(1),
      source_reference_ids: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  z
    .object({
      operation_id: z.string().min(1),
      kind: z.literal("reorder_task"),
      entity_id: z.string().min(1),
      position: z.number().int().nonnegative(),
      source_reference_ids: z.array(z.string().min(1)).min(1),
    })
    .strict(),
] as const;

const milestoneSchemas = [
  z
    .object({
      ...citedProposalShape,
      kind: z.literal("create_milestone"),
      position: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      operation_id: z.string().min(1),
      kind: z.literal("update_milestone"),
      entity_id: z.string().min(1),
      expected_status: canonicalStatusSchema,
      content: z.string().min(1).optional(),
      source_reference_ids: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  z
    .object({
      operation_id: z.string().min(1),
      kind: z.literal("tombstone_milestone"),
      entity_id: z.string().min(1),
      expected_status: canonicalStatusSchema,
      reason: z.string().min(1),
      source_reference_ids: z.array(z.string().min(1)).min(1),
    })
    .strict(),
] as const;

type ProposalKind =
  | "propose_fact"
  | "propose_timeline_event"
  | "propose_open_loop"
  | "propose_waiting_state"
  | "propose_deadline"
  | "propose_risk"
  | "propose_recommendation"
  | "propose_communication";

function proposalSchema<const Kind extends ProposalKind>(kind: Kind) {
  return z
    .object({
      ...citedProposalShape,
      kind: z.literal(kind),
      priority: prioritySchema.optional(),
      severity: z.enum(["low", "medium", "high"]).optional(),
      relevant_date: z.string().nullable().optional(),
      date_precision: z
        .enum(["unknown", "day", "month", "year", "approximate"])
        .optional(),
    })
    .strict();
}

const proposalSchemas = [
  proposalSchema("propose_fact"),
  proposalSchema("propose_timeline_event"),
  proposalSchema("propose_open_loop"),
  proposalSchema("propose_waiting_state"),
  proposalSchema("propose_deadline"),
  proposalSchema("propose_risk"),
  proposalSchema("propose_recommendation"),
  proposalSchema("propose_communication"),
] as const;

const conflictProposalSchema = z
  .object({
    operation_id: z.string().min(1),
    kind: z.literal("raise_conflict"),
    entity_id: z.string().min(1),
    candidate_value: z.string().min(1),
    reason: z.string().min(1),
    source_reference_ids: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const candidateOperationSchema = z.discriminatedUnion("kind", [
  candidateTaskSchema,
  updateTaskSchema,
  ...taskControlSchemas,
  ...milestoneSchemas,
  ...proposalSchemas,
  conflictProposalSchema,
]);

export const candidateDeltaSchema = z
  .object({
    schema_version: z.literal("lifethread.candidate_delta.v1"),
    thread_id: z.string().min(1),
    base_revision_id: z.string().min(1),
    analysis_run_id: z.string().min(1),
    analysis_reason: z.enum(["initial_goal", "new_evidence", "manual_refresh"]),
    requested_locale: z.enum(["en", "ko"]),
    detected_source_languages: z.array(z.string().min(2)).min(1),
    operations: z.array(candidateOperationSchema).min(1),
    current_state_summary: z.string().min(1),
    next_best_action: z
      .object({
        action: z.string().min(1),
        rationale: z.string().min(1),
        dependencies: z.array(z.string()),
        confidence: z.number().min(0).max(1),
        source_reference_ids: z.array(z.string().min(1)).min(1),
        alternative: z.string().min(1).optional(),
      })
      .strict(),
    change_explanation: z.string().min(1),
  })
  .strict()
  .superRefine((candidate, context) => {
    candidate.operations.forEach((operation, index) => {
      if (
        "derivation" in operation &&
        operation.derivation === "inferred" &&
        !operation.inference_reason
      ) {
        context.addIssue({
          code: "custom",
          path: ["operations", index, "inference_reason"],
          message: "Inferred operations require a reason",
        });
      }
      if (
        "relevant_date" in operation &&
        operation.relevant_date &&
        (!operation.date_precision || operation.date_precision === "unknown")
      ) {
        context.addIssue({
          code: "custom",
          path: ["operations", index, "date_precision"],
          message: "A present date requires explicit precision",
        });
      }
    });
  });

export type CandidateOperation = z.infer<typeof candidateOperationSchema>;
export type CandidateDelta = z.infer<typeof candidateDeltaSchema>;

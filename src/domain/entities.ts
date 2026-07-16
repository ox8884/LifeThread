import { z } from "zod";
import { revisionActorSchema } from "@/domain/actors";
import { datePrecisionSchema, nullableTimestampSchema, timestampSchema } from "@/domain/entity-foundations";
import { provenanceSchema } from "@/domain/provenance";
import {
  canonicalStatusSchema,
  prioritySchema,
  sourceTypeSchema,
} from "@/domain/status";

export { datePrecisionSchema } from "@/domain/entity-foundations";

export const lifeThreadSchema = z
  .object({
    id: z.string().min(1),
    owner_id: z.string().uuid(),
    title: z.string().min(1),
    goal_text: z.string().min(1).max(2_000),
    desired_outcome: z.string().min(1).nullable().optional(),
    description: z.string().min(1).nullable().optional(),
    interpretation: z.string().min(1).nullable().optional(),
    goal_confirmed: z.boolean(),
    version: z.number().int().positive(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();

export const taskSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    milestone_id: z.string().min(1).nullable(),
    content: z.string().min(1),
    status: canonicalStatusSchema,
    priority: prioritySchema,
    position: z.number().int().nonnegative(),
    ...provenanceSchema.shape,
    deleted_at: nullableTimestampSchema,
    deleted_by: z.string().uuid().nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();

export const milestoneSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    content: z.string().min(1),
    status: canonicalStatusSchema,
    position: z.number().int().nonnegative(),
    ...provenanceSchema.shape,
    deleted_at: nullableTimestampSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();

export const evidenceItemSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    kind: z.enum(["goal_input", "note", "image", "pdf"]),
    note: z.string().min(1).max(50_000).nullable(),
    private_object_key: z.string().min(1).nullable(),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    media_type: z.string().min(1),
    size_bytes: z.number().int().nonnegative(),
    original_filename: z.string().min(1).nullable(),
    source_language: z.string().min(2),
    capture_date: z.string().nullable(),
    ingestion_state: z.enum(["pending", "final", "failed"]),
    created_at: timestampSchema,
    deleted_at: nullableTimestampSchema,
  })
  .strict();

export const sourceReferenceSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    evidence_id: z.string().min(1),
    locator_kind: z.enum(["text_span", "pdf_page", "image_region", "whole"]),
    locator: z.string().min(1),
    quoted_hash: z.string().regex(/^[a-f0-9]{64}$/),
    created_at: timestampSchema,
  })
  .strict();

export const factSchema = z
  .object({
    id: z.string().min(1),
    semantic_key: z.string().min(1),
    thread_id: z.string().min(1),
    content: z.string().min(1),
    status: canonicalStatusSchema,
    ...provenanceSchema.shape,
    relevant_date: z.string().nullable(),
    date_precision: datePrecisionSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();

const derivedItemSchema = z
  .object({
    id: z.string().min(1),
    semantic_key: z.string().min(1),
    thread_id: z.string().min(1),
    content: z.string().min(1),
    status: canonicalStatusSchema,
    priority: prioritySchema.optional(),
    severity: z.enum(["low", "medium", "high"]).optional(),
    source_type: sourceTypeSchema,
    source_reference_ids: z.array(z.string().min(1)).min(1),
    confidence: z.number().min(0).max(1),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .strict();

export const conflictSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    existing_entity_id: z.string().min(1),
    existing_value: z.string().min(1),
    candidate_value: z.string().min(1),
    reason: z.string().min(1),
    source_reference_ids: z.array(z.string().min(1)).min(1),
    status: z.enum(["unresolved", "resolved"]),
    created_at: timestampSchema,
  })
  .strict();

const revisionDetailsSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    version: z.number().int().positive(),
    command: z.string().min(1),
    change_summary: z.string().min(1),
    previous_version: z.number().int().nonnegative(),
    created_at: timestampSchema,
  })
  .strict();

export const revisionSchema = revisionActorSchema.and(revisionDetailsSchema);

export const communicationSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    locale: z.enum(["en", "ko"]),
    kind: z.enum(["follow_up", "email", "text", "checklist"]),
    content: z.string().min(1),
    revision_id: z.string().min(1),
    source_reference_ids: z.array(z.string().min(1)).min(1),
    sent: z.literal(false),
    created_at: timestampSchema,
  })
  .strict();

export const localizedContentSchema = z
  .object({
    entity_id: z.string().min(1),
    field: z.string().min(1),
    revision_id: z.string().min(1),
    locale: z.enum(["en", "ko"]),
    content: z.string().min(1),
    source_locale: z.string().min(2),
    translation_status: z.enum(["generated", "original_fallback", "unavailable"]),
    generator_version: z.string().min(1),
  })
  .strict();

export const analysisRunSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    input_revision_id: z.string().min(1),
    schema_version: z.literal("lifethread.candidate_delta.v1"),
    model_version: z.string().min(1),
    idempotency_key: z.string().min(1),
    outcome: z.enum(["applied", "duplicate", "rejected", "refused", "incomplete", "timeout"]),
    error_category: z.string().min(1).nullable(),
    created_at: timestampSchema,
  })
  .strict();

const userCorrectionDetailsSchema = z
  .object({
    id: z.string().min(1),
    thread_id: z.string().min(1),
    target_entity_id: z.string().min(1),
    field: z.string().min(1),
    old_value: z.string(),
    new_value: z.string(),
    source_reference_ids: z.array(z.string().min(1)),
    revision_id: z.string().min(1),
    created_at: timestampSchema,
  })
  .strict();

export const userCorrectionSchema = revisionActorSchema.and(userCorrectionDetailsSchema);

export const livingStateSchema = z
  .object({
    summary: z.string(),
    occurred_at: z.string().nullable(),
    date_precision: datePrecisionSchema,
  })
  .strict();

export const lifeThreadAggregateSchema = z
  .object({
    thread: lifeThreadSchema,
    milestones: z.array(milestoneSchema),
    tasks: z.array(taskSchema),
    evidence: z.array(evidenceItemSchema),
    source_references: z.array(sourceReferenceSchema),
    facts: z.array(factSchema),
    timeline_events: z.array(derivedItemSchema),
    open_loops: z.array(derivedItemSchema),
    waiting_states: z.array(derivedItemSchema),
    deadlines: z.array(derivedItemSchema),
    risks: z.array(derivedItemSchema),
    conflicts: z.array(conflictSchema),
    recommendations: z.array(derivedItemSchema),
    communications: z.array(communicationSchema),
    localized_content: z.array(localizedContentSchema),
    analysis_runs: z.array(analysisRunSchema),
    corrections: z.array(userCorrectionSchema),
    revisions: z.array(revisionSchema),
    applied_analysis_run_ids: z.array(z.string().min(1)),
    applied_operation_ids: z.array(z.string().min(1)),
    living_state: livingStateSchema,
  })
  .strict();

export type LifeThread = z.infer<typeof lifeThreadSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type Fact = z.infer<typeof factSchema>;
export type Conflict = z.infer<typeof conflictSchema>;
export type ThreadRevision = z.infer<typeof revisionSchema>;
export type Communication = z.infer<typeof communicationSchema>;
export type LifeThreadAggregate = z.infer<typeof lifeThreadAggregateSchema>;

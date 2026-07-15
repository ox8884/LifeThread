import { z } from "zod";

export const canonicalStatuses = [
  "proposed",
  "pending",
  "in_progress",
  "waiting",
  "blocked",
  "completed",
  "rejected",
  "uncertain",
  "overdue",
  "cancelled",
] as const;

export const canonicalStatusSchema = z.enum(canonicalStatuses);
export type CanonicalStatus = z.infer<typeof canonicalStatusSchema>;

export const sourceTypes = [
  "user_created",
  "ai_suggested",
  "evidence_extracted",
  "context_inferred",
] as const;

export const sourceTypeSchema = z.enum(sourceTypes);
export type SourceType = z.infer<typeof sourceTypeSchema>;

export const priorities = ["low", "normal", "high", "urgent"] as const;
export const prioritySchema = z.enum(priorities);
export type Priority = z.infer<typeof prioritySchema>;

export const derivations = ["direct", "inferred"] as const;
export const derivationSchema = z.enum(derivations);
export type Derivation = z.infer<typeof derivationSchema>;

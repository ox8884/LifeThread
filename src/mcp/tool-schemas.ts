import { z } from "zod";
import { candidateDeltaSchema } from "@/domain/candidate-delta";

export const listThreadsInputSchema = {};
export const getThreadInputSchema = {
  thread_id: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
};
export const proposeInputSchema = { candidate: candidateDeltaSchema };
export const decisionInputSchema = {
  thread_id: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  proposal_id: z.string().min(1).optional(),
  proposalId: z.string().min(1).optional(),
  expected_version: z.number().int().positive().optional(),
  expectedVersion: z.number().int().positive().optional(),
};

export const toolAnnotations = {
  readOnly: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  write: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
  reject: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
} as const;

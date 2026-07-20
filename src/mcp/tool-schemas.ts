import { z } from "zod";
import { candidateDeltaSchema } from "@/domain/candidate-delta";

export const listThreadsInputSchema = {};
export const getThreadInputSchema = { thread_id: z.string().min(1) };
export const proposeInputSchema = { candidate: candidateDeltaSchema };
export const decisionInputSchema = {
  thread_id: z.string().min(1),
  proposal_id: z.string().min(1),
  expected_version: z.number().int().positive(),
};

export const toolAnnotations = {
  readOnly: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  write: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
  reject: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
} as const;

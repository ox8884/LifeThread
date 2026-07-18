import { z } from "zod";
import { candidateDeltaSchema } from "@/domain/candidate-delta";

export const listThreadsInputSchema = {};
export const getThreadInputSchema = { threadId: z.string().min(1) };
export const proposeInputSchema = { candidate: candidateDeltaSchema };
export const decisionInputSchema = {
  threadId: z.string().min(1),
  proposalId: z.string().min(1),
  expectedVersion: z.number().int().positive(),
};

export const toolAnnotations = {
  readOnly: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  write: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
  reject: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
} as const;

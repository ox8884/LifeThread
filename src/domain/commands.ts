import { z } from "zod";
import { canonicalStatusSchema } from "@/domain/status";

const commandBase = {
  actor_id: z.enum(["demo_user", "model"]),
  occurred_at: z.string().datetime(),
} as const;

export const taskCommandSchema = z.discriminatedUnion("kind", [
  z.object({ ...commandBase, kind: z.literal("set_status"), status: canonicalStatusSchema }).strict(),
  z.object({ ...commandBase, kind: z.literal("tombstone") }).strict(),
  z.object({ ...commandBase, kind: z.literal("restore") }).strict(),
]);

export type TaskCommand = z.infer<typeof taskCommandSchema>;

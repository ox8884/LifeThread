import { z } from "zod";
import { derivationSchema, sourceTypeSchema } from "@/domain/status";

export const provenanceSchema = z
  .object({
    source_type: sourceTypeSchema,
    derivation: derivationSchema,
    source_reference_ids: z.array(z.string().min(1)),
    confidence: z.number().min(0).max(1).nullable(),
    analysis_run_id: z.string().min(1).nullable(),
    inference_reason: z.string().min(1).nullable().optional(),
    user_confirmed: z.boolean(),
    confirmed_by: z.string().uuid().nullable(),
    confirmed_at: z.string().datetime().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.derivation === "inferred" && !value.inference_reason) {
      context.addIssue({
        code: "custom",
        path: ["inference_reason"],
        message: "Inferred provenance requires a reason",
      });
    }
  });

export type Provenance = z.infer<typeof provenanceSchema>;

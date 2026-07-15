import { z } from "zod";

export const timestampSchema = z.string().datetime();
export const nullableTimestampSchema = timestampSchema.nullable();

export const datePrecisionSchema = z.enum([
  "unknown",
  "day",
  "month",
  "year",
  "approximate",
]);

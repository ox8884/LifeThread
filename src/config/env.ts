import { z } from "zod";

export const liveEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
});

export type LiveEnvironment = z.infer<typeof liveEnvironmentSchema>;

export function readLiveEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): LiveEnvironment {
  return liveEnvironmentSchema.parse(environment);
}

export function missingLiveEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const result = liveEnvironmentSchema.safeParse(environment);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

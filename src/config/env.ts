import { z } from "zod";

export const runtimeEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type RuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export function readRuntimeEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): RuntimeEnvironment {
  return runtimeEnvironmentSchema.parse(environment);
}

export function missingRuntimeEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const result = runtimeEnvironmentSchema.safeParse(environment);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

export function hasRuntimeEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  return runtimeEnvironmentSchema.safeParse(environment).success;
}

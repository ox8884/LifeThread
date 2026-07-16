import { createBrowserClient } from "@supabase/ssr";
import { readRuntimeEnvironment } from "@/config/env";

export function createBrowserSupabaseClient() {
  const environment = readRuntimeEnvironment(process.env);
  return createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

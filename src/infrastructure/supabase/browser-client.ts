import { createBrowserClient } from "@supabase/ssr";
import { readRuntimeEnvironment } from "@/config/env";

export function createBrowserSupabaseClient() {
  const environment = readRuntimeEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  });
  return createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

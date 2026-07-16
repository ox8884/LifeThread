import { createClient } from "@supabase/supabase-js";
import { readRuntimeEnvironment } from "@/config/env";

export function createTokenSupabaseClient(accessToken: string) {
  const environment = readRuntimeEnvironment(process.env);
  return createClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}

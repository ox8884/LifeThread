import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readRuntimeEnvironment } from "@/config/env";

function copyAuthHeaders(target: Headers | undefined, headers: Readonly<Record<string, string>>): void {
  if (!target) return;
  for (const [name, value] of Object.entries(headers)) target.set(name, value);
}

export function isReadOnlyCookieMutationError(error: unknown): boolean {
  return error instanceof Error
    && error.message.includes("Cookies can only be modified in a Server Action or Route Handler");
}

export async function createServerSupabaseClient(responseHeaders?: Headers) {
  const environment = readRuntimeEnvironment(process.env);
  const cookieStore = await cookies();
  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet, headers) => {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch (error) {
            if (!isReadOnlyCookieMutationError(error)) throw error;
          }
          copyAuthHeaders(responseHeaders, headers);
        },
      },
    },
  );
}

export function applyAuthHeaders<T extends Response>(response: T, headers: Headers): T {
  headers.forEach((value, name) => response.headers.set(name, value));
  return response;
}

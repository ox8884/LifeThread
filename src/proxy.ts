import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasRuntimeEnvironment, readRuntimeEnvironment } from "@/config/env";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!hasRuntimeEnvironment(process.env)) return NextResponse.next({ request });

  const environment = readRuntimeEnvironment(process.env);
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          const preservedHeaders = new Headers(response.headers);
          response = NextResponse.next({ request });
          preservedHeaders.forEach((value, name) => response.headers.set(name, value));
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

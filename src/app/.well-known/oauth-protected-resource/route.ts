import { protectedResourceHandler } from "mcp-handler";

function siteUrl(request: Request): string {
  const configured = process.env["NEXT_PUBLIC_SITE_URL"];
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function authorizationServerUrl(): string {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "https://dxvezjynrchtcfwkvrvh.supabase.co";
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}

export function GET(request: Request): Response {
  const site = siteUrl(request);
  return protectedResourceHandler({
    authServerUrls: [authorizationServerUrl()],
    resourceUrl: `${site}/mcp`,
  })(request);
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}

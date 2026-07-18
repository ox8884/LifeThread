import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerLifeThreadTools } from "@/mcp/register-tools";
import { verifyMcpToken } from "@/mcp/auth";

const mcpHandler = createMcpHandler(
  (server) => registerLifeThreadTools(server),
  { serverInfo: { name: "LifeThread", version: "1.0.0" } },
  { basePath: "/", maxDuration: 60, disableSse: true },
);

const configuredSiteUrl = process.env["NEXT_PUBLIC_SITE_URL"];
const authOptions = {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
  ...(configuredSiteUrl ? { resourceUrl: configuredSiteUrl.replace(/\/$/, "") } : {}),
};

const authenticatedHandler = withMcpAuth(mcpHandler, verifyMcpToken, authOptions);

export const GET = authenticatedHandler;
export const POST = authenticatedHandler;
export const DELETE = authenticatedHandler;

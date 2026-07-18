import { z } from "zod";

const baseUrl = (process.env["LIFETHREAD_BASE_URL"] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const metadataSchema = z.object({ resource: z.string().url(), authorization_servers: z.array(z.string().url()).min(1) }).strict();

async function main(): Promise<void> {
  const mcpResponse = await fetch(`${baseUrl}/mcp`);
  const challenge = mcpResponse.headers.get("www-authenticate") ?? "";
  if (mcpResponse.status !== 401 || !challenge.includes("resource_metadata=")) {
    throw new Error(`MCP auth challenge failed: ${mcpResponse.status}`);
  }
  const metadataResponse = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
  const metadata = metadataSchema.parse(await metadataResponse.json());
  const resourcePath = metadata.resource ? new URL(metadata.resource).pathname : "";
  if (metadataResponse.status !== 200 || resourcePath !== "/mcp" || !metadata.authorization_servers?.length) {
    throw new Error("Protected-resource metadata contract failed");
  }
  console.log(JSON.stringify({ baseUrl, mcpStatus: mcpResponse.status, metadataStatus: metadataResponse.status, resource: metadata.resource }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "MCP smoke failed");
  process.exitCode = 1;
});

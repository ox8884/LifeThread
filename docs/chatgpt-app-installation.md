# Connect LifeThread to ChatGPT

LifeThread exposes a public MCP endpoint at:

`https://lifethread-inky.vercel.app/mcp`

In ChatGPT Developer mode:

1. Open Settings → Apps/Connectors → Developer mode.
2. Add the MCP endpoint above.
3. Complete the Supabase OAuth consent screen with the same LifeThread account.
4. Ask ChatGPT to list your LifeThreads, then request a cited proposal for one goal.
5. Keep the LifeThread web thread open. Supabase Realtime refreshes it after the proposal is saved.
6. Accept or reject proposals explicitly from the web workspace.

ChatGPT suggestions are proposals only. LifeThread does not use an OpenAI API key, does not run background prompts, and never marks a task complete or confirms a fact from an AI response alone.

If the connector reports `401`, check that the endpoint is exactly `/mcp` and complete OAuth again. The protected-resource metadata endpoint is `/.well-known/oauth-protected-resource`.

# Free runtime behavior

- Web hosting uses the existing Vercel Hobby project.
- Auth, Postgres, OAuth, and Realtime use Supabase's free-capable surfaces.
- ChatGPT supplies reasoning through the connected user's ChatGPT account; LifeThread does not call the OpenAI Responses API.
- There is no `OPENAI_API_KEY`, billing flow, upgrade screen, or service-role key in normal runtime.
- Realtime is a notification channel. The browser refetches the owner-scoped aggregate instead of trusting event payloads.
- If Realtime pauses, the workspace keeps a visible manual refresh path.

Free-tier limits still depend on the current provider plans and may require a maintainer to monitor quotas before a public demo.

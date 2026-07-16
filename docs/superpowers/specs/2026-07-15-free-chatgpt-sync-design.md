# LifeThread Free ChatGPT Sync Design

Status: approved for implementation planning on 2026-07-15

## 1. Decision

LifeThread will remain a standalone web application for managing multiple goals, while ChatGPT supplies AI reasoning through a LifeThread ChatGPT app. The web application and ChatGPT app share the same authenticated Supabase data. ChatGPT-generated changes are written as reviewable proposals and appear automatically in the open web dashboard through Supabase Realtime.

The runtime will not call the OpenAI API, request an API key, or contain a paid upgrade path. A user on ChatGPT Free can use the models and limits available to that account; a user on Go, Plus, Pro, or another eligible plan receives the model quality and limits included in that plan.

## 2. Product outcome

A user can:

1. Create and track multiple independent LifeThreads on the web.
2. Choose one LifeThread and request suggestions from ChatGPT.
3. Continue in the LifeThread ChatGPT app with the selected thread already identified.
4. Let ChatGPT read the minimum current state and propose a structured update.
5. See the proposal appear on the web without refreshing while Realtime is available.
6. Accept, edit, or reject each proposal before it changes confirmed state.
7. Continue using existing goals and records when ChatGPT is unavailable or its account limit is exhausted.

## 3. Free-use contract

The hackathon build is designed around services that can be operated at no charge within their published free quotas:

- ChatGPT Apps SDK and the user's own ChatGPT account provide model reasoning.
- Supabase Free provides authentication, Postgres, Row Level Security, OAuth 2.1, and Realtime.
- Vercel Hobby hosts the Next.js website and public MCP endpoint.
- GitHub hosts the repository.

LifeThread will not:

- call the OpenAI Responses API in the user-facing runtime;
- ask a user for an OpenAI API key;
- collect payment details or silently enable paid infrastructure;
- automatically apply an AI proposal to confirmed state;
- promise unlimited service beyond third-party free quotas.

If a free quota is reached, the application degrades instead of incurring an overage charge. Realtime falls back to manual refresh, ChatGPT limits pause only AI generation, and infrastructure failures preserve the last confirmed state. On Vercel Hobby or Supabase Free, the provider may restrict or pause the project after quota or inactivity limits; the product must describe that honestly rather than imply an SLA.

Current reference limits used for the hackathon capacity plan are Supabase Free's 2 million Realtime messages per month and 200 concurrent Realtime connections. Vercel Hobby is a zero-dollar plan with usage caps and no purchasable overage on that plan. These values are operational assumptions, not permanent product guarantees, and must be rechecked before submission.

## 4. Architecture

```text
LifeThread web on Vercel
  -> Supabase Auth session
  -> LifeThread application services
  -> Supabase Postgres aggregate + revisions
  -> Supabase Realtime subscription

ChatGPT with LifeThread app
  -> Supabase OAuth 2.1 authorization
  -> LifeThread MCP tools on /mcp
  -> existing application services and domain policies
  -> Supabase Postgres aggregate + revisions
  -> Realtime update appears in the web dashboard
```

### Web application

The Next.js application remains the primary management surface. It owns multi-thread navigation, goal creation, progress views, evidence entry, proposal review, and explicit accept/edit/reject actions. The existing action-first workspace remains the detail view for one LifeThread; a new authenticated dashboard lists all LifeThreads.

### ChatGPT app

The ChatGPT app is the AI reasoning surface. It exposes a compact widget and MCP tools, not a second independent source of truth. The model reads structured thread context returned by a tool and submits a closed `CandidateDelta` proposal through another tool. The app is model-agnostic and does not select or pay for a model itself.

### MCP server

The public HTTPS `/mcp` endpoint runs with the web deployment. It:

- validates the Supabase OAuth access token;
- resolves the authenticated LifeThread owner;
- exposes only bounded, user-scoped tools;
- delegates mutations to existing application services;
- returns structured state and stable IDs;
- never writes confirmed state directly from model output.

Initial tools are:

- `list_lifethreads`: return the authenticated user's thread summaries.
- `get_lifethread`: return minimum current state for one owned thread.
- `propose_lifethread_update`: validate and reconcile one `CandidateDelta` as unconfirmed proposals.
- `accept_lifethread_proposal`: explicit user-authorized acceptance of one proposal.
- `reject_lifethread_proposal`: explicit user-authorized rejection of one proposal.

Acceptance and rejection remain available in both the ChatGPT widget and the web dashboard. The same domain command and optimistic version check serve both surfaces.

### Supabase

Supabase is the authoritative identity and business-data service. The existing aggregate, revision, analysis-run, evidence, and source-reference model remains in place. The migration replaces the fixed `demo_user` ownership assumption with an authenticated `owner_id` linked to `auth.users` and updates repository queries to address multiple threads.

The migration also replaces the current revision actor constraint with `actor_type = user | chatgpt_app | recorded_fixture` plus nullable `actor_user_id`. `actor_user_id` is required for `user` and `chatgpt_app` revisions and must equal the authenticated owner. This preserves whether an action came from the web or ChatGPT without treating either surface as a separate identity.

No separate model-owned proposal database is introduced. `propose_lifethread_update` passes the model output through the existing Zod `CandidateDelta` schema and deterministic reconciler. Accepted operations enter the aggregate as `proposed` and unconfirmed, retain `analysis_run_id` and provenance, and are grouped in the existing review experience. Confirmed values remain protected.

Row Level Security restricts every table and Realtime subscription to `auth.uid() = owner_id`. Private evidence objects use owner-scoped paths and remain inaccessible through public URLs.

## 5. Identity and authorization flow

1. The user creates a free LifeThread account using Supabase email/password authentication. Paid SMS, custom SMTP, and paid identity providers are outside the hackathon scope.
2. The web session reads and writes only rows owned by that Supabase user.
3. On first use of the ChatGPT app, ChatGPT starts the Supabase OAuth 2.1 authorization-code flow with PKCE.
4. The user signs into the same LifeThread account and approves access.
5. ChatGPT sends the resulting access token with MCP requests.
6. The MCP server validates the token, audience, expiry, and ownership before every tool call.

Thread IDs are stable references, not authorization. Possession of a thread ID never grants access.

## 6. Suggestion and synchronization flow

1. The web user opens a LifeThread and selects `Get suggestions with ChatGPT`.
2. LifeThread opens the ChatGPT app with a starter prompt or entry argument containing the thread ID and desired locale.
3. ChatGPT calls `get_lifethread`; the MCP server returns the minimum current revision, goal, proposed tasks, confirmed facts, open loops, unresolved conflicts, and source-reference metadata.
4. The model constructs a `lifethread.candidate_delta.v1` proposal and calls `propose_lifethread_update`.
5. The MCP server parses the closed schema, verifies same-thread citations and base revision, runs deterministic reconciliation, and persists one revision atomically.
6. Proposed items stay unconfirmed and are visible in the existing review area.
7. Supabase Realtime emits the owned `life_threads` update. The web client refetches the authoritative aggregate and renders the new proposal cards.
8. The user accepts, edits, or rejects proposals from either surface. That explicit command creates the next revision and appears on the other surface.

The web button cannot silently run ChatGPT in the background. It starts or opens an explicit ChatGPT interaction. Automatic behavior begins after ChatGPT calls the MCP proposal tool.

## 7. Concurrency and integrity

- Every proposal names a base revision and uses an idempotency key.
- A stale proposal performs no write and asks ChatGPT to reload the thread.
- Exact replay returns the existing result without creating a new revision.
- Conflicts with confirmed facts create visible conflicts; they never overwrite the fact.
- Unknown operations, cross-thread IDs, unresolved citations, invented exact dates, and confirmation fields are rejected.
- Realtime events are notifications, not truth. Both clients refetch the authoritative aggregate after an event.

## 8. Failure and free-quota behavior

| Condition | User-visible behavior | Data behavior |
| --- | --- | --- |
| ChatGPT Free usage limit reached | Explain that AI suggestions can be retried when the account limit resets | Existing web data remains usable |
| ChatGPT tool call fails | Keep `Waiting for ChatGPT` retry action; do not claim a proposal exists | No canonical mutation |
| OAuth missing or expired | Ask the user to reconnect LifeThread | No tool data is returned |
| Candidate schema or policy rejection | Show a safe retry message in ChatGPT | No canonical mutation except a safe analysis outcome when authorized |
| Stale base revision | Reload current state and ask the model to regenerate | No write |
| Realtime unavailable or quota-limited | Show `Live sync paused` and a manual refresh action | Database remains authoritative |
| Supabase write unavailable or database quota reached | Show a non-destructive save failure and retain the local form input for retry | No partial revision |
| Vercel Hobby limit or provider outage | Public surface may be unavailable until service resumes | No paid overage is enabled |

The application must never suggest that paying LifeThread will restore service. A user's optional ChatGPT plan affects only the model and limits available in ChatGPT.

## 9. Privacy and safety

- MCP tools return only the selected thread and minimum context required for the requested operation.
- Raw access tokens, prompts, evidence, model output, and personal content never enter logs.
- ChatGPT output is untrusted input until schema, ownership, revision, provenance, and policy validation pass.
- AI content is labeled as suggested and remains reversible.
- External sending, autonomous completion, physical evidence deletion, and conflict resolution always require explicit user actions outside model-only proposals.

## 10. Verification design

### Automated

- Domain tests preserve current CandidateDelta, confirmation, provenance, idempotency, and stale-version behavior.
- Repository integration tests prove one Supabase user cannot read or mutate another user's rows.
- MCP contract tests cover tool discovery, OAuth failure, ownership, closed schemas, structured results, replay, and stale revisions.
- Realtime integration tests prove an MCP-originated proposal causes an owned web client to refetch and display reviewable items.
- Web Playwright tests cover sign-up/sign-in, multiple thread creation, switching threads, manual refresh fallback, proposal review, and bilingual labels.

### Manual

- Connect the deployed `/mcp` endpoint to ChatGPT developer mode.
- Sign into the same LifeThread account in ChatGPT and the Vercel web app.
- Create at least two distinct goals.
- Request a GPT-5.6 proposal for one goal.
- Observe the proposal appear on the already-open web page without refresh.
- Accept one item on the web and observe the updated state from ChatGPT.
- Repeat once with Korean input and once with mixed Korean/English input.
- Disable Realtime locally or in a test fixture and verify manual refresh still reveals the saved proposal.

## 11. Hackathon delivery

LifeThread will enter the `Apps for Your Life` category. The submission presents the ChatGPT app as the AI layer and the Vercel website as the multi-goal management and public testing surface.

The repository README will include:

- free architecture and quota boundaries;
- ChatGPT developer-mode installation instructions;
- Supabase/Vercel setup instructions for maintainers;
- judge test credentials or a documented free test flow;
- exact GPT-5.6 and Codex contribution points;
- the majority-build Codex `/feedback` session ID;
- a distinction between pre-hackathon code and work added during the submission period.

The public video will be under three minutes and show goal creation, GPT-5.6 proposal generation, automatic web synchronization, explicit acceptance, and multi-goal navigation.

## 12. Scope boundaries

Included for the hackathon:

- free Supabase authentication and OAuth connection;
- multiple private LifeThreads per user;
- ChatGPT Apps SDK widget and MCP tools;
- structured AI proposals using the user's ChatGPT plan;
- automatic web synchronization with manual refresh fallback;
- bilingual Korean/English behavior;
- public Vercel demo and judge instructions.

Excluded:

- OpenAI API usage and API-key entry;
- billing, subscriptions, donations, or paid infrastructure fallback;
- collaboration or public sharing;
- background autonomous agents, scheduled model calls, or notifications;
- custom domains, paid SMTP/SMS, paid analytics, and production SLA claims;
- automatic acceptance of model proposals;
- migration to a separate microservice architecture.

## 13. Sources

- [OpenAI Apps SDK: Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt)
- [OpenAI Apps SDK: Build your MCP server](https://developers.openai.com/apps-sdk/build/mcp-server)
- [OpenAI Apps SDK: Managing State](https://developers.openai.com/apps-sdk/build/state-management)
- [OpenAI Apps SDK: User Interaction](https://developers.openai.com/apps-sdk/concepts/user-interaction)
- [Supabase OAuth 2.1 Server](https://supabase.com/docs/guides/auth/oauth-server)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase cost control](https://supabase.com/docs/guides/platform/cost-control)
- [Vercel pricing](https://vercel.com/pricing)
- [OpenAI Build Week official rules](https://openai.devpost.com/rules)

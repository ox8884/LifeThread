# LifeThread Free ChatGPT Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-user recorded-fixture demo into a free, authenticated, multi-goal LifeThread web app whose ChatGPT app writes reviewable proposals through MCP and whose open web workspace refreshes through Supabase Realtime.

**Architecture:** Keep one Next.js modular monolith on Vercel. Supabase Auth establishes the same user identity for the browser and ChatGPT OAuth flow; a user-scoped Supabase repository persists complete LifeThread aggregates with optimistic revisions; `mcp-handler` exposes stateless Streamable HTTP tools at `/mcp`; `@modelcontextprotocol/ext-apps` serves a compact review widget; Realtime events only trigger an authoritative server refetch. No OpenAI API or LifeThread billing path exists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict mode, Zod 4, Supabase Auth/Postgres/RLS/Realtime/OAuth 2.1, `@supabase/ssr`, `mcp-handler`, `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, Vitest, Testing Library, Playwright, pnpm, Vercel Hobby.

## Global Constraints

- Preserve `Lifethread project.md` as an untracked user-owned file; never stage, edit, or delete it.
- Keep English and Korean routes behaviorally equivalent.
- Do not call the OpenAI Responses API, accept an OpenAI API key, or add billing/upgrade UI.
- Treat ChatGPT output as untrusted input. Every write must pass authentication, ownership, Zod schema validation, citation checks, base-revision checks, idempotency checks, and deterministic domain reconciliation.
- AI output may create only reviewable `proposed` state. It may not confirm facts, mark tasks complete, resolve conflicts, send communications, or delete evidence.
- Thread IDs are locators, never credentials. Every repository query and Realtime subscription must be owner-scoped.
- Realtime is a notification channel. On every valid event, refetch the aggregate from the authoritative repository.
- Use the Supabase publishable key in browser/server user clients. Never expose the service-role key to the browser or use it for user-facing authorization.
- Pin all newly installed package versions in `package.json` and commit the corresponding `pnpm-lock.yaml` update.
- Use Lore-format commit messages from `AGENTS.md` and make one commit per task after its verification passes.
- Before claiming completion, run all unit, integration, browser, build, MCP Inspector, deployed OAuth, and deployed ChatGPT checks listed in Task 8.

---

## Planned File Structure

### Domain and application boundaries

- Modify `src/domain/entities.ts`: replace `demo_user_id` with `owner_id`; replace scalar revision actor with `actor_type` and `actor_user_id`; retain proposal provenance and `analysis_run_id`.
- Modify `src/domain/provenance.ts`: use authenticated user IDs for confirmation/deletion metadata and attach nullable proposal run IDs.
- Add `src/domain/actors.ts`: closed actor schema and helpers shared by web, recorded fixtures, and ChatGPT.
- Modify `src/domain/lifethread-aggregate.ts`, `src/domain/transitions.ts`, and command services: receive an authenticated actor instead of the `demo_user` literal.
- Modify `src/application/threads/thread-repository.ts`: owner- and thread-addressed collection repository contract.
- Add `src/application/threads/list-threads.ts` and `src/application/threads/get-thread.ts`: read use cases shared by web and MCP.
- Add `src/application/proposals/proposal-commands.ts`: accept, edit, and reject one proposed entity with optimistic locking.
- Add `src/application/analysis/propose-candidate.ts`: one authenticated application service for schema validation, reconciliation, replay, and persistence.

### Supabase and authentication

- Add `supabase/migrations/0003_authenticated_multithread.sql`: authenticated ownership, RLS, atomic optimistic save RPC, Realtime publication, OAuth-compatible grants, and private Storage policies.
- Add `src/infrastructure/supabase/browser-client.ts`, `server-client.ts`, and `token-client.ts`: browser cookies, server cookies, and bearer-token clients.
- Add `src/infrastructure/supabase/supabase-thread-repository.ts`: production aggregate repository.
- Add `src/infrastructure/auth/require-user.ts`: verified user-claim boundary.
- Add `src/proxy.ts`: Supabase SSR session refresh for protected routes.
- Add `src/app/[locale]/sign-in/page.tsx`, `src/app/[locale]/sign-up/page.tsx`, and `src/app/auth/callback/route.ts`: free email/password authentication.
- Add `src/app/oauth/consent/page.tsx` and `src/app/api/oauth/decision/route.ts`: Supabase OAuth 2.1 approval/denial UI for ChatGPT.

### Web product surface

- Change `src/app/[locale]/page.tsx` into the authenticated multi-thread dashboard.
- Add `src/app/[locale]/threads/[threadId]/page.tsx`: the existing action-first workspace detail route.
- Modify `src/app/[locale]/actions.ts`: user- and thread-scoped server actions.
- Add `src/components/threads/thread-dashboard.tsx`, `thread-card.tsx`, and `new-thread-form.tsx`.
- Add `src/components/threads/realtime-thread-sync.tsx`: filtered subscription, reconnect state, and manual refresh fallback.
- Modify `src/components/threads/workspace.tsx`, `workspace-header.tsx`, and `candidate-review.tsx`: dashboard navigation, ChatGPT entry, grouped proposal runs, and sync status.
- Modify `messages/en.json`, `messages/ko.json`, and `src/app/globals.css` for the new states without changing the approved visual direction.

### ChatGPT app and MCP

- Add `src/mcp/auth.ts`: bearer validation and MCP `AuthInfo` mapping.
- Add `src/mcp/tool-schemas.ts`: closed input/output schemas and minimal thread projections.
- Add `src/mcp/register-tools.ts`: five bounded LifeThread tools with required MCP impact annotations.
- Add `src/mcp/widget.ts`: versioned inline MCP Apps HTML/CSS/JS resource.
- Add `src/app/mcp/route.ts`: stateless Streamable HTTP handler for `GET`, `POST`, and `DELETE`.
- Add `src/app/.well-known/oauth-protected-resource/route.ts`: RFC 9728 metadata pointing to Supabase's OAuth issuer.
- Add `scripts/mcp/smoke.ts`: authenticated tool discovery and contract smoke test.

### Tests and delivery

- Modify fixtures and current tests under `tests/domain`, `tests/application`, `tests/ai`, and `tests/integration` for authenticated actors and multi-thread addressing.
- Add `tests/integration/supabase-auth-repository.test.ts`, `tests/mcp/tools.test.ts`, `tests/mcp/auth.test.ts`, and `tests/components/realtime-thread-sync.test.tsx`.
- Replace the single-demo Playwright journey with `e2e/authenticated-multithread.spec.ts` and `e2e/realtime-proposal.spec.ts` while retaining action-first workspace assertions.
- Update `.env.example`, `README.md`, `docs/demo-plan.md`, `docs/acceptance-criteria.md`, and `docs/build-log.md` with the free architecture and judge flow.

---

## Task 1: Enforce the Free Runtime and Authenticated Domain Contract

**Files:**

- Create: `src/domain/actors.ts`
- Modify: `src/domain/entities.ts`
- Modify: `src/domain/provenance.ts`
- Modify: `src/domain/lifethread-aggregate.ts`
- Modify: `src/domain/transitions.ts`
- Modify: `src/application/analysis/reconcile-candidate.ts`
- Modify: `src/application/analysis/reconcile-support.ts`
- Modify: `src/application/threads/create-thread.ts`
- Modify: `src/application/tasks/task-commands.ts`
- Modify: `src/application/facts/confirm-fact.ts`
- Modify: `src/application/evidence/ingest-evidence.ts`
- Modify: `src/application/communication/generate-draft.ts`
- Modify: `src/config/env.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.example`
- Delete: `src/infrastructure/openai/responses-gateway.ts`
- Delete: `scripts/ai/smoke.ts`
- Modify: `tests/fixtures/domain.ts`
- Modify: `tests/domain/contracts.test.ts`
- Modify: `tests/domain/aggregate.test.ts`
- Modify: `tests/domain/transitions.test.ts`
- Modify: `tests/ai/reconciler.test.ts`
- Modify: `tests/foundation/config.test.ts`

- [ ] **Step 1: Write failing actor, ownership, and free-environment tests**

Add assertions that:

```ts
expect(lifeThreadAggregateSchema.parse(fixture).thread.owner_id).toBe(USER_ID);
expect(revisionSchema.parse(userRevision)).toMatchObject({
  actor_type: "user",
  actor_user_id: USER_ID,
});
expect(() => revisionSchema.parse({
  ...userRevision,
  actor_type: "chatgpt_app",
  actor_user_id: null,
})).toThrow();
expect(missingRuntimeEnvironment({})).toEqual([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]);
```

Also assert that an AI-created task has `analysis_run_id`, stays `status: "proposed"`, and has `confirmed_by: null`.

- [ ] **Step 2: Run the focused tests and confirm the intended failures**

Run:

```bash
pnpm vitest run tests/domain/contracts.test.ts tests/domain/aggregate.test.ts tests/domain/transitions.test.ts tests/ai/reconciler.test.ts tests/foundation/config.test.ts
```

Expected: failures mention missing `owner_id`, unsupported actor fields, missing `analysis_run_id`, and the obsolete OpenAI/service-role environment contract.

- [ ] **Step 3: Implement the closed actor and provenance types**

Use this discriminated shape in `src/domain/actors.ts`:

```ts
export const revisionActorSchema = z.discriminatedUnion("actor_type", [
  z.object({ actor_type: z.literal("recorded_fixture"), actor_user_id: z.null() }).strict(),
  z.object({ actor_type: z.literal("user"), actor_user_id: z.string().uuid() }).strict(),
  z.object({ actor_type: z.literal("chatgpt_app"), actor_user_id: z.string().uuid() }).strict(),
]);

export type RevisionActor = z.infer<typeof revisionActorSchema>;
```

Replace every `demo_user` literal in domain mutations with an explicit `owner_id` or `RevisionActor`. Require `actor_user_id === aggregate.thread.owner_id` before user or ChatGPT mutations. Add `analysis_run_id: string | null` to provenance and populate it from `CandidateDelta.analysis_run_id` only for reconciled AI proposals.

- [ ] **Step 4: Make reconciliation actor-explicit and keep AI writes tentative**

Change the signature to:

```ts
reconcileCandidate(
  aggregate: LifeThreadAggregate,
  candidate: CandidateDelta,
  now: string,
  actor: RevisionActor,
): ReconciliationResult
```

Use `recorded_fixture` only from the recorded demo adapter and `chatgpt_app` only from the authenticated MCP service. Reject an actor whose user ID does not own the aggregate. Do not add an AI operation that can set confirmation fields or completed/deleted states.

- [ ] **Step 5: Remove the OpenAI API runtime surface**

Run:

```bash
pnpm remove openai
```

Delete the Responses gateway and smoke script. Change `.env.example` and `src/config/env.ts` so normal runtime requires only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; keep `SUPABASE_SERVICE_ROLE_KEY` in a separately named maintainer-only schema only if a test/reset script still requires it. No browser or MCP request may import that schema.

- [ ] **Step 6: Run focused and full unit checks**

Run:

```bash
pnpm typecheck
pnpm vitest run tests/domain tests/ai tests/foundation/config.test.ts
```

Expected: all pass; `rg -n "OPENAI_API_KEY|ResponsesGateway|demo_user" src package.json .env.example` returns no production-runtime match.

- [ ] **Step 7: Commit the domain boundary**

Commit intent: `Protect free usage with authenticated domain actors`

---

## Task 2: Build the Owner-Scoped Multi-Thread Repository and Database

**Files:**

- Modify: `src/application/threads/thread-repository.ts`
- Modify: `src/application/threads/create-thread.ts`
- Create: `src/application/threads/list-threads.ts`
- Create: `src/application/threads/get-thread.ts`
- Modify: `src/infrastructure/local/json-thread-repository.ts`
- Create: `src/infrastructure/supabase/supabase-thread-repository.ts`
- Create: `src/infrastructure/supabase/repository-client.ts`
- Modify: `src/infrastructure/runtime.ts`
- Create: `supabase/migrations/0003_authenticated_multithread.sql`
- Modify: `tests/integration/local-repositories.test.ts`
- Create: `tests/integration/supabase-auth-repository.test.ts`
- Modify: `tests/application/vertical-slice.test.ts`

- [ ] **Step 1: Write failing collection-repository tests**

Define and test this contract:

```ts
export type ThreadSummary = Readonly<{
  id: string;
  title: string;
  goal_text: string;
  version: number;
  updated_at: string;
  review_count: number;
}>;

export interface ThreadRepository {
  list(ownerId: string): Promise<readonly ThreadSummary[]>;
  load(ownerId: string, threadId: string): Promise<LifeThreadAggregate | null>;
  save(ownerId: string, aggregate: LifeThreadAggregate, expectedVersion: number | null): Promise<SaveResult>;
  resetOwner(ownerId: string): Promise<void>;
}
```

Tests must prove two goals with identical text receive distinct IDs, one owner can list both, a second owner lists neither, cross-owner load returns `null`, and stale saves preserve the winning revision.

- [ ] **Step 2: Run the repository tests and observe interface failures**

Run:

```bash
pnpm vitest run tests/integration/local-repositories.test.ts tests/application/vertical-slice.test.ts
```

Expected: compile/test failures show the old zero-argument `load()` and single-file semantics.

- [ ] **Step 3: Implement the collection contract in application and local adapters**

Generate thread IDs from `ownerId + now + normalized goal`, not goal alone. Store a versioned local envelope containing multiple aggregates so deterministic tests and offline demo tooling remain possible. Sort summaries by `updated_at` descending and derive `review_count` through `projectLivingState`.

- [ ] **Step 4: Add the authenticated migration**

In `0003_authenticated_multithread.sql`:

- replace `demo_profiles` ownership with `owner_id uuid references auth.users(id) on delete cascade`;
- add `owner_id` to every child table and enforce composite owner/thread foreign keys;
- replace `thread_revisions.actor` with `actor_type` and nullable `actor_user_id` checks matching the domain union;
- grant only required `select`, `insert`, and `update` privileges to `authenticated`;
- create indexed RLS policies whose `using` and `with check` clauses require `auth.uid() = owner_id`;
- add `public.save_lifethread_aggregate(p_thread_id text, p_expected_version integer, p_aggregate jsonb)` as a security-invoker transaction that validates aggregate owner, inserts on `null`, updates only on the expected version, and returns `saved` or `stale_version` plus actual version;
- append the newest revision, analysis run, evidence metadata, and source references inside the same transaction with idempotent conflict handling;
- add `life_threads` to `supabase_realtime` publication;
- add private Storage policies requiring the first object-path segment to equal `auth.uid()::text`.

The migration may remove the fixed demo bootstrap row because there is no production user data to preserve in the current hackathon deployment. Record that decision in the migration comment and build log.

- [ ] **Step 5: Implement the Supabase repository through user clients only**

The repository receives an authenticated `SupabaseClient` and never a service-role key. `list` selects summary columns; `load` selects one owner-scoped aggregate and parses it with `lifeThreadAggregateSchema`; `save` calls the atomic RPC and maps its closed response to `SaveResult`.

- [ ] **Step 6: Prove RLS and optimistic locking locally**

Run Supabase locally, reset migrations, and execute:

```bash
supabase start
supabase db reset
pnpm vitest run tests/integration/supabase-auth-repository.test.ts
```

Expected: two JWT-authenticated test users can mutate only their own rows; a stale write returns the actual version; no partial child rows remain after a rejected save.

- [ ] **Step 7: Run static and integration verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test:integration
```

- [ ] **Step 8: Commit the persistence boundary**

Commit intent: `Make every LifeThread private and independently addressable`

---

## Task 3: Add Free Web Authentication and Supabase OAuth Consent

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/infrastructure/supabase/browser-client.ts`
- Create: `src/infrastructure/supabase/server-client.ts`
- Create: `src/infrastructure/supabase/token-client.ts`
- Create: `src/infrastructure/auth/require-user.ts`
- Create: `src/proxy.ts`
- Create: `src/app/[locale]/sign-in/page.tsx`
- Create: `src/app/[locale]/sign-up/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/app/oauth/consent/page.tsx`
- Create: `src/app/api/oauth/decision/route.ts`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Create: `tests/integration/auth-boundary.test.ts`
- Create: `e2e/authentication.spec.ts`

- [ ] **Step 1: Install the official SSR helper at a pinned version**

Run:

```bash
pnpm add --save-exact @supabase/ssr
```

Commit the exact resolved version rather than a floating tag.

- [ ] **Step 2: Write failing auth-boundary tests**

Cover unauthenticated redirect with locale and return path preserved, verified `sub` extraction through `getClaims`, invalid/expired token rejection, and refusal to authorize from `getSession().user` alone.

- [ ] **Step 3: Implement browser, server-cookie, and bearer-token client factories**

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The server factory uses `cookies().getAll/setAll`; the proxy refreshes sessions; `requireUser` calls `supabase.auth.getClaims()` and returns the UUID `sub` or redirects/throws an authenticated error appropriate to the surface.

- [ ] **Step 4: Implement free email/password pages**

Sign-up and sign-in use Supabase Auth only. Preserve `redirect` as a same-origin relative path. Show explicit states for invalid credentials, confirmation required, and free email-rate limits. Do not add SMS, paid provider, or custom SMTP assumptions.

- [ ] **Step 5: Implement the OAuth consent UI exactly on the Supabase server flow**

At `/oauth/consent`, require a verified web user, read `authorization_id`, call `supabase.auth.oauth.getAuthorizationDetails`, display client name and requested scopes, and post approve/deny to `/api/oauth/decision`. The decision route calls `approveAuthorization` or `denyAuthorization` and redirects only to the returned `redirect_url`.

- [ ] **Step 6: Run auth tests and browser smoke**

Run:

```bash
pnpm vitest run tests/integration/auth-boundary.test.ts
pnpm playwright test e2e/authentication.spec.ts --project=desktop
pnpm typecheck
```

Expected: signed-out protected pages redirect; sign-up/sign-in work against local Supabase; consent cannot be approved by a different or anonymous session.

- [ ] **Step 7: Commit the shared identity flow**

Commit intent: `Let web and ChatGPT share one verified LifeThread identity`

---

## Task 4: Convert the Web App to an Authenticated Multi-Goal Dashboard

**Files:**

- Modify: `src/app/[locale]/page.tsx`
- Create: `src/app/[locale]/threads/[threadId]/page.tsx`
- Modify: `src/app/[locale]/actions.ts`
- Create: `src/components/threads/thread-dashboard.tsx`
- Create: `src/components/threads/thread-card.tsx`
- Create: `src/components/threads/new-thread-form.tsx`
- Modify: `src/components/threads/workspace.tsx`
- Modify: `src/components/threads/workspace-header.tsx`
- Modify: `src/components/threads/thread-overview.tsx`
- Modify: `src/app/globals.css`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Create: `tests/components/thread-dashboard.test.tsx`
- Create: `e2e/authenticated-multithread.spec.ts`
- Modify: `scripts/demo/reset.ts`
- Modify: `scripts/demo/preflight.ts`

- [ ] **Step 1: Write failing dashboard and routing tests**

Assert that an authenticated user sees an empty dashboard, creates two independent goals, gets redirected to `/[locale]/threads/[threadId]`, returns to a dashboard with two cards, switches threads without state leakage, and receives a not-found response for another owner's thread ID.

- [ ] **Step 2: Run focused tests to prove the old one-thread page cannot satisfy them**

Run:

```bash
pnpm vitest run tests/components/thread-dashboard.test.tsx
pnpm playwright test e2e/authenticated-multithread.spec.ts --project=desktop
```

- [ ] **Step 3: Make every server action owner- and thread-scoped**

Every mutating form includes `threadId` and `expected_version`, but server actions derive `ownerId` only from `requireUser()`. Load through `repository.load(ownerId, threadId)` before mutation. Redirect success back to the same locale/thread; map stale versions to a reviewable refresh state instead of a generic crash.

- [ ] **Step 4: Implement dashboard and detail route**

Keep the approved action-first workspace as the detail view. The dashboard supplies one clear primary action, recent thread cards, progress/review counts, last-updated time, and account/sign-out controls. Remove demo reset controls from authenticated production UI; keep deterministic reset only in scripts/tests.

- [ ] **Step 5: Preserve bilingual accessibility and responsive behavior**

Add complete dictionary keys in both languages, keyboard-visible focus, meaningful headings, `aria-live` only for state changes, and responsive dashboard cards at mobile/tablet/desktop widths.

- [ ] **Step 6: Verify the complete web-only flow**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm playwright test e2e/authenticated-multithread.spec.ts
```

- [ ] **Step 7: Perform visual QA before committing**

Capture signed-out, empty dashboard, two-thread dashboard, and thread workspace states at desktop/mobile/tablet. Check overflow, focus order, Korean wrapping, contrast, and that the ChatGPT action is visually secondary to the current next action.

- [ ] **Step 8: Commit the multi-goal web surface**

Commit intent: `Give each user a clear dashboard for multiple living goals`

---

## Task 5: Add Explicit Proposal Accept, Edit, and Reject Commands

**Files:**

- Create: `src/application/proposals/proposal-commands.ts`
- Create: `src/application/analysis/propose-candidate.ts`
- Modify: `src/components/threads/candidate-review.tsx`
- Modify: `src/components/tasks/task-list.tsx`
- Modify: `src/app/[locale]/actions.ts`
- Modify: `src/application/state/project-living-state.ts`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Create: `tests/application/proposal-commands.test.ts`
- Modify: `tests/ai/reconciler.test.ts`
- Create: `tests/components/candidate-review.test.tsx`

- [ ] **Step 1: Write failing proposal-policy tests**

Cover proposal creation, exact replay, stale base revision, cross-owner access, accept, edited accept, reject, double decision, and forbidden confirmation fields. Acceptance must create a user revision; ChatGPT proposal creation must create a `chatgpt_app` revision; rejection must tombstone only the selected proposed entity and retain its audit trail.

- [ ] **Step 2: Define the application results as closed unions**

Use explicit results such as:

```ts
type ProposalCommandResult =
  | Readonly<{ kind: "applied"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "missing_thread" | "missing_proposal" | "already_decided" }>
  | Readonly<{ kind: "rejected"; reason: "stale_version" | "not_owner" | "invalid_edit" }>;
```

Do not throw expected domain outcomes.

- [ ] **Step 3: Centralize candidate submission**

`proposeCandidate` parses `candidateDeltaSchema`, loads the owner/thread, calls actor-explicit reconciliation, persists against the candidate's base version, and maps duplicate/stale/policy failures without a partial write. Both recorded test flows and MCP use this service.

- [ ] **Step 4: Group proposal cards by `analysis_run_id`**

Show source (`ChatGPT` or recorded fixture), change explanation, proposal count, and per-item accept/edit/reject controls. Never label an unconfirmed proposal as completed or confirmed. Preserve existing next-action behavior after a decision.

- [ ] **Step 5: Run focused and regression tests**

Run:

```bash
pnpm vitest run tests/application/proposal-commands.test.ts tests/ai/reconciler.test.ts tests/components/candidate-review.test.tsx
pnpm test
pnpm typecheck
```

- [ ] **Step 6: Commit the human-control boundary**

Commit intent: `Keep every AI suggestion reviewable and reversible`

---

## Task 6: Expose the Authenticated LifeThread ChatGPT App over MCP

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/mcp/auth.ts`
- Create: `src/mcp/tool-schemas.ts`
- Create: `src/mcp/register-tools.ts`
- Create: `src/mcp/widget.ts`
- Create: `src/app/mcp/route.ts`
- Create: `src/app/.well-known/oauth-protected-resource/route.ts`
- Create: `tests/mcp/auth.test.ts`
- Create: `tests/mcp/tools.test.ts`
- Create: `scripts/mcp/smoke.ts`

- [ ] **Step 1: Install and pin the official MCP/App dependencies and Vercel adapter**

Run:

```bash
pnpm add --save-exact mcp-handler @modelcontextprotocol/sdk @modelcontextprotocol/ext-apps
```

- [ ] **Step 2: Write failing auth and tool-contract tests**

Assert unauthenticated requests return `401` with `WWW-Authenticate` and `resource_metadata`; invalid/expired bearer tokens reveal no thread existence; list/get are owner-scoped; proposal replay is idempotent; stale proposal returns reload guidance; accept/reject require explicit tool calls and current version; all tools expose required `readOnlyHint`, `openWorldHint`, and `destructiveHint` annotations.

- [ ] **Step 3: Implement protected-resource metadata and token validation**

Use `protectedResourceHandler` from `mcp-handler` at `/.well-known/oauth-protected-resource`. Set canonical `resource` to the production `/mcp` origin, `authorization_servers` to the Supabase OAuth issuer, and scopes to `lifethreads:read lifethreads:write`. Validate each bearer token with the Supabase token client and map verified `sub` to MCP `AuthInfo.extra.ownerId`; never log the token.

- [ ] **Step 4: Register the five closed tools**

Implement:

```text
list_lifethreads             read only
get_lifethread              read only
propose_lifethread_update   bounded non-destructive write
accept_lifethread_proposal  bounded non-destructive write
reject_lifethread_proposal  bounded reversible write
```

`get_lifethread` returns only goal, current revision, active/proposed tasks, confirmed facts, open loops, unresolved conflicts, and source-reference metadata. `propose_lifethread_update` accepts the existing closed CandidateDelta shape; no free-form patch object is permitted. Structured output includes stable IDs, resulting version, outcome, and web URL.

- [ ] **Step 5: Register a versioned compact MCP Apps widget**

Use `registerAppResource`, `registerAppTool`, and `RESOURCE_MIME_TYPE`. Serve `ui://lifethread/proposals-v1.html` with inline CSS/JS, exact CSP domains, no external fonts, and no iframe. The widget displays proposal status and buttons that call only the accept/reject tools. It must not duplicate the full dashboard.

- [ ] **Step 6: Export the stateless Vercel route**

Create one `createMcpHandler` instance configured for stateless Streamable HTTP and export it as `GET`, `POST`, and `DELETE`, wrapped with `withMcpAuth`. Do not enable legacy SSE or add Redis because the free architecture does not require it.

- [ ] **Step 7: Verify through unit tests and MCP Inspector**

Add `"mcp:smoke": "tsx scripts/mcp/smoke.ts"` to `package.json`. Start the built app in one terminal, then run the remaining checks from a second terminal:

```bash
pnpm vitest run tests/mcp
pnpm typecheck
pnpm build
pnpm start --hostname 127.0.0.1
# In a second terminal after /mcp responds:
pnpm dlx @modelcontextprotocol/inspector http://127.0.0.1:3000/mcp
pnpm mcp:smoke
```

In Inspector, verify initialization, list tools, OAuth challenge, `get_lifethread`, proposal structured output, widget rendering, replay, and stale-version behavior.

- [ ] **Step 8: Commit the ChatGPT app endpoint**

Commit intent: `Let ChatGPT propose bounded changes without an API bill`

---

## Task 7: Add ChatGPT Entry and Realtime Web Synchronization

**Files:**

- Create: `src/components/threads/realtime-thread-sync.tsx`
- Create: `src/components/threads/chatgpt-suggestion-link.tsx`
- Modify: `src/components/threads/workspace.tsx`
- Modify: `src/components/threads/workspace-header.tsx`
- Modify: `src/app/[locale]/threads/[threadId]/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Create: `tests/components/realtime-thread-sync.test.tsx`
- Create: `tests/components/chatgpt-suggestion-link.test.tsx`
- Create: `e2e/realtime-proposal.spec.ts`

- [ ] **Step 1: Write failing synchronization-state tests**

Test subscribed, reconnecting, paused, and manual-refresh states. Simulate a matching owned `life_threads` update and assert one debounced `router.refresh()`. Ignore other thread IDs and versions not newer than the rendered version. Ensure channel cleanup on unmount/thread switch.

- [ ] **Step 2: Implement the filtered notification subscription**

Create an authenticated browser client channel filtered to `id=eq.<threadId>` on `public.life_threads`. Subscribe to `UPDATE`, request only identifying/version columns where supported, and refetch through `router.refresh()`. If subscription enters error/timeout/closed state, show `Live sync paused` with a manual refresh button; never invent unsaved client state.

- [ ] **Step 3: Add the explicit ChatGPT handoff**

Render `Get suggestions with ChatGPT` as a user-initiated external action containing a starter prompt with stable thread ID and locale. Explain that ChatGPT opens separately and that proposals appear here after the user runs the app. Do not claim background execution or auto-open a popup during page load.

- [ ] **Step 4: Add an E2E proposal injection fixture**

The E2E helper authenticates as the same local user and calls the MCP proposal tool while the browser remains open. Assert the proposal group appears without a page reload, can be accepted on web, and a simulated Realtime failure exposes manual refresh that reveals the already-saved proposal.

- [ ] **Step 5: Run component, browser, and visual QA**

Run:

```bash
pnpm vitest run tests/components/realtime-thread-sync.test.tsx tests/components/chatgpt-suggestion-link.test.tsx
pnpm playwright test e2e/realtime-proposal.spec.ts
pnpm lint
pnpm typecheck
```

Capture desktop/mobile/tablet states for waiting, new proposal, live-sync paused, and accepted proposal. Confirm Korean labels wrap without moving the primary next action below unrelated details.

- [ ] **Step 6: Commit the cross-surface synchronization**

Commit intent: `Make ChatGPT proposals appear in the open workspace`

---

## Task 8: Deploy, Connect ChatGPT, and Prove the Hackathon Story

**Files:**

- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/demo-plan.md`
- Modify: `docs/acceptance-criteria.md`
- Modify: `docs/build-log.md`
- Create: `docs/chatgpt-app-installation.md`
- Create: `docs/free-quota-behavior.md`
- Create: `docs/hackathon-submission-checklist.md`
- Modify: `scripts/acceptance/audit.ts`
- Modify: `scripts/demo/preflight.ts`

- [ ] **Step 1: Update maintainers' environment and setup documentation**

Document only:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

Document the optional service-role key only for local test seeding, never normal runtime. Include Supabase OAuth Server enablement, authorization path `/oauth/consent`, asymmetric signing-key requirement, ChatGPT redirect URI registration, Realtime publication, Vercel Hobby limits, and no-paid-overage behavior.

- [ ] **Step 2: Run the complete local verification matrix**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm test:e2e
pnpm demo:preflight
pnpm acceptance:audit
pnpm mcp:smoke
```

Expected: zero errors; all authenticated multi-thread, MCP, Realtime fallback, bilingual, and responsive checks pass.

- [ ] **Step 3: Run a secrets and paid-runtime audit**

Run:

```bash
rg -n "OPENAI_API_KEY|Responses API|billing|checkout|upgrade|service_role" src package.json .env.example README.md docs
git diff --check
git status --short
```

Expected: no OpenAI key/API runtime, billing, checkout, or upgrade implementation; service-role mentions are confined to maintainer-only local test documentation; only intended project files plus untouched `Lifethread project.md` appear.

- [ ] **Step 4: Configure Supabase and Vercel production safely**

Apply migrations to the linked Supabase project, enable OAuth 2.1, configure `/oauth/consent`, register the ChatGPT client redirect URI, set allowed web redirect URLs, enable email/password, and confirm `life_threads` Realtime publication. Set the three public environment variables in Vercel and confirm no OpenAI key exists there. Deploy production from the verified commit.

- [ ] **Step 5: Verify deployed HTTP and OAuth behavior**

Check production dashboard sign-up/sign-in, two-thread isolation, `/.well-known/oauth-protected-resource`, unauthenticated `/mcp` challenge, OAuth approval/denial, and MCP smoke against the production URL. Inspect Vercel logs and confirm tokens, prompts, evidence, and aggregate content are absent.

- [ ] **Step 6: Connect the deployed app in ChatGPT developer mode**

Add the production `/mcp` URL, complete Supabase OAuth with the same LifeThread account, list tools, request one GPT-5.6 proposal for a Korean goal, observe it on the already-open web page, accept one proposal on web, and reread the thread from ChatGPT. Repeat with mixed Korean/English input.

- [ ] **Step 7: Record hackathon evidence**

Update the README and checklist with public repository URL, production URL, ChatGPT app installation steps, free test account/flow, exact Codex `/feedback` session ID, GPT-5.6 usage, pre-hackathon versus build-week work, and a public YouTube demo under three minutes showing multi-goal creation, ChatGPT proposal, automatic sync, and explicit acceptance.

- [ ] **Step 8: Final review, commit, push, and production confirmation**

Run a final code review and visual QA, resolve all high/medium findings, rerun affected checks, create the final Lore commit with intent `Make the free LifeThread hackathon flow reproducible`, push `main`, and verify the GitHub commit SHA matches the Vercel production deployment.

---

## Final Acceptance Criteria

- A new user can create a free email/password account and maintain at least two private LifeThreads.
- A user cannot read, mutate, subscribe to, or infer another user's LifeThread by ID.
- The production runtime contains no OpenAI API call, API-key input, billing path, or paid overage fallback.
- ChatGPT authenticates through Supabase OAuth 2.1 and exposes exactly the five bounded LifeThread tools.
- A GPT-5.6-generated CandidateDelta is schema-validated, owner-scoped, citation-checked, idempotent, optimistic-locking, and persisted only as unconfirmed proposals.
- A proposal created through ChatGPT appears on an already-open matching web workspace through Realtime; a failed subscription exposes manual refresh and preserves database truth.
- Accept, edit, and reject work from web and ChatGPT widget while creating auditable revisions.
- English, Korean, desktop, mobile, and tablet flows pass automated and visual checks.
- The public README, installation guide, deployment, repository, and under-three-minute demo let judges reproduce the submission without paying LifeThread or supplying an OpenAI API key.

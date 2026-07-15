# LifeThread MVP Architecture

Status: planning baseline; no runtime exists yet

## 5. Recommended technology stack

| Layer | Decision | Why it fits the 2-3 day MVP |
| --- | --- | --- |
| Web | Next.js App Router + React + strict TypeScript | One deployable modular monolith for pages, route handlers, and server actions |
| Styling/UI | Tailwind CSS + hand-authored accessible primitives (no external component kit) | Removes a component-library choice while keeping bilingual layout iteration fast |
| Validation | Zod | One schema vocabulary for forms, API boundaries, and AI candidates |
| Persistence | Supabase Postgres | Relational constraints, transactions, revisions, and a managed hackathon service |
| Files | Private Supabase Storage | Original evidence objects with server-issued short-lived signed URLs |
| AI | OpenAI Responses API, GPT-5.6, strict Structured Outputs | Multilingual/file-capable candidate generation behind a closed schema |
| Localization | `next-intl`-style locale dictionaries (`messages/en.json`, `messages/ko.json`) | Canonical values remain independent of display language |
| Tests | Vitest, Testing Library, Playwright | Fast domain/contract proofs plus a real-browser demo journey |
| Package/runtime | `pnpm`, current Node LTS | Deterministic scripts and low setup overhead |

The authorized scaffold uses `pnpm dlx create-next-app@latest` with TypeScript, Tailwind, ESLint, App Router, `src/`, and `@/*` alias flags. Because this repository is non-empty with planning artifacts, Todo 01 must run it in a temporary empty staging directory and merge only generated app paths into the repo. It must preserve `docs/`, `.omo/`, and `README.md`, recording a path manifest and `git diff --exit-code -- docs .omo README.md` before and after the merge. It then installs the latest stable mutually compatible releases of `@supabase/supabase-js`, `openai`, `zod`, `next-intl`, Vitest, Testing Library, and Playwright in one resolver run, commits the generated lockfile, and captures `pnpm list --depth 0 --json`. No dependency is installed during planning.

## Architecture shape

LifeThread is a modular monolith. UI routes call application services; application services operate on domain types and repository interfaces; infrastructure adapters call Supabase and OpenAI. Neither UI components nor model responses write tables directly.

```text
Browser
  -> Next.js pages / server actions / route handlers
    -> application commands and queries
      -> domain policies (provenance, transitions, reconciliation)
        -> repository interfaces
          -> Supabase Postgres + private Storage
      -> AI gateway
          -> OpenAI Responses API
```

Planned module boundaries:

- `src/domain/`: entities, canonical enums, commands, CandidateDelta, invariants.
- `src/application/`: create thread, task controls, evidence ingestion, analyze/reconcile, projections, communication.
- `src/infrastructure/supabase/`: repositories, transaction mapping, signed URLs.
- `src/infrastructure/openai/`: prompt assembly and strict structured response adapter.
- `src/app/`: locale-aware pages, server-only mutations, localized errors.
- `messages/`: English and Korean UI dictionaries.
- `supabase/migrations/`: schema, constraints, and private bucket/RLS policy.
- `tests/` and `e2e/`: domain, contract, integration, and browser fixtures.

Dependencies point inward: infrastructure may depend on domain/application contracts; domain never imports Next.js, Supabase, OpenAI, or locale libraries.

## Six independently verifiable components

| Component | Outcome | Failure isolation |
| --- | --- | --- |
| C1 Goal/plan experience | Arbitrary goal becomes tentative editable structure | Creation fails without creating a misleading confirmed plan |
| C2 Canonical state/provenance | Revisions preserve origin, confirmation, uncertainty, and conflicts | Invalid/stale transitions write nothing |
| C3 Evidence | Original objects and precise source references remain traceable/private | Failed extraction does not lose or falsely interpret the original |
| C4 AI/reconciliation | Strict candidate deltas are validated and deterministically applied | Model/refusal/timeout/schema errors do not mutate canonical state |
| C5 Bilingual projection | EN/KO/mixed input shares one canonical aggregate | Missing localization visibly falls back without data mutation |
| C6 Demo/acceptance | Resettable labeled profile proves the vertical slice | Reset/preflight fails loudly rather than showing stale or simulated success |

## Request and mutation boundaries

1. Parse and validate browser input at a server boundary.
2. Attribute explicit human actions to fixed actor `demo_user`.
3. Load the aggregate and expected version.
4. Execute a domain command.
5. Persist the event/change plus a new revision atomically.
6. Recompute or store derived projections keyed to that revision.
7. Return localized presentation without translating canonical enums.

All mutations require an expected aggregate version. A stale request returns a conflict and must not merge silently.

## Storage and privacy

- Postgres stores canonical records, source-reference metadata, revisions, and object keys; it does not duplicate file bytes.
- Storage bucket access is private. The server creates short-lived signed read URLs only after resolving the fixed demo actor/thread relationship.
- The MVP is operator-controlled: local use or a platform-protected preview. A public URL and public sharing are out of scope.
- Upload processing is `validate -> create pending evidence row -> upload private object -> finalize checksum/metadata -> synchronously invoke analysis through the application service`. Failure leaves a visible retryable state and cleans orphaned objects. No queue or background worker is introduced.
- Application paths cannot overwrite original objects. Duplicate checksum + thread ID returns the existing evidence record.
- Explicit privacy deletion removes the original and all translations/summaries/caches, breaks user-facing access, and retains only a content-free audit tombstone.
- Logs contain IDs, timings, status codes, schema error categories, and token/cost metadata only; no raw sensitive evidence or full prompts/responses.

## Runtime topology and access

The required surface is a locally runnable or access-protected Next.js process connected to configured Supabase/OpenAI projects. Vercel compatibility is desirable but deployment is not an MVP deliverable and must not be inferred as approved.

`scripts/preflight` must fail before live demo/integration commands when required environment values are missing. Unit and deterministic contract tests use fixtures and do not depend on live secrets.

## Execution dependency spine

1. Tooling and environment contract.
2. C2 canonical schema and revision invariants.
3. C3 relational/storage adapters and evidence lifecycle.
4. C4 CandidateDelta contract and reconciliation.
5. C1 goal/task application flow.
6. C5 localized projections and UI completeness.
7. C6 seed/reset, browser demo, and acceptance audit.

This order prevents UI or prompts from becoming the accidental source of truth.

The per-todo `Blocked by` matrix in `.omo/plans/lifethread-mvp.md` is authoritative. Wave labels are presentation only. A task may run in parallel only when every prerequisite in that matrix is green; no wave summary can override a prerequisite.

## Alternatives considered

- Next.js + local SQLite/files: fastest offline setup, but weaker private file/demo persistence and migration parity.
- React SPA + FastAPI: good language separation, but two runtimes and duplicated schemas cost too much in 2-3 days.
- Separate services/queues: scalable later, but unnecessary operational and transaction complexity for one demo profile.

## Must-NOT-Have

No fixed workflows, public sharing, production auth, autonomous external actions, external email/calendar delivery, background queue, multi-user collaboration, scenario-specific tables, translated canonical enums, direct model-to-database writes, or hidden mock presented as live behavior.

# LifeThread
LifeThread is a general-purpose, bilingual AI life-management application that turns any free-form real-world goal into an editable, evidence-backed living state. The user can enter any goal or task in their own words.

## Current repository state

This repository contains a working bilingual MVP with authenticated multi-goal storage, deterministic CandidateDelta reconciliation, private evidence handling, demo reset/preflight, responsive browser coverage, and a protected MCP connector for ChatGPT. The normal AI proposal path uses the user's ChatGPT account through the connected LifeThread app; it does not require an OpenAI API key. Local recorded fixtures remain available for deterministic development and tests.

Approved hackathon defaults:

- Supabase Postgres and private Supabase Storage.
- One clearly labeled `demo_user` profile with no public sharing.
- A 2-3 day implementation timebox.
- A Next.js App Router TypeScript modular monolith.
- ChatGPT Developer Mode with strict structured candidate deltas reconciled by deterministic application code.
- One canonical LifeThread projected in English or Korean.

## Product promise

A user supplies an arbitrary goal, not a category. LifeThread proposes a tentative plan, accepts evidence, tracks revisions and open loops, protects confirmed facts, and recommends one useful next action. Prepared demo scenarios never receive separate workflows or schemas.

## Planning documents

- [Product specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [AI pipeline](docs/ai-pipeline.md)
- [Internationalization](docs/i18n.md)
- [Three-minute demo plan](docs/demo-plan.md)
- [Acceptance criteria](docs/acceptance-criteria.md)
- [Requirements digest](docs/requirements-digest.md)
- [Build log](docs/build-log.md)
- [Decision-complete implementation plan](.omo/plans/lifethread-mvp.md)

## Scope boundaries

The MVP does not include public sharing, collaboration, external email/calendar actions, background queues, a template library, multiple scenario-specific paths, or additional languages. Original evidence remains private; AI output cannot directly mutate canonical confirmed state.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (86 tests), `pnpm test:integration` (28 tests), and `pnpm build` pass.
- `pnpm test:e2e` passes the authenticated boundary suite across desktop, mobile, and tablet (15 passed; 9 demo-account journeys skip without saved demo credentials).
- `pnpm demo:preflight`, two consecutive `pnpm demo:reset` runs, `pnpm acceptance:audit`, and local `pnpm mcp:smoke` pass.
- The current verification record is maintained in `.omo/evidence/final-verification/summary.md`.

The ChatGPT connector requires a user to connect LifeThread in ChatGPT Developer Mode and select it with `+` → `More` when needed. A generic browser link cannot silently activate an app. Local deterministic tests do not require a ChatGPT or OpenAI API credential.


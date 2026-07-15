# LifeThread

LifeThread is a planned bilingual AI life-management application for turning any free-form real-world goal into an editable, evidence-backed living state.

## Current repository state

This repository contains a working local MVP vertical slice. The bilingual workspace, domain/revision engine, deterministic CandidateDelta reconciliation, private local evidence adapter, demo reset/preflight, and responsive browser journey are implemented and verified. Supabase/OpenAI live adapters are present behind fail-fast boundaries and require credentials to activate.

Approved hackathon defaults:

- Supabase Postgres and private Supabase Storage.
- One clearly labeled `demo_user` profile with no public sharing.
- A 2-3 day implementation timebox.
- A Next.js App Router TypeScript modular monolith.
- GPT-5.6 strict structured candidate deltas reconciled by deterministic application code.
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

The MVP does not include public sharing, production-grade authentication, collaboration, external email/calendar actions, background queues, a template library, multiple scenario-specific paths, additional languages, or hidden mocks. Original evidence remains private; AI output cannot directly mutate canonical confirmed state.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (29 tests), `pnpm test:integration`, and `pnpm build` pass.
- `pnpm test:e2e` passes across desktop, mobile, and tablet (6 tests).
- `pnpm demo:preflight`, `pnpm demo:reset`, and `pnpm acceptance:audit` pass.
- Full evidence is recorded in `.omo/evidence/final-verification/summary.md`.

Live Supabase integration requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; live GPT smoke requires `OPENAI_API_KEY`. Missing live credentials fail fast without affecting deterministic local tests.

# LifeThread

LifeThread is a planned bilingual AI life-management application for turning any free-form real-world goal into an editable, evidence-backed living state.

## Current repository state

This repository currently contains planning and documentation only. There is no application scaffold, dependency manifest, database, deployment, or runnable product yet. Implementation remains blocked until the completed plan is explicitly approved.

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

## Next gate

Review the documentation and `.omo` plan. Only an explicit instruction to start implementation authorizes application code, dependency installation, database work, deployment, or scaffolding.

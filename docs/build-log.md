# LifeThread Build Log

This log records decisions and Codex participation honestly. As of 2026-07-15, only planning/documentation has occurred; implementation, debugging, runtime testing, database work, deployment, and scaffolding have not begun.

## 2026-07-15 - Product planning and architecture

### Codex assistance

- Inspected the empty repository and available environment.
- Recovered and normalized the complete LifeThread product brief.
- Compared a Next.js/Supabase modular monolith with local SQLite and split SPA/FastAPI alternatives.
- Proposed the canonical domain model, provenance rules, candidate-delta AI boundary, bilingual projection, evidence lifecycle, demo flow, acceptance audit, risks, and implementation sequence.
- Used read-only review lanes for repository surface, tooling, execution topology, OpenAI contracts, and adversarial QA.
- Ran a Metis gap analysis and tightened deletion semantics, demo identity/access, storage privacy, evidence conventions, credential preflight, reconciliation order, and dependency ordering.
- Wrote planning documents only. No application behavior was represented as working.

### Product-owner decisions

- Use Supabase Postgres and Supabase Storage.
- Use one clearly labeled demo profile with no public sharing.
- Size the MVP to a 2-3 day hackathon window.
- Approval authorizes planning artifacts only; implementation still requires explicit approval.

### Planner technical decisions

- Next.js App Router TypeScript modular monolith.
- Strict CandidateDelta output from GPT-5.6; deterministic application reconciliation is the only canonical write path.
- One language-neutral canonical aggregate; English/Korean are projections.
- Original evidence is private/immutable through normal paths; derived claims cite originals.
- User-visible task deletion is a tombstone revision.
- Fixed `demo_user` attribution is not described as production authentication.
- `pnpm`, Vitest, Testing Library, Playwright, fail-fast live preflight, and durable `.omo/evidence/<task-id>/` evidence.

### Where GPT-5.6 is planned inside the product

- Initial goal interpretation and tentative plan.
- Evidence extraction into strict facts/events/open-loop candidates.
- Candidate plan updates and change explanations.
- Localized current-state/next-action prose.
- Suggested communication drafts.

GPT-5.6 will not confirm facts, mutate canonical state directly, resolve conflicts, send communications, or take external actions.

### Bilingual support

- Korean, English, and mixed inputs share one schema and reconciliation path.
- UI strings live in English/Korean dictionaries.
- Original content remains verbatim; localized derivatives are separate and revision-keyed.
- Locale switching performs zero canonical writes.

### Arbitrary-goal support

- No required workflow/category/template.
- Home sale, troubleshooting, travel, and an unseen custom fixture must traverse identical services, schema, and UI.
- Domain meaning is stored as user content/provenance/evidence, not scenario-specific tables.

### Demo proof

The planned three-minute flow demonstrates Korean free-form creation, editable AI proposals, private Korean evidence, cited English state, confirmation/conflict protection, adaptive next action, communication drafting, and locale switching on the same record.

### Deferred/outside MVP

Production authentication and multi-user isolation, public sharing, collaboration, external email/calendar actions, background queues, notifications outside the app, templates, export/search, additional languages, mobile-native clients, and deployment as a required deliverable.

## Future log protocol

After implementation is explicitly authorized, append one dated entry per meaningful phase with:

- behavior delivered and evidence path;
- tests/manual QA run and exact result;
- Codex assistance in implementation/debugging/testing/docs;
- product-owner, design, and technical decisions kept distinct;
- scope/stack changes only after explicit approval;
- mocked, incomplete, deferred, or unsupported behavior labeled plainly.

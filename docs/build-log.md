# LifeThread Build Log

This log records product decisions, implementation work, verification, and Codex participation honestly. Planning and the action-first local MVP redesign were completed on 2026-07-15. Deployment and live production-service verification remain outside the completed work.

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

## 2026-07-15 - Action-first workspace redesign

### Product-owner and design decisions

- Approved the action-first direction: one dominant next action instead of a dashboard of equally weighted controls.
- Completing the current action immediately advances the workspace and reveals the next action.
- Evidence or a short update is optional after completion rather than a prerequisite for progress.
- AI-proposed changes stay behind an explicit review step before canonical application.
- Technical identifiers, checksums, provenance, and diagnostic detail remain available through progressive disclosure.
- On narrow screens, the next action and optional update come before review, plan, and technical detail.
- The visual direction uses warm paper surfaces, deep green action color, restrained borders, and editorial typography.

### Behavior delivered

- Rebuilt the creation and workspace surfaces around plain-language orientation and a single primary action.
- Split the workspace into focused overview, next-action, candidate-review, task-plan, and detail components.
- Added direct `proposed -> completed` confirmation while preserving source type and explicit confirmation history.
- Added task-derived progress, next-action projection, and review counts that exclude the currently presented proposed action.
- Added English and Korean action-first interface copy while preserving original user/task content verbatim.
- Added an `aria-live` workspace revision announcement and an assertive inline error/retry surface that preserves the current workspace when a server action is rejected.
- Made the installed React Scan and React Grab packages available only through an explicit development opt-in; no remote CDN scripts or automatic React Grab telemetry are used.

### Engineering and debugging notes

- Replaced Windows-incompatible package-manager child-process calls in the integration runner and Playwright reset helper with direct Node entry points.
- The optional local instrumentation gate is `NEXT_PUBLIC_ENABLE_REACT_DEVTOOLS=1`; it remains disabled by default and in production.
- Kept the existing Next.js App Router, domain model, recorded-fixture demo adapter, and local data path; no dependency or production schema migration was introduced.
- Local demo verification uses the recorded fixture and `demo_user`. Live Supabase, OpenAI, authentication, deployment, and external actions were not exercised or represented as production-ready.

### Verification evidence

- Full Vitest suite: 32 tests passed, including the 2 integration tests.
- Dedicated integration command: 2 tests passed.
- Playwright responsive journey: 9 tests passed across desktop, tablet, and mobile, including English/Korean states and visible invalid-action feedback.
- Demo preflight: `DEMO_PREFLIGHT_OK` in local recorded-fixture mode.
- Acceptance audit: `ACCEPTANCE_AUDIT_OK`.
- Next.js production build completed successfully.
- Responsive and full-page captures are stored under `.omo/evidence/action-first-redesign/screens/`; the generated QA evidence remains local and is not part of the product source commit.

# lifethread-mvp - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A polished three-minute LifeThread MVP in which any Korean, English, or mixed-language goal becomes an editable, evidence-backed living plan. It preserves original evidence and confirmed facts, adapts through revisioned AI proposals, recommends one next action, and shows the same underlying record in English or Korean.

**Why this approach:** One TypeScript application and one managed database/file service keep the hackathon build focused. GPT proposes strictly shaped changes, while deterministic application rules protect provenance, privacy, confirmation, and concurrency.

**What it will NOT do:** It will not ship public sharing, production authentication, collaboration, external message sending, scenario-specific workflows, or hidden mocks. AI will not directly write confirmed state or overwrite original evidence.

**Effort:** Large (tightly scoped to 2-3 hackathon days)
**Risk:** High - the vertical slice combines private file handling, structured AI reconciliation, revisions, and complete bilingual UX in a short window.
**Decisions to sanity-check:** Supabase for relational state and private files; one labeled non-public demo profile; a candidate-only AI boundary; one canonical bilingual record; deployment optional, not required.

Your next move: review this plan, then explicitly choose either “start implementation” or “run the optional dual high-accuracy review first.” Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk 2-3 day MVP; 15 ordered implementation-and-test todos deliver category-free goal creation, revisioned provenance/evidence, deterministic CandidateDelta reconciliation, one canonical EN/KO state, and a labeled under-three-minute browser demo.

## Scope
### Must have
- Pre-execution gate: do not create code, install dependencies, provision Supabase, call OpenAI, or deploy until the user explicitly authorizes implementation of this plan.
- One Next.js App Router strict-TypeScript modular monolith using Supabase Postgres/private Storage and GPT-5.6 strict CandidateDelta outputs.
- One fixed, visibly labeled `demo_user` profile; operator-controlled/local or platform-protected access; no public sharing.
- Arbitrary Korean/English/mixed-language goal creation with tentative editable plans and no required category/template.
- Revisioned canonical state, immutable provenance, tombstone task deletion, optimistic concurrency, idempotency, conflicts, and user-only confirmation.
- Private original evidence, source locators, adaptive reconciliation, living-state projections, one next action, and unsent communication drafts.
- Complete English/Korean UI over one canonical aggregate, plus a resettable under-three-minute real-browser demo.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No scenario-specific tables/routes/prompts, workflow catalog, required category, or separate prepared-demo code path.
- No public bucket/URL/sharing, collaboration, production-auth claim, external send action, queue, notification service, template library, export, mobile app, or third language.
- No direct model-to-database write, AI confirmation/conflict resolution, confirmed-fact overwrite, invented date, uncited important claim, last-write-wins merge, original-evidence overwrite, or hard delete through normal application paths.
- No hard-coded user-facing TSX copy, translated canonical enum, raw sensitive prompt/evidence logging, silent credential/test skip, or hidden fixture presented as live.
- Vercel-compatible is sufficient; deployment is not required unless separately authorized.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: hybrid. Use Vitest TDD for domain/reconciliation invariants; schema/adapter contract tests for AI/evidence boundaries; tests-after with Testing Library for presentational UI; Playwright for browser journeys. Never weaken or skip a failing test.
- Toolchain: `pnpm`, strict TypeScript, ESLint, Vitest, Testing Library, Playwright. Exact compatible versions are selected/locked only in Todo 01.
- Durable evidence: `.omo/evidence/<task-id>/`; `/tmp` is disposable only. Every QA command writes stdout/stderr plus any JSON/screenshots/traces to that task directory.
- Todo 01 creates `pnpm qa:capture --task <task-id> --label <happy|failure> -- <command...>` in `scripts/qa/capture.mjs`. It writes `.omo/evidence/<task-id>/<label>.log`, sets `LIFETHREAD_EVIDENCE_DIR` for Playwright screenshots/traces, preserves the child exit code, terminates child processes, and records a cleanup receipt. Every QA invocation below uses this exact wrapper.
- Credential policy: deterministic unit/fixture tests require no secrets. `pnpm test:integration`, `pnpm demo:preflight`, and live demo fail fast and name missing requirements; they never silently skip. Expected-failure QA uses `pnpm qa:capture --expect-exit N -- <command>` and passes only when the child exits exactly N.
- Global green gate after each wave: `pnpm lint && pnpm typecheck && pnpm test`. Final gate additionally runs `pnpm test:integration && pnpm test:e2e && pnpm demo:preflight` against isolated configured services.

## Execution strategy
### Parallel execution waves
> Wave size is subordinate to the dependency DAG. Single-item waves are intentional when they lock a contract or external service; do not merge gated work merely to satisfy a count target.

- Wave 0: Todo 01 only; lock tooling, directories, environment contract, and runnable shells.
- Wave 1: Todo 02 only; lock canonical contracts before persistence, AI, or UI consumes them.
- Wave 2 (parallel): Todos 03 and 04; persistence/storage and revision/provenance engine share Todo 02 contracts.
- Wave 3: Todo 07; lock the AI/reconciliation contract before evidence ingestion consumes it.
- Wave 4A: Todo 08; complete private evidence ingestion against the green Todo 07 analyzer.
- Wave 4B (parallel): Todos 05, 09, and 10; Todo 13 starts only after Todo 10 is green and is not parallel with it.
- Wave 5 (parallel where dependencies permit): Todos 06 and 12; Todo 11 starts only after Todos 06, 08, 09, 10, 12, and 13 are green.
- Wave 6: Todo 14 then Todo 15; seed/demo and complete acceptance cannot begin before C1-C5 are green.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 01 | approval gate | 02 | none |
| 02 | 01 | 03, 04, 10 | none |
| 03 | 02 | 05, 08, 13 | 04 |
| 04 | 02 | 06, 07, 09 | 03 |
| 05 | 03, 07 | 06, 11 | 09, 10, 13 |
| 06 | 04, 05 | 11, 14 | 12 |
| 07 | 02, 04 | 05, 09, 10, 12, 13 | none |
| 08 | 03, 07 | 09, 11, 13 | none; Todo 07 must be green first |
| 09 | 04, 07, 08 | 11, 12, 14 | 05, 10, 13 |
| 10 | 02, 07 | 11, 12, 14 | 05, 09 |
| 11 | 05, 06, 08, 09, 10, 13 | 14 | none |
| 12 | 07, 09, 10 | 14 | 06 |
| 13 | 03, 07, 08, 10 | 11, 14 | 05, 09 only after Todo 10 is green |
| 14 | 06, 09, 10, 11, 12, 13 | 15 | none |
| 15 | 14 | F1-F4 | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 01. Scaffold the strict, fail-fast application foundation
  What to do / Must NOT do: After explicit implementation approval, run `pnpm dlx create-next-app@latest` in an empty temporary staging directory, then merge only generated app paths into this non-empty repository while preserving `docs/`, `.omo/`, and `README.md`; record a path manifest and prove the planning diff is unchanged. Install the latest stable mutually compatible required runtime/test packages in one resolver run, commit the lockfile, add lint/typecheck/test/e2e/capture scripts, module directories, environment validation, English/Korean dictionary shells, and a neutral landing/error shell. Add `demo:preflight` that names missing variables. Use hand-authored accessible primitives; do not choose an external component kit, connect/provision services, deploy, add auth, or embed workflow data.
  Targets: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/error.tsx`, `src/config/env.ts`, `messages/en.json`, `messages/ko.json`, `scripts/demo/preflight.ts`, `scripts/ai/smoke.ts`, `scripts/qa/capture.mjs`, `tests/setup.ts`, `e2e/foundation.spec.ts`.
  Parallelization: Wave 0 | Blocked by: explicit user implementation approval | Blocks: 02
  References: `docs/architecture.md` sections “Recommended technology stack”, “Architecture shape”, “Runtime topology”; `docs/i18n.md` “UI localization”; `docs/product-spec.md` “Required MVP features”.
  Acceptance criteria: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test`; `pnpm demo:preflight` exits nonzero and lists exact missing live variables in an empty environment; `pnpm ai:smoke` is wired to `scripts/ai/smoke.ts` and fails before network access when credentials are absent; no Supabase/OpenAI network call occurs in unit tests.
  QA scenarios: happy — `pnpm qa:capture --task task-01-foundation --label happy -- pnpm exec playwright test e2e/foundation.spec.ts --grep "renders English and Korean shells without console errors"`, PASS iff exit 0 and the planning path manifest is unchanged; failure — `pnpm qa:capture --task task-01-foundation --label failure --expect-exit 1 -- env -i PATH="$PATH" pnpm demo:preflight`, PASS iff wrapper records exactly exit 1, exact missing variables, no “ready”, and no live child/port in its cleanup receipt.
  Commit: Y | `chore(app): scaffold strict bilingual foundation`

- [x] 02. Define canonical domain contracts and state transitions with TDD
  What to do / Must NOT do: Add typed/Zod contracts for all records, shared provenance, canonical statuses, commands, CandidateDelta types, and transition policies. Define nullable/precision dates and tombstones. Write failing tests first for invalid transitions, AI confirmation, missing citations, category-free construction, and canonical serialization. Do not import Next.js/Supabase/OpenAI/localization into `src/domain`.
  Targets: `src/domain/status.ts`, `src/domain/provenance.ts`, `src/domain/entities.ts`, `src/domain/commands.ts`, `src/domain/candidate-delta.ts`, `src/domain/transitions.ts`, `src/domain/serialization.ts`, `tests/domain/contracts.test.ts`, `tests/domain/transitions.test.ts`.
  Parallelization: Wave 1 | Blocked by: 01 | Blocks: 03, 04, 10
  References: `docs/data-model.md` entire file; `docs/product-spec.md` “Arbitrary user-defined goals”; `docs/acceptance-criteria.md` audit rows 1-17.
  Acceptance criteria: `pnpm exec vitest run tests/domain/contracts.test.ts tests/domain/transitions.test.ts`; exact tests assert all canonical statuses, four immutable origins, proposed-to-accepted/rejected paths, reopen, tombstone retention, unknown date preservation, and rejection of model confirmation/category discriminator.
  QA scenarios: happy — `pnpm qa:capture --task task-02-domain-contracts --label happy -- pnpm exec vitest run tests/domain/contracts.test.ts tests/domain/transitions.test.ts`, PASS iff exit 0; failure — `pnpm qa:capture --task task-02-domain-contracts --label failure -- pnpm exec vitest run tests/domain/transitions.test.ts -t "rejects invalid and model-confirmed transitions without mutation"`, PASS iff exit 0 proves all forbidden inputs rejected and canonical before/after hashes equal.
  Commit: Y | `feat(domain): define canonical lifethread contracts`

- [ ] 03. Implement Supabase schema, private evidence storage, and repositories
  What to do / Must NOT do: Add migrations for all planned records/constraints/indexes, one fixed demo actor, optimistic thread versioning, analysis idempotency, source-reference integrity, tombstones, and private Storage policies. Add transaction-capable repository/storage adapters and isolated integration setup. Signed URLs are short-lived/server-issued. Do not create public policies, permanent URLs, production-auth claims, or physical-delete application methods.
  Targets: `supabase/config.toml`, `supabase/migrations/0001_core.sql`, `supabase/migrations/0002_private_evidence.sql`, `src/infrastructure/supabase/server-client.ts`, `src/infrastructure/supabase/repositories.ts`, `src/infrastructure/supabase/storage.ts`, `src/infrastructure/supabase/transactions.ts`, `tests/integration/repositories.test.ts`, `tests/integration/storage-privacy.test.ts`.
  Parallelization: Wave 2 | Blocked by: 02 | Blocks: 05, 08, 13
  References: `docs/data-model.md` “Core records”; `docs/architecture.md` “Storage and privacy”; `.omo/drafts/lifethread-mvp.md` “Metis gap-analysis resolutions”.
  Acceptance criteria: `pnpm test:integration -- tests/integration/repositories.test.ts tests/integration/storage-privacy.test.ts`; migration apply succeeds twice; unique/version/FK/check constraints reject invalid rows; unauthenticated/public object reads fail; signed read succeeds; tombstones retain provenance.
  QA scenarios: happy — `pnpm qa:capture --task task-03-supabase --label happy -- pnpm test:integration -- tests/integration/repositories.test.ts tests/integration/storage-privacy.test.ts -t "round-trips one revision and short-lived signed evidence read"`, PASS iff exit 0; failure — `pnpm qa:capture --task task-03-supabase --label failure -- pnpm test:integration -- tests/integration/repositories.test.ts tests/integration/storage-privacy.test.ts -t "rejects public reads stale writes cross-thread references and physical deletes"`, PASS iff exit 0 and assertions show no partial row/object.
  Commit: Y | `feat(data): add revisioned supabase persistence`

- [ ] 04. Implement revision, provenance, task-policy, and confirmed-fact engine
  What to do / Must NOT do: Implement aggregate loading/commands, append-only revisions, provenance preservation, accept/reject/correct/confirm/conflict-resolution policies, task status/reorder/priority/tombstone/reopen, and optimistic concurrency. Only explicit `demo_user` commands confirm or resolve. Do not use last-write-wins or let source type change on acceptance.
  Targets: `src/domain/lifethread-aggregate.ts`, `src/domain/revision.ts`, `src/domain/task-policy.ts`, `src/domain/confirmation-policy.ts`, `src/domain/conflict-policy.ts`, `tests/domain/aggregate.test.ts`, `tests/domain/provenance.test.ts`.
  Parallelization: Wave 2 | Blocked by: 02 | Blocks: 06, 07, 09
  References: `docs/data-model.md` “Task provenance”, “Adaptive planning”, “Confirmed-fact protection”; `docs/product-spec.md` “Human control”.
  Acceptance criteria: `pnpm exec vitest run tests/domain/aggregate.test.ts tests/domain/provenance.test.ts`; tests prove every command emits one expected revision, stale version emits none, tombstone retains sources, accepting AI task retains `ai_suggested`, and contradiction cannot alter confirmed value.
  QA scenarios: happy — `pnpm qa:capture --task task-04-state-engine --label happy -- pnpm exec vitest run tests/domain/aggregate.test.ts tests/domain/provenance.test.ts`, PASS iff exit 0 and revision snapshots match; failure — `pnpm qa:capture --task task-04-state-engine --label failure -- pnpm exec vitest run tests/domain/aggregate.test.ts tests/domain/provenance.test.ts -t "rejects stale overwrite model confirmation and physical delete"`, PASS iff exit 0 with unchanged aggregate hashes.
  Commit: Y | `feat(domain): enforce revision and provenance policies`

- [ ] 05. Build arbitrary goal creation and tentative initial-plan flow
  What to do / Must NOT do: Add create-thread application command/server boundary and locale-aware form/result flow. Only goal text is required; optional desired outcome/description/context pass to the AI gateway. Persist a thread, run initial analysis, and show tentative milestones/tasks/questions/evidence suggestions/risks/next action with accept/edit/reject controls. Do not show a template/category picker or mark AI output confirmed.
  Targets: `src/application/threads/create-thread.ts`, `src/application/threads/thread-repository.ts`, `src/app/[locale]/threads/new/page.tsx`, `src/app/[locale]/threads/new/actions.ts`, `src/components/threads/create-thread-form.tsx`, `src/components/threads/initial-proposal.tsx`, `tests/application/create-thread.test.ts`, `e2e/create-thread.spec.ts`.
  Parallelization: Wave 4 | Blocked by: 03, 07 | Blocks: 06, 11
  References: `docs/product-spec.md` sections 1-4; `docs/ai-pipeline.md` “Initial goal analysis”; `docs/i18n.md` “Bilingual input and AI output”.
  Acceptance criteria: `pnpm exec vitest run tests/application/create-thread.test.ts` covers Korean, English, mixed, and four-domain/unseen goals; input is 1-2,000 UTF-8 characters and over-limit input creates no thread; important facts, dates, statuses, deadlines, waiting states, risks, recommendations, and completion claims require citations; `pnpm exec playwright test e2e/create-thread.spec.ts` asserts no category field, proposed badges, and one persisted thread.
  QA scenarios: happy — `pnpm qa:capture --task task-05-create-thread --label happy -- pnpm exec playwright test e2e/create-thread.spec.ts --grep "creates unseen Korean goal in English UI with tentative origins"`, PASS iff exit 0; failure — `pnpm qa:capture --task task-05-create-thread --label failure -- pnpm exec playwright test e2e/create-thread.spec.ts --grep "rejects blank over-limit and malformed analysis without persistence"`, PASS iff exit 0 and DB fixture asserts zero thread/revision.
  Commit: Y | `feat(threads): add free-form goal creation`

- [ ] 06. Deliver complete human task and milestone controls
  What to do / Must NOT do: Implement create/edit/tombstone/restore/complete/reopen/reorder/priority and milestone add/remove controls through application commands, with optimistic UI only when rollback is safe. Show compact origin/confirmation badges and expandable provenance. Do not physically delete or hide failed stale writes.
  Targets: `src/application/tasks/task-commands.ts`, `src/app/[locale]/threads/[threadId]/task-actions.ts`, `src/components/tasks/task-list.tsx`, `src/components/tasks/task-editor.tsx`, `src/components/tasks/provenance-badge.tsx`, `src/components/milestones/milestone-list.tsx`, `tests/application/task-commands.test.ts`, `e2e/task-controls.spec.ts`.
  Parallelization: Wave 5 | Blocked by: 04, 05 | Blocks: 11, 14
  References: `docs/product-spec.md` “Human control”; `docs/data-model.md` “Task provenance model”, transition table; `docs/i18n.md` dictionary coverage.
  Acceptance criteria: `pnpm exec vitest run tests/application/task-commands.test.ts && pnpm exec playwright test e2e/task-controls.spec.ts`; every control persists one valid revision and preserves origin/citations.
  QA scenarios: happy — `pnpm qa:capture --task task-06-task-controls --label happy -- pnpm exec playwright test e2e/task-controls.spec.ts --grep "persists accept edit reject add reorder complete reopen and tombstone"`, PASS iff exit 0 after reload; failure — `pnpm qa:capture --task task-06-task-controls --label failure -- pnpm exec playwright test e2e/task-controls.spec.ts --grep "rejects second stale browser command and preserves first revision"`, PASS iff exit 0 with localized recovery and preserved first change.
  Commit: Y | `feat(tasks): add provenance-safe task controls`

- [ ] 07. Implement the strict GPT gateway and deterministic CandidateDelta reconciler
  What to do / Must NOT do: Add versioned prompts/schema, OpenAI Responses adapter, fixture adapter, refusal/incomplete/timeout handling, semantic/provenance validation, prompt-injection boundary, closed operation whitelist, confirmed-fact guard, idempotency/version checks, deterministic reconciliation, conflict generation, and change explanation. Do not log raw content or allow arbitrary/model-authorized fields.
  Targets: `src/infrastructure/openai/responses-gateway.ts`, `src/infrastructure/openai/prompt.ts`, `src/infrastructure/openai/candidate-schema.ts`, `src/application/analysis/analyze-thread.ts`, `src/application/analysis/reconcile-candidate.ts`, `src/application/analysis/idempotency.ts`, `tests/ai/candidate-schema.test.ts`, `tests/ai/reconciler.test.ts`, `tests/ai/adversarial.test.ts`, `tests/fixtures/ai/`.
  Parallelization: Wave 3 | Blocked by: 02, 04 | Blocks: 05, 08, 09, 10, 12, 13
  References: `docs/ai-pipeline.md` entire file; `docs/data-model.md` revision/confirmation sections; `docs/architecture.md` C4.
  Acceptance criteria: `pnpm exec vitest run tests/ai/candidate-schema.test.ts tests/ai/reconciler.test.ts tests/ai/adversarial.test.ts`; fixture replay yields one revision; malformed/uncited/invented-date/cross-thread/overwrite/refusal/timeout/stale cases yield no forbidden mutation; then `pnpm ai:smoke` makes one live GPT-5.6 Responses API call, validates/reconciles one CandidateDelta, and records metadata only, or fails fast with named missing credentials.
  QA scenarios: happy — `pnpm qa:capture --task task-07-ai-reconciliation --label happy -- pnpm exec vitest run tests/ai/candidate-schema.test.ts tests/ai/reconciler.test.ts -t "reconciles Korean English and mixed candidates deterministically"`, PASS iff exit 0 and snapshots match; live — `pnpm qa:capture --task task-07-ai-reconciliation --label live -- pnpm ai:smoke`, PASS iff one live response is schema-valid and reconciled with no raw content captured; failure — `pnpm qa:capture --task task-07-ai-reconciliation --label failure -- pnpm exec vitest run tests/ai/adversarial.test.ts -t "rejects prompt injection confirmation delete uncited invented-date stale and replay operations"`, PASS iff exit 0 and forbidden cases retain canonical hash/one revision.
  Commit: Y | `feat(ai): reconcile strict candidate deltas`

- [ ] 08. Add private text/image/PDF evidence ingestion and traceable extraction
  What to do / Must NOT do: Implement validated upload/note boundaries, pending/final/failed states, checksum+thread idempotency, private object upload, orphan cleanup, retry, precise text/PDF/image source locators, and synchronous analysis invocation. Accept text notes up to 50,000 Unicode characters and one file per action: PDF up to 10 MiB/25 pages, or PNG/JPEG/WebP up to 10 MiB; reject every other type/limit before upload. Do not add a queue, overwrite originals, or analyze before persistence finalizes.
  Targets: `src/application/evidence/ingest-evidence.ts`, `src/application/evidence/source-locators.ts`, `src/app/api/threads/[threadId]/evidence/route.ts`, `src/components/evidence/evidence-uploader.tsx`, `src/components/evidence/source-reference.tsx`, `tests/application/evidence-ingestion.test.ts`, `tests/integration/evidence-storage.test.ts`, `tests/fixtures/evidence/`.
  Parallelization: Wave 4A after 07 | Blocked by: 03, 07 | Blocks: 09, 11, 13
  References: `docs/architecture.md` “Storage and privacy”; `docs/data-model.md` “Evidence and source locators”; `docs/ai-pipeline.md` “Evidence and source-reference approach”.
  Acceptance criteria: `pnpm exec vitest run tests/application/evidence-ingestion.test.ts && pnpm test:integration -- tests/integration/evidence-storage.test.ts`; note/image/PDF round trips preserve checksum/original and resolving locators; duplicate returns existing ID.
  QA scenarios: happy — `pnpm qa:capture --task task-08-evidence --label happy -- pnpm test:integration -- tests/integration/evidence-storage.test.ts -t "ingests Korean note image and PDF with resolving private citations"`, PASS iff exit 0; failure — `pnpm qa:capture --task task-08-evidence --label failure -- pnpm test:integration -- tests/integration/evidence-storage.test.ts -t "rejects unsupported oversized interrupted and public access while deduplicating replay"`, PASS iff exit 0 with no orphan/public object or false canonical claim.
  Commit: Y | `feat(evidence): ingest private traceable sources`

- [ ] 09. Build living-state projections, open loops, and next best action
  What to do / Must NOT do: Add revision-keyed queries/projections for current state, completed/pending/waiting/blocked/uncertain/overdue items, timeline, open loops, deadlines, risks, conflicts, and one next action with rationale/dependencies/citations/confidence/alternative. Explain meaningful revision changes. Do not derive completion from suggestion or fabricate missing dates.
  Targets: `src/application/state/project-living-state.ts`, `src/application/state/rank-next-action.ts`, `src/application/state/explain-revision.ts`, `src/application/state/thread-queries.ts`, `tests/application/living-state.test.ts`, `tests/fixtures/state/`.
  Parallelization: Wave 4 | Blocked by: 04, 07, 08 | Blocks: 11, 12, 14
  References: `docs/product-spec.md` “State the MVP must show”; `docs/data-model.md` records/statuses; `docs/ai-pipeline.md` adaptive reconciliation.
  Acceptance criteria: `pnpm exec vitest run tests/application/living-state.test.ts`; fixtures assert cited projections, null unknown dates, stale waiting follow-up, single ranked next action, and confirmed value retained during conflict.
  QA scenarios: happy — `pnpm qa:capture --task task-09-living-state --label happy -- pnpm exec vitest run tests/application/living-state.test.ts -t "revises cited living state and one next action after evidence"`, PASS iff exit 0 and before/after JSON snapshot changes; failure — `pnpm qa:capture --task task-09-living-state --label failure -- pnpm exec vitest run tests/application/living-state.test.ts -t "keeps suggestion uncompleted and unknown date null"`, PASS iff exit 0.
  Commit: Y | `feat(state): project adaptive living state`

- [ ] 10. Implement one-record English/Korean localization and localized AI prose
  What to do / Must NOT do: Complete `messages/en.json`/`ko.json`, locale routing/switcher/session preference, localized validation/errors/accessibility, locale formatting, original-content indicators, revision-keyed LocalizedContent, and visible fallback. Preserve names/codes/identifiers. Locale switching must not call canonical mutation APIs.
  Targets: `messages/en.json`, `messages/ko.json`, `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/app/[locale]/layout.tsx`, `src/actions/set-locale.ts`, `src/application/localization/localize-content.ts`, `src/components/i18n/locale-switcher.tsx`, `tests/i18n/dictionaries.test.ts`, `tests/i18n/projection.test.ts`, `e2e/locale-switch.spec.ts`.
  Parallelization: Wave 4 | Blocked by: 02, 07 | Blocks: 11, 12, 14
  References: `docs/i18n.md` entire file; `docs/acceptance-criteria.md` audit rows 13-19.
  Acceptance criteria: `pnpm exec vitest run tests/i18n/dictionaries.test.ts tests/i18n/projection.test.ts && pnpm exec playwright test e2e/locale-switch.spec.ts`; dictionary keys match and EN→KO→EN preserves thread version/hash/IDs.
  QA scenarios: happy — `pnpm qa:capture --task task-10-i18n --label happy -- pnpm exec playwright test e2e/locale-switch.spec.ts --grep "round-trips English Korean English without canonical writes"`, PASS iff exit 0 and stable hash/IDs; failure — `pnpm qa:capture --task task-10-i18n --label failure -- pnpm exec playwright test e2e/locale-switch.spec.ts --grep "falls back visibly to original when localized derivative is absent"`, PASS iff exit 0 and revision count is unchanged.
  Commit: Y | `feat(i18n): add canonical bilingual projection`

- [ ] 11. Compose the polished LifeThread workspace UI
  What to do / Must NOT do: Build responsive accessible views for goal, adaptive plan, timeline, evidence/citations, current state, completed/pending/waiting/open loops/deadlines/risks/conflicts, next action, change explanation, and provenance detail. Keep one dominant next action and progressive disclosure. Do not add unplanned dashboards or hard-coded copy.
  Targets: `src/app/[locale]/threads/[threadId]/page.tsx`, `src/components/workspace/lifethread-workspace.tsx`, `src/components/workspace/current-state.tsx`, `src/components/workspace/timeline.tsx`, `src/components/workspace/open-loops.tsx`, `src/components/workspace/next-action.tsx`, `src/components/workspace/conflict-card.tsx`, `tests/ui/workspace.test.tsx`, `e2e/workspace.spec.ts`.
  Parallelization: Wave 5 after 06/12 service contracts | Blocked by: 05, 06, 08, 09, 10, 13 | Blocks: 14
  References: `docs/product-spec.md` end-to-end journey/state; `docs/i18n.md` UI coverage; `docs/demo-plan.md` timed script.
  Acceptance criteria: `pnpm exec vitest run tests/ui/workspace.test.tsx && pnpm exec playwright test e2e/workspace.spec.ts`; EN/KO desktop/mobile flows expose every required state and citation with no accessibility violations or console errors.
  QA scenarios: happy — `pnpm qa:capture --task task-11-workspace --label happy -- pnpm exec playwright test e2e/workspace.spec.ts --grep "renders and operates the complete cited workspace"`, PASS iff exit 0 with screenshot/trace and no accessibility/console error; failure — `pnpm qa:capture --task task-11-workspace --label failure -- pnpm exec playwright test e2e/workspace.spec.ts --grep "renders empty loading analysis-error and stale states without false completion"`, PASS iff exit 0 and prior state persists.
  Commit: Y | `feat(ui): compose lifethread workspace`

- [ ] 12. Add cited, bilingual suggested communication drafts
  What to do / Must NOT do: Generate email/text/phone/follow-up/checklist/question drafts from current revision in EN, KO, or both, with relevant evidence/entity links and visible “draft/not sent” label. Do not add delivery, contacts integration, or autonomous action.
  Targets: `src/application/communication/generate-draft.ts`, `src/application/communication/communication-schema.ts`, `src/components/communication/communication-draft.tsx`, `src/app/[locale]/threads/[threadId]/communication-actions.ts`, `tests/application/communication.test.ts`, `e2e/communication.spec.ts`.
  Parallelization: Wave 5 | Blocked by: 07, 09, 10 | Blocks: 14
  References: `docs/ai-pipeline.md` “Generated communication”; `docs/product-spec.md` state requirements; `docs/i18n.md` invariants.
  Acceptance criteria: `pnpm exec vitest run tests/application/communication.test.ts && pnpm exec playwright test e2e/communication.spec.ts`; drafts use selected locale/revision, preserve identifiers, cite state, and expose no send control.
  QA scenarios: happy — `pnpm qa:capture --task task-12-communication --label happy -- pnpm exec playwright test e2e/communication.spec.ts --grep "creates cited English and Korean drafts that remain unsent"`, PASS iff exit 0; failure — `pnpm qa:capture --task task-12-communication --label failure -- pnpm exec playwright test e2e/communication.spec.ts --grep "refuses unsupported draft when facts or citations are insufficient"`, PASS iff exit 0 and no draft row/send control exists.
  Commit: Y | `feat(communication): draft cited bilingual follow-ups`

- [ ] 13. Enforce privacy, safety, observability, and honest failure behavior
  What to do / Must NOT do: Centralize redacted structured logging, safe error categories, file/AI timeouts, CSRF/input boundaries appropriate to operator-controlled demo, signed-URL expiry, privacy deletion cascade, high-stakes disclaimers, limitations panel, and recorded-fixture label. Do not claim production auth/security certification or log sensitive payloads.
  Targets: `src/lib/logging.ts`, `src/lib/safe-errors.ts`, `src/application/privacy/delete-evidence.ts`, `src/application/safety/high-stakes.ts`, `src/components/system/limitations-panel.tsx`, `src/components/system/analysis-error.tsx`, `tests/security/privacy.test.ts`, `tests/application/failures.test.ts`.
  Parallelization: Wave 4 | Blocked by: 03, 07, 08, 10 | Blocks: 11, 14
  References: `docs/architecture.md` privacy/access; `docs/ai-pipeline.md` failure/privacy; `docs/product-spec.md` risk table; `docs/demo-plan.md` failure path.
  Acceptance criteria: `pnpm exec vitest run tests/security/privacy.test.ts tests/application/failures.test.ts`; integration proves expired/public URL denial and deletion transitions `requested -> deleting -> deleted` only after ordered original/derived cleanup, or `failed_retryable` after partial failure; retries are idempotent, the tombstone is content-free, and captured logs contain no fixture secrets/text.
  QA scenarios: happy — `pnpm qa:capture --task task-13-safety --label happy -- pnpm exec vitest run tests/security/privacy.test.ts -t "deletes original and derived content leaving content-free tombstone"`, PASS iff exit 0 and captured logs contain no fixture text; failure — `pnpm qa:capture --task task-13-safety --label failure -- pnpm exec vitest run tests/security/privacy.test.ts -t "recovers idempotently from partial storage or database deletion failure"`, PASS iff exit 0 and state is `failed_retryable` with no false deleted claim.
  Commit: Y | `feat(safety): enforce private honest failure boundaries`

- [ ] 14. Create the idempotent demo profile, reset/preflight, and timed journey
  What to do / Must NOT do: Add synthetic seed/reset scripts, fixed `demo_user`, known thread, visible demo/limitations labels, preflight, and Playwright timed journey following `docs/demo-plan.md`. Seed through normal repositories/routes. Recorded AI mode is test-only unless persistently labeled. Do not include real PII or expose a public URL.
  Targets: `scripts/demo/seed.ts`, `scripts/demo/reset.ts`, `scripts/demo/preflight.ts`, `src/components/system/demo-profile-banner.tsx`, `tests/fixtures/demo/`, `e2e/demo.spec.ts`.
  Parallelization: Wave 6 | Blocked by: 06, 09, 10, 11, 12, 13 | Blocks: 15
  References: `docs/demo-plan.md` entire file; `docs/build-log.md` demo/deferred sections; `.omo/drafts/lifethread-mvp.md` approved identity decision.
  Acceptance criteria: `pnpm demo:preflight && pnpm demo:reset && pnpm demo:reset && pnpm exec playwright test e2e/demo.spec.ts`; reset is idempotent (same IDs/one profile), journey completes under 180 seconds, and screenshots show labels/stable IDs.
  QA scenarios: happy — `pnpm qa:capture --task task-14-demo --label happy -- pnpm exec playwright test e2e/demo.spec.ts --grep "preflights resets twice and completes all fourteen beats under 180 seconds"`, PASS iff exit 0, same seeded IDs, screenshots/traces, and cleanup receipt; failure — `pnpm qa:capture --task task-14-demo --label failure -- pnpm exec playwright test e2e/demo.spec.ts --grep "halts on missing credential or private policy without stale or fixture success"`, PASS iff exit 0 and test asserts named remediation/persistent mode label/no canonical mutation.
  Commit: Y | `feat(demo): add resettable three-minute journey`

- [ ] 15. Close the full acceptance, regression, and documentation gate
  What to do / Must NOT do: Run all suites, four-domain same-path proof, locale/conflict/privacy/adversarial/browser journeys; inspect coverage of all 21 audit rows; update README/build log only with observed behavior; record limitations. Do not mark plan checkboxes or docs as implemented without evidence and do not expand scope to fix optional gaps.
  Targets: `scripts/qa/acceptance-audit.mjs`, `scripts/qa/mutation-proof.mjs`, `tests/acceptance/four-domain.test.ts`, `tests/acceptance/audit.test.ts`, `e2e/acceptance.spec.ts`, `docs/build-log.md`, `docs/acceptance-criteria.md`, `README.md`, `.omo/evidence/task-15-acceptance/`.
  Parallelization: Wave 6 final | Blocked by: 14 | Blocks: F1-F4
  References: `docs/acceptance-criteria.md` entire file; `docs/build-log.md` future protocol; `README.md`; every prior task evidence directory.
  Acceptance criteria: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration && pnpm test:e2e && pnpm demo:preflight && pnpm ai:smoke`; a generated audit maps every row to a passing command/artifact, including the live GPT smoke metadata; `git diff --name-only` contains no unapproved scope.
  QA scenarios: happy — `pnpm qa:capture --task task-15-acceptance --label happy -- node scripts/qa/acceptance-audit.mjs`, PASS iff the script runs lint/typecheck/unit/integration/e2e/preflight, finds no skipped test, and emits a 21-row artifact map; failure — `pnpm qa:capture --task task-15-acceptance --label failure -- node scripts/qa/mutation-proof.mjs`, PASS iff the script temporarily injects an unseen-goal schema discriminator and removes one locale key, observes the intended domain/dictionary failures, restores both in `finally`, reruns them green, and its cleanup receipt proves `git diff --exit-code -- messages tests/fixtures`.
  Commit: Y | `test(acceptance): prove lifethread mvp`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Compare delivered files/behavior to Todos 01-15 and all Must/Must-NOT clauses; write `.omo/evidence/final-verification/f1-plan-compliance/`; APPROVE only with cited evidence per todo and no unchecked requirement.
- [ ] F2. Code quality review
  Run diagnostics plus `pnpm lint && pnpm typecheck && pnpm test`; write `.omo/evidence/final-verification/f2-code-quality/`; inspect domain/infrastructure boundaries, sensitive logging, transaction/idempotency/concurrency paths; APPROVE only with no blocker/high finding.
- [ ] F3. Real manual QA
  Independently drive the real browser through create/edit/evidence/conflict/next-action/draft/locale-switch and one failure path; write `.omo/evidence/final-verification/f3-manual-qa/`; capture action log, screenshots, console, and cleanup; APPROVE only if observed behavior matches claims.
- [ ] F4. Scope fidelity
  Audit diff, dependencies, routes, database/storage policies, UI copy, README/build log, and network surfaces against Must-NOT-Have; write `.omo/evidence/final-verification/f4-scope/`; APPROVE only if no scenario hard-coding, public sharing, hidden mock, or unapproved feature exists.

## Critical-path budget and cut line

Day 1: Todos 01-04. Day 2: Todos 05-10 plus the core workspace. Final half-day: Todos 11-15 and demo rehearsal. If time runs short, defer in this order: communication polish, enhanced PDF extraction, extra scenario fixtures, non-demo responsive polish, then optional integrations. Never defer arbitrary goal creation, provenance, confirmed-fact protection, private evidence, bilingual switching, live smoke test, or the three-minute demo proof.

All four run only after Todo 15 and may run in parallel. Surface results and wait for explicit user acceptance before declaring implementation complete.

## Commit strategy

- One conventional commit per todo using the exact subject listed; never combine unfinished dependent tasks or commit a red build.
- Before each commit: targeted task QA plus `pnpm lint && pnpm typecheck && pnpm test` must pass; include only that todo’s files/evidence references.
- Do not auto-commit unless the execution session is authorized to do so. Otherwise stage intentionally and present the proposed commit.
- Final implementation commit footer: `Plan: .omo/plans/lifethread-mvp.md`.
- Planning artifacts in this turn remain uncommitted unless the user separately requests a commit.

## Success criteria

- Any non-empty Korean, English, mixed, or unseen goal creates one category-free LifeThread and tentative editable plan through the same services/schema.
- Full task/milestone human controls preserve immutable origin, citations, confirmation, tombstones, and revisions under reload/concurrency.
- Text/image/PDF originals are private, immutable in normal paths, idempotent by checksum+thread, and every important direct claim resolves to them.
- CandidateDelta is strict and deterministic; malformed, uncited, stale, duplicate, adversarial, refused, timed-out, or confirmed-fact-conflicting output cannot perform a forbidden mutation.
- Current state exposes all required statuses, facts, timeline, open loops, deadlines, waiting, risks/conflicts, and exactly one cited next best action.
- EN/KO dictionaries are complete; KO/EN/mixed input shares one schema; locale round trips leave canonical version/hash/IDs unchanged; originals and localized derivatives stay separate.
- One visibly labeled `demo_user` flow completes all proof beats in under three minutes with no public sharing, external sending, or hidden live/recorded ambiguity.
- All 21 acceptance audit rows map to passing commands/artifacts; lint, typecheck, unit, integration, e2e, preflight, and F1-F4 all approve with no skip/suppression.
- README/build log describe only observed implementation status and limitations. Optional stretch goals remain absent unless separately approved.

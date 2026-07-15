---
slug: lifethread-mvp
status: high-accuracy-repaired-awaiting-review
intent: clear
review_required: true
pending-action: rerun independent high-accuracy review after plan-only repairs
approach: Next.js TypeScript modular monolith with Supabase Postgres and Storage, a strict candidate-delta GPT boundary, deterministic reconciliation, and one canonical bilingual state
---

# Draft: lifethread-mvp

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| ID | Outcome | Status | Evidence path |
| --- | --- | --- | --- |
| C1 | A user creates an arbitrary free-form goal and receives a clearly tentative, editable initial plan. | active | `.omo/evidence/task-05-create-thread/` |
| C2 | A canonical, revisioned state preserves provenance, uncertainty, and user-confirmed facts. | active | `.omo/evidence/task-04-state-engine/` |
| C3 | Text, image, and PDF evidence remains immutable and every important derived claim is traceable to it. | active | `.omo/evidence/task-08-evidence/` |
| C4 | GPT-5.6 returns schema-valid candidate deltas that deterministic reconciliation may accept, reject, or convert into conflicts. | active | `.omo/evidence/task-07-ai-reconciliation/` |
| C5 | English and Korean are projections of one canonical LifeThread, including mixed-language input and localized generated prose. | active | `.omo/evidence/task-10-i18n/` |
| C6 | One honest, clearly labeled demo profile proves the complete three-minute flow without public sharing. | active | `.omo/evidence/task-14-demo/` |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

| Assumption | Approved default | Rationale | Reversible? |
| --- | --- | --- | --- |
| Persistence and files | Supabase Postgres and Storage | One managed service minimizes hackathon integration overhead while supporting relational revisions and original files. | Yes, behind repository/storage boundaries; not during the MVP. |
| Identity | One clearly labeled demo profile; no public sharing | Proves persistence and the product flow without spending the 2-3 day window on production auth or isolation. | Yes; production auth is explicitly deferred. |
| Timeline | 2-3 days | Requires one polished vertical slice and disciplined exclusion of integrations and production infrastructure. | No for this event; scope is sized to it. |
| Test strategy | TDD for domain/reconciliation invariants; AI contract tests; tests-after for presentational UI; Playwright for the browser demo | Matches risk to the cheapest faithful proof. | Yes at implementation planning boundaries, not by silently dropping coverage. |

## Findings (cited - path:lines)

- The repository begins without tracked source, package metadata, tests, CI, or runtime; only the planning ledger exists (`.omo/ulw-notepad-lifethread-plan.md`).
- The approved architecture is a TypeScript modular monolith with six independently verifiable components, recorded in the durable discovery synthesis (`.omo/ulw-notepad-lifethread-plan.md`).
- The repository-owned requirements digest at `docs/requirements-digest.md` records the 19 proposal sections, 21-question acceptance contract, and approved owner defaults with stable line-addressable evidence.
- GPT schema adherence is not factual correctness; the application must independently validate provenance, dates, statuses, confidence, and confirmed-fact transitions.

## Decisions (with rationale)

- Build a Next.js App Router TypeScript modular monolith so UI, route handlers, domain services, and Supabase adapters ship together on Vercel without a second runtime.
- Use Supabase Postgres for canonical state/revisions and private Supabase Storage for original evidence; store only object references in relational records.
- Use a single `LifeThread` aggregate and language-neutral enums; localized UI/prose never becomes canonical state and never duplicates the aggregate.
- Treat all model output as a `CandidateDelta`; only deterministic reconciliation writes canonical revisions.
- Make user confirmation an explicit UI command attributed to fixed actor `demo_user` and unavailable to the model; contradictions create `Conflict` records.
- Persist original evidence before analysis, use checksums/idempotency keys, and keep translations/summaries as deletable derived artifacts.
- Use one clearly labeled seeded demo profile and deny public sharing; do not imply production-grade multi-user isolation.
- Keep the implementation within a 2-3 day vertical slice, with email/calendar integrations, notifications, collaboration, export/sharing, and production auth deferred.

## Scope IN

- Arbitrary goal creation with tentative interpretation and editable milestone/task proposals.
- Full task create/edit/delete/complete/reopen/reorder/priority controls with immutable origin provenance.
- Text, image, and PDF evidence upload through private storage, plus traceable extracted facts and timeline events.
- Canonical current state, open loops, deadlines, waiting states, risks, conflicts, and one next best action.
- Candidate-delta GPT-5.6 analysis, strict schema validation, deterministic reconciliation, revisions, and idempotency.
- English/Korean UI, Korean/English/mixed input, locale switching on one underlying record, and localized communication drafts.
- A single labeled demo profile, honest limitations, automated model/contract/browser checks, and a three-minute English-judge-friendly demo.

## Scope OUT (Must NOT have)

- No fixed workflow catalog, required category, scenario-specific schema, or separate code path for prepared demos.
- No public sharing, collaboration, production-grade authentication/authorization, autonomous external action, or external email/calendar sending.
- No background queue, mobile app, broad integration suite, template library, export system, or additional language.
- No model-written canonical state, silent overwrite of confirmed facts, invented dates, uncited important conclusions, or raw sensitive prompt/response logging.
- No hidden mock presented as functional and no implementation before explicit post-plan approval.

## Open questions

None. The three owner decisions and the test strategy are approved; executor judgment must not be required.

## Approval gate
status: approved-for-plan
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

- Approval received: 2026-07-15.
- Approved defaults: Supabase Postgres and Storage; one clearly labeled demo profile with no public sharing; 2-3 day hackathon timeline.
- This approval authorizes planning and documentation artifacts only.
- Implementation remains blocked until the user explicitly approves starting work after reviewing the completed plan.

## Metis gap-analysis resolutions

- Documentation manifest: `README.md`; `docs/requirements-digest.md`; `docs/product-spec.md`; `docs/architecture.md`; `docs/data-model.md`; `docs/ai-pipeline.md`; `docs/i18n.md`; `docs/demo-plan.md`; `docs/acceptance-criteria.md`; `docs/build-log.md`.
- Task deletion is a user-visible tombstone transition retaining origin, revision history, and source links; physical deletion of tasks/revisions is prohibited in MVP application paths.
- The only MVP actor is fixed `demo_user`. “User-confirmed” means an explicit UI transition attributed to that actor, not production authentication. The demo is operator-controlled/local or platform-protected; no public URL or sharing contract is required.
- Original objects stay in a private Storage bucket and are read through short-lived server-issued signed URLs. Public object access must fail.
- Standard toolchain decision: `pnpm`, strict TypeScript, Vitest, Testing Library, and Playwright. Required credentials are checked before live integration/demo commands; deterministic unit/contract tests do not silently skip when credentials are absent.
- Durable evidence convention: `.omo/evidence/<task-id>/`; `/tmp` is disposable only. Every plan todo names happy and failure evidence under its stable task ID.
- Canonical ordering: foundation -> C2 contracts/revisions -> C3 persistence/evidence -> C4 AI/reconciliation -> C1 application flow -> C5 localization -> C6 demo/acceptance. UI shells may parallelize only after consumed contracts are fixed.
- Evidence immutability means no overwrite through application paths; checksum + thread ID provides upload idempotency; failures remain visible/retryable; privacy deletion is a separate explicit cascade that removes originals and derived content while retaining only a content-free audit tombstone.
- `CandidateDelta` is versioned, strict, and closed to allowed operations. Validation order is schema -> semantics/provenance -> confirmed-fact guard -> idempotency/version check -> atomic conflict/revision write. Invalid, uncited, invented-date, timed-out, duplicate, or stale candidates do not mutate canonical state.
- Locale switching performs zero canonical writes. Original free text is verbatim; canonical enums are language-neutral; generated prose is keyed by entity/revision/locale/generator version and visibly falls back to original content.
- High-accuracy BLOCK repairs applied: normative CandidateDelta identity/precedence; requirements digest; authoritative DAG; live GPT smoke test; privacy deletion state machine; objective limits/citation rules; expected-exit QA; final evidence paths; time budget/cut line; non-empty repository bootstrap staging.
- Fresh review is required. No high-accuracy APPROVE is claimed until a reviewer returns APPROVE. Implementation remains blocked.
- The hybrid test strategy is a planner decision derived from risk, not one of the three owner-approved defaults.

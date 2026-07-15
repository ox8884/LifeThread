# LifeThread MVP Acceptance Criteria

Status: proposal audit and future executable acceptance contract; no implemented behavior is claimed

## 19-section documentation crosswalk

| # | Required section | Owner artifact | Acceptance assertion |
| --- | --- | --- | --- |
| 1 | Understanding of LifeThread | `docs/product-spec.md` | Defines a domain-agnostic bilingual evidence-backed living state |
| 2 | Core user problem | `docs/product-spec.md` | Explains scattered information, lost state, and next-action need |
| 3 | Arbitrary goals | `docs/product-spec.md` | No category/template required; four scenarios share one path |
| 4 | Proposed MVP | `docs/product-spec.md` | One polished complete vertical journey with control and limitations |
| 5 | Technology stack | `docs/architecture.md` | Stack and 2-3 day rationale are explicit; versions deferred to authorized scaffold |
| 6 | Domain-agnostic model | `docs/data-model.md` | Generic entities, revisions, statuses, and four-scenario mapping |
| 7 | Task provenance | `docs/data-model.md` | Four immutable origins plus confirmation/tombstone semantics |
| 8 | Adaptive planning | `docs/data-model.md`, `docs/ai-pipeline.md` | Candidate deltas, revisions, idempotency, and conflicts |
| 9 | Evidence/source references | `docs/ai-pipeline.md`, `docs/data-model.md` | Originals immutable/private; important claims resolve to locators |
| 10 | Bilingual architecture | `docs/i18n.md` | One canonical thread; dictionaries/originals/localized derivatives separated |
| 11 | Language-aware AI | `docs/ai-pipeline.md` | Korean/English/mixed input returns one strict schema |
| 12 | Confirmed-fact protection | `docs/ai-pipeline.md`, `docs/data-model.md` | Model cannot confirm/overwrite; contradiction creates conflict |
| 13 | Three-minute demo | `docs/demo-plan.md` | Timed English-judge-friendly Korean-evidence journey under 180 seconds |
| 14 | Required MVP | `docs/product-spec.md` | Complete vertical scope enumerated |
| 15 | Optional stretch goals | `docs/product-spec.md` | Clearly deferred and cannot preempt MVP |
| 16 | Major risks | `docs/product-spec.md`, `docs/architecture.md` | AI, privacy, bilingual, demo, scope, and high-stakes controls |
| 17 | Open product questions | `.omo/drafts/lifethread-mvp.md` | None remain; three owner defaults recorded as approved |
| 18 | Phased implementation | `.omo/plans/lifethread-mvp.md` | Dependency-complete waves, todos, QA, and commits |
| 19 | Clear acceptance criteria | This document | 21-question audit and future command-level gate |

## Proposal acceptance audit

| # | Audit question | Result and mechanism |
| --- | --- | --- |
| 1 | Can a user enter any free-form goal? | PASS (plan): free text is the only required creation input |
| 2 | Are predefined categories unnecessary? | PASS: no category/workflow field controls schema, prompt, or routing |
| 3 | Can AI propose an editable plan? | PASS: tentative CandidateDelta milestones/tasks with human transitions |
| 4 | Can users add/edit/delete/complete/reopen/reorder tasks? | PASS: full commands; delete is a provenance-preserving tombstone |
| 5 | Can users reject AI assumptions? | PASS: proposed items support accept/edit/reject and correction |
| 6 | Are user and AI tasks distinguishable? | PASS: immutable `source_type` and confirmation fields |
| 7 | Can evidence adapt plan/next action? | PASS: evidence analysis feeds deterministic reconciliation/revision |
| 8 | Are confirmed facts preserved? | PASS: model cannot confirm; contradiction creates unresolved conflict |
| 9 | Is the model domain-agnostic? | PASS: generic aggregate/entities and canonical transitions |
| 10 | Do home/computer/travel/custom goals share architecture? | PASS: parameterized contract requires identical services/tables |
| 11 | Are important AI conclusions traceable? | PASS: resolving original-evidence references required |
| 12 | Are completed/pending/in-progress/waiting/blocked/uncertain/rejected/overdue distinct? | PASS: language-neutral canonical enum includes all |
| 13 | Do Korean/English/mixed inputs share one schema? | PASS: language is metadata/presentation, not a schema branch |
| 14 | Can one thread switch languages without duplication? | PASS: locale round trip performs zero canonical writes |
| 15 | Is user-facing text externalized? | PASS by architecture: locale dictionaries and parity/static checks required |
| 16 | Are originals separated from translations? | PASS: verbatim evidence plus separate revisioned `LocalizedContent` |
| 17 | Are statuses/enums language-neutral? | PASS: labels are presentation-only |
| 18 | Can English-speaking judges understand the demo? | PASS by timed script: English analysis precedes Korean switch |
| 19 | Does demo prove genuine Korean evidence analysis? | PASS by citations from English derived state to Korean original |
| 20 | Is scope viable in 2-3 days? | PASS with one profile/vertical slice and explicit exclusions; execution risk remains high |
| 21 | Is this adaptive rather than chat/checklist? | PASS: persistent revisions, provenance, conflicts, open loops, and next action |

“PASS (plan)” means the architecture and implementation plan contain a mechanism and future proof. It does not claim application behavior exists.

## Future executable gate

The implementation is accepted only when all commands exit zero and evidence is captured under `.omo/evidence/`:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:integration` with isolated configured Supabase services
- `pnpm test:e2e`
- `pnpm demo:preflight`
- `pnpm demo:reset`
- `pnpm ai:smoke` with live GPT-5.6 credentials; it must fail fast when credentials are absent, call the Responses API, validate and reconcile one CandidateDelta, and record metadata only without raw user content.
- Playwright three-minute journey, four-domain journey, locale round trip, conflict protection, private-file rejection, and failure-state journeys

No suite may silently skip because credentials are missing. Unit/fixture tests remain deterministic; live integration/demo commands fail fast with named missing prerequisites.

Expected-failure QA uses `pnpm qa:capture --expect-exit N -- <command>`. The wrapper records the child exit code, treats exactly N as a passing expected failure, and still fails on any other code. Final F1-F4 review lanes write receipts under `.omo/evidence/final-verification/.`

## Must-NOT-Have audit

Acceptance fails if implementation introduces a required category/template, scenario-specific table/route/prompt, public Storage or share URL, production-auth claim, external send action, silent model mutation, hard-coded user-facing TSX copy, translated canonical enum, original-evidence overwrite, hidden mock, or uncited important conclusion.

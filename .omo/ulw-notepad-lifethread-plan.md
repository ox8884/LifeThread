# Ultrawork Notepad — Evidence-backed pre-implementation plan for LifeThread
Started: 2026-07-15T15:09:56-04:00

## Plan (exhaustively detailed)
1. Read all selected planning directives and their relevant references.
2. Inspect repository layout, existing docs, configuration, current behavior, environment, and recent history in one broad discovery wave.
3. Classify intent and identify only genuine product-owner decisions not resolved by the repository or explicit brief.
4. Compare 2–3 viable MVP architecture approaches and choose a recommendation without implementing it.
5. Draft the requested domain-agnostic product, architecture, model, AI, i18n, demo, acceptance, and build-log documents.
6. Create one decision-complete `.omo` implementation plan and audit every stated product/bilingual requirement.
7. Validate document completeness, internal consistency, absence of hard-coded scenario assumptions, and workspace cleanliness.
8. Perform the required HEAVY review gate, resolve criterion-linked blockers, and present the approval checkpoint without implementing.

## Success criteria + QA scenarios
Tier: HEAVY — the request defines a new domain model, AI boundary, bilingual architecture, evidence provenance system, and cross-cutting product design.

1. Happy path: all eight requested docs plus one `.omo` plan exist and collectively cover the 19 requested response sections. Scenario: `rg --files docs .omo | sort` followed by a checklist audit; PASS only if every requested artifact exists and every section is substantively answered. Evidence: `/tmp/lifethread-plan-artifacts.txt` and `/tmp/lifethread-section-audit.txt`. Failing-first: pure-prose target, so no synthetic RED; baseline missing-artifact inventory is captured before edits.
2. Boundary/domain-agnostic: the proposal supports home sale, computer troubleshooting, travel, and an unanticipated custom goal through one canonical model, with no required workflow catalog. Scenario: inspect the model and architecture docs against a four-scenario matrix; PASS only if all four map to the same entities/state transitions and no scenario-specific table or required category is introduced. Evidence: `/tmp/lifethread-domain-audit.txt`. Failing-first: QA-by-read baseline of current docs records gaps before edits.
3. Bilingual/evidence integrity: one LifeThread supports English/Korean display, mixed-language input, immutable original evidence, canonical statuses, localized derived prose, and protected confirmed facts. Scenario: audit explicit invariants and sample state transitions in docs; PASS only if all requirements are represented without duplicated records or overwrite semantics. Evidence: `/tmp/lifethread-i18n-integrity-audit.txt`. Failing-first: QA-by-read baseline of current docs records gaps before edits.
4. Regression/scope: the proposed MVP remains a polished three-minute end-to-end workflow, clearly labels mocked/deferred behavior, and does not alter product code or silently choose unresolved owner decisions. Scenario: `git diff --name-only` plus plan scope audit; PASS only if changes are documentation/plan artifacts, deferred items are explicit, and the approval gate is recorded. Evidence: `/tmp/lifethread-scope-audit.txt`. Failing-first: baseline diff and current build-log state captured before edits.
5. Adversarial consistency: every audit question from the brief receives an explicit PASS/FAIL with a cited design mechanism, and no placeholders or contradictions remain. Scenario: `rg -n 'TBD|TODO|FIXME|placeholder' docs .omo` plus manual cross-document audit; PASS only if no unresolved placeholders appear and all audit rows pass. Evidence: `/tmp/lifethread-consistency-audit.txt`. Failing-first: baseline audit captured before edits.

WHEN TO STOP: I'll stop right away when the repository-backed proposal, all requested docs, decision-complete implementation plan, full acceptance audit, evidence captures, cleanup receipts, and unconditional reviewer approval are present, with implementation explicitly untouched pending user approval.

## Now
Read selected skill references, then begin the broad discovery wave.

## Todo
- Read ulw-plan CLEAR and full-workflow references plus Codex tool adaptation.
- Inspect repository, docs, environment, and history; capture baselines.
- Classify intent and decide whether owner questions survive.
- Scaffold `.omo` plan artifacts using the mandated script.
- Draft and validate requested documentation.
- Run all five QA scenarios and record artifacts/cleanup.
- Run HEAVY reviewer loop to unconditional approval.
- Present the proposal and approval gate; do not implement.

## Findings
- 2026-07-15: User explicitly authorized planning/doc artifacts and prohibited full implementation before review and approval.
- 2026-07-15: Pure prose has no legitimate RED seam under ultrawork; baseline gap inventories plus QA-by-read are the required proof.
- 2026-07-15: Selected skills: `omo:ultrawork` for evidence-bound rigor; `omo:ulw-plan` because explicitly named; `superpowers:brainstorming` to compare architectures; `superpowers:using-superpowers` for skill routing.
- 2026-07-15: `/tmp` patching is rejected by the repository LSP hook, so the durable append-only notepad lives inside `.omo/`; the empty `/tmp` allocation remains cleanup-only.

## Learnings
- Preserve the distinction between approval of the proposal and authorization to implement; this turn ends at the former.

## Resume transition — 2026-07-15T15:24:00-04:00
- User approved all three owner decisions: Supabase Postgres and Storage; one clearly labeled demo profile with no public sharing; 2-3 day timeline.
- Intent remains CLEAR; `review_required: false`; tier remains HEAVY because the plan covers a new domain model, AI mutation boundary, storage architecture, and bilingual canonical state.
- Exact original specification recovered from Codex parent session `019f672e-e579-7800-99e3-0d3995405357`; required artifacts are eight `docs/*.md` files, `README.md`, `.omo/drafts/lifethread-mvp.md`, and `.omo/plans/lifethread-mvp.md`.
- Mandated scaffold command passed: `node .../scaffold-plan.mjs lifethread-mvp --clear`; both `.omo` artifacts were created without application code.
- Now: record approved decisions in the draft, then run mandatory Metis gap analysis before appending the implementation plan.
- Todo: Metis gap analysis; write requested docs; append decision-complete plan; fill TL;DR last; five QA audits; HEAVY artifact review; scope/cleanup receipt; approval-gated handoff.

## Metis receipt — 2026-07-15T15:31:00-04:00
- Reviewer `/root/metis_gap` completed with C1-C6/docs/QA/dependency/scope coverage and identified actionable skeleton gaps.
- Folded decisions: tombstone task deletion; fixed `demo_user` actor; operator-controlled non-public demo; private Storage with short-lived signed URLs; `pnpm` + Vitest + Playwright; fail-fast credentials; `.omo/evidence/<task-id>/`; strict CandidateDelta validation order; zero-write locale switching; explicit C2 -> C3 -> C4 -> C1 -> C5 -> C6 dependency spine.
- Metis blockers refer to the intentionally empty generated skeleton and are resolved by the documentation/plan work now beginning.
- Now: write the product specification and README from the recovered 19-section contract.

## Transition — 2026-07-15T15:13:00-04:00
- Completed selected-skill reads: ultrawork, ulw-plan, CLEAR intent, full workflow, brainstorming, using-superpowers Codex adaptation, OpenAI docs, and git-master.
- Now: broad repository/environment/external-contract discovery.
- Direct baseline: repository has no tracked files or commits; branch is `master`; only `.omo/` created for this planning ledger is untracked.
- Environment: Node 22.22.2, npm 10.9.7, pnpm 11.8.0, Bun 1.3.14, Python 3.11.15, Git 2.43.0, Linux aarch64.
- CodeGraph exists but returned no relevant code because the project has zero indexed source files; do not call it again this session.
- OpenAI Developer Docs MCP tools are not exposed in this session; use official OpenAI-domain web fallback and independently verify agent claims.

## Discovery synthesis — 2026-07-15T15:18:00-04:00
- Five read-only lanes completed: repository surface, test/tooling, official OpenAI contracts, execution topology, and adversarial risk/QA.
- Independently verified: no tracked files, commits, package manifest, docs, tests, CI, or runnable application; `.omo/` is the only untracked content created for planning.
- Official OpenAI fallback verified: GPT-5.6 models support multilingual text/image input and Structured Outputs; Responses API supports strict JSON-schema output and file inputs; `store: false` reduces Responses application-state retention but does not eliminate documented abuse-monitoring or file/image exceptions.
- Intent: CLEAR. Review modifier absent (`review_required: false`). Architecture-sized plan.
- Topology lock: (C1) goal/plan UX, (C2) canonical state + provenance, (C3) evidence ingestion, (C4) GPT analysis + deterministic reconciliation, (C5) bilingual projection, (C6) demo/acceptance harness.
- Recommended approach for approval: TypeScript modular monolith using Next.js App Router, managed Postgres/object storage, a candidate-delta AI boundary, deterministic confirmed-fact protection, and one canonical bilingual state.
- Alternative approaches to present: local-only Next.js/SQLite and split SPA/FastAPI; both lose hackathon speed or deploy simplicity relative to the recommendation.
- Default test strategy pending approval: TDD for model/reconciliation invariants, contract tests for AI schemas, tests-after for UI components, and Playwright real-browser coverage for the demo.
- Owner decisions that survive evidence/default filters: managed backend choice, demo identity/auth scope, and actual time remaining.

## Approval gate — 2026-07-15T15:18:00-04:00
- Status: awaiting approval and answers to three owner decisions.
- Pending after approval: scaffold `.omo/drafts/lifethread-mvp.md` and `.omo/plans/lifethread-mvp.md`, run mandatory gap analysis, write the requested `docs/*.md` proposal artifacts, then return for implementation authorization.
- Approval authorizes planning documents only. It does not authorize application implementation.
- No source code, package manifest, dependency, database, deployment, or product implementation has been created.
- Cleanup receipt: removed the empty rejected `/tmp/ulw-20260715-150956.osviNq.md` allocation; `test ! -e` exited 0. No server, browser, container, port, or other runtime resource was created.

## Planning artifact + QA receipt — 2026-07-15T15:48:00-04:00
- Created exactly the requested documentation set: `README.md` plus eight `docs/*.md` files; scaffolded draft/plan under `.omo/`; created no application/runtime artifact.
- Plan skeleton completed with 15 stable implementation-and-test todos, exact references/acceptance/happy+failure QA/evidence/commit lines, dependency matrix, F1-F4 final wave, success criteria, and TL;DR filled last.
- QA criterion 1 PASS: 12 required planning artifacts present; 19 sections, 21 audit questions, 15 todos, and canonical header order. Evidence: `/tmp/lifethread-plan-artifacts.txt`, `/tmp/lifethread-section-audit.txt`.
- QA criterion 2 PASS: home sale, computer troubleshooting, travel, and unanticipated goal map to one canonical model with explicit scenario-specific prohibition. Evidence: `/tmp/lifethread-domain-audit.txt`.
- QA criterion 3 PASS: one canonical bilingual record, verbatim originals, separate localized derivatives, strict shared schema, confirmed-fact conflict protection, and zero-write locale roundtrip. Evidence: `/tmp/lifethread-i18n-integrity-audit.txt`.
- QA criterion 4 PASS: only `README.md`, `docs/`, and `.omo/` files exist; `package.json`, lockfile, `src`, `supabase`, dependencies, build output, and deployment config are absent; implementation gate is explicit. Evidence: `/tmp/lifethread-scope-audit.txt`.
- QA criterion 5 first check false-positive: broad marker regex matched its own quoted audit command in this notepad. Narrowed to syntactic unresolved markers (`TODO:`/`TBD:`/`FIXME:` and scaffold tokens); PASS with approved decisions consistent and 19/21 counts correct. Evidence: `/tmp/lifethread-consistency-audit.txt`.
- Pure-prose target: no synthetic RED seam; baseline absence was already recorded before edits, and QA-by-read plus structural audits are the faithful proof.
- No QA runtime resource was spawned: no server, browser, container, port, socket, temp directory, or background process. `/tmp` contains evidence text files intentionally retained for handoff; no cleanup-required runtime state exists.
- Now: HEAVY artifact reviewer loop against the complete documents, plan, and five QA receipts.

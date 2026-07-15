# Ultrawork Notepad — Implement and verify the complete LifeThread MVP
Started: 2026-07-15T16:42:48-04:00

## Plan (exhaustively detailed)
1. Bootstrap: read binding skills, inspect the authoritative plan and repository state, verify current OpenAI Responses structured-output guidance, classify HEAVY, create goal/notepad/live plan, and register Boulder/ledger state.
2. Todo 01: delegate scaffold/TDD/foundation implementation; independently adversarially verify RED→GREEN evidence, browser shell, fail-fast preflight/smoke, cleanup, and global gate; then mark plan checkbox.
3. Todo 02: delegate canonical domain contracts/transitions TDD; independently verify forbidden model-confirmation/category paths and global gate; then mark checkbox.
4. Wave 2: delegate Todo 03 Supabase schema/private storage/repositories and Todo 04 aggregate/revision/provenance engine in parallel; independently verify each including privacy/concurrency/adversarial evidence and global gate; then mark both checkboxes.
5. Todo 07: delegate strict GPT-5.6 Responses gateway, Zod structured CandidateDelta schema, deterministic reconciler, fixtures, fail-fast/live smoke; independently verify malformed/refusal/incomplete/timeout/injection/stale/replay boundaries and global gate; then mark checkbox.
6. Todo 08: delegate private note/image/PDF evidence ingestion with source locators/idempotency; independently verify limits/public denial/orphan cleanup and global gate; then mark checkbox.
7. Wave 4B: delegate Todos 05 free-form goal creation, 09 living-state projections, and 10 canonical bilingual localization in parallel when their dependencies are green; independently verify each real surface/adversarial class/global gate; then mark checkboxes.
8. Todo 13: after Todo 10, delegate safety/privacy/observability/failure boundaries; independently verify redaction, partial deletion recovery, timeout and fixture labeling; then mark checkbox.
9. Wave 5: delegate Todos 06 human task/milestone controls and 12 bilingual unsent communication drafts in parallel; independently verify each including stale concurrency/no-send boundary/global gate; then mark checkboxes.
10. Todo 11: delegate complete responsive LifeThread workspace UI under DESIGN.md, design/perfection/Next.js rules; independently verify unit/e2e, accessibility, CJK, responsive real-browser visual QA and cleanup; then mark checkbox.
11. Todo 14: delegate idempotent demo_user seed/reset/preflight and under-180-second Playwright journey; independently verify two resets, labels, stable IDs, unavailable-service fail-fast, and cleanup; then mark checkbox.
12. Todo 15: delegate acceptance audit, mutation proof, four-domain path, docs updates from observed results only; independently verify full deterministic and available live gates; then mark checkbox.
13. Final F1-F4: dispatch independent compliance, code-quality/security, browser/manual/visual, and scope-fidelity lanes, capture evidence, fix criterion-cited blockers, and obtain confirmed/APPROVE verdicts.
14. Final runtime debugging audit: enumerate at least three plausible user-story failures, run distinguishing real-artifact checks, capture results, and fix confirmed defects through RED→GREEN.
15. Final evidence/cleanup/state: ensure every evidence artifact is durable and redacted, no QA process/port/container/temp resource remains, reconcile all plan checkboxes and Boulder/ledger state, run final global gate at the final revision, obtain HEAVY unconditional approval, mark the goal complete, and report evidence plus commit list (none unless explicitly requested).

## Success criteria + QA scenarios
Tier: HEAVY — the session builds new domain/application/infrastructure/UI modules, a DB schema and private-storage permissions, concurrency/idempotency boundaries, and an external OpenAI integration.

1. Happy path. RED: each applicable behavior’s task evidence captures its named test/scenario failing for the intended missing behavior before production code. GREEN: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` each exit 0. PASS iff complete transcripts exist under `.omo/evidence/final-verification/` and task RED/GREEN transcripts exist.
2. Browser surface. RED: initial Playwright/browser criterion fails for the missing journey/UI behavior before implementation. GREEN/SURFACE: start the documented real local application and run configured Playwright plus Chromium actions: create/reset the labeled demo workspace, enter Korean, English, and mixed goals, interact with canonical-state controls, and observe visible state. PASS iff all expected state changes occur with no uncaught console errors; store command output, action log, screenshots, traces under final verification; close contexts/server and record receipt.
3. AI boundary/adversarial behavior. RED: CandidateDelta schema/reconciler tests reject the unimplemented valid flow or expose missing strict rejection before implementation. GREEN/SURFACE: `pnpm ai:smoke` with live credentials iff configured, otherwise without credentials. PASS iff live returns one schema-valid CandidateDelta only with metadata-only evidence, or absent credentials exit nonzero immediately with a clear non-secret message; deterministic fixtures reject malformed, extra/action-bearing, confirmation, delete, uncited, invented-date, stale, replay, refusal, incomplete, timeout, and prompt-injection cases.
4. Data/security regression. RED: migrations/storage/repository tests fail before schema/adapters exist. GREEN/SURFACE: run Supabase schema/storage/integration verification and demo preflight/reset. PASS iff configured services prove private storage, signed access, constraints, optimistic writes and demo_user isolation; if unavailable, record exact blocker while deterministic schema/policy/fixture checks pass; no public sharing, production auth claim, autonomous sends, hidden live mocks, or sensitive logs.
5. Plan completeness. RED: the unchecked authoritative plan and absent acceptance audit prove missing scope. GREEN: all 15 plan todos plus F1-F4 are implemented/verified in dependency order, with task evidence and targeted/global gates; README/build log contain only observed results; reviewer returns unconditional approval. PASS iff every top-level plan checkbox is checked only after confirmed verification.

WHEN TO STOP: I’ll stop right away when all 15 todos are observably fulfilled; every named scenario has truthful evidence and cleanup receipts; changed-file diagnostics, build, and deterministic tests are green; the live browser surface has passed; unavailable external credentials/services have exact blocker evidence plus validated fail-fast/local alternatives; the notepad is current; and the HEAVY reviewer has approved unconditionally.

Exact final scenarios:
- `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`; PASS iff all commands exit 0 and transcripts exist.
- `pnpm test:integration`, `pnpm test:e2e`, `pnpm demo:preflight`, `pnpm demo:reset`; PASS iff configured service flow exits 0, or missing configuration follows the plan’s named fail-fast expectation with deterministic alternatives green and exact blocker evidence.
- `pnpm ai:smoke`; PASS iff one live GPT-5.6 Responses structured output validates as CandidateDelta when `OPENAI_API_KEY` exists, otherwise exits nonzero before network with the named missing variable and no secret output.
- Playwright/Chromium real-page actions at 375, 768, and 1280 px: navigate `/en` and `/ko`, create unseen Korean/English/mixed goals, exercise create/edit/evidence/conflict/next-action/draft/locale/reset and one failure path; PASS iff expected visible labels/state/citations appear, canonical hash is locale-stable, there is no send/public-share control, and console has no uncaught error.

## Now
Bootstrap: create Boulder/ledger state and register the live atomic plan before implementation delegation.

## Todo
- Create `.omo/boulder.json` and `.omo/start-work/ledger.jsonl` for the selected `lifethread-mvp` plan.
- Register the live atomic plan with exactly one in-progress item.
- Execute Todos 01-15 and F1-F4 per the detailed plan above.
- Reconcile evidence, cleanup, reviewer verdict, Boulder state, and goal status.

## Findings
- Repository initially contains only `README.md`, `docs/`, and `.omo/`; there are no commits and all existing files are untracked, so every pre-existing file is user-owned and must be preserved.
- Exactly one authoritative plan exists: `.omo/plans/lifethread-mvp.md`, 255 lines, with 15 unchecked implementation todos and F1-F4.
- User’s explicit Jay approval satisfies the stale plan implementation gate and removes the plan’s final request to wait for user acceptance; all technical Must/Must-NOT clauses remain authoritative.
- No Boulder state exists at bootstrap.
- Official OpenAI docs fetched 2026-07-15 confirm `gpt-5.6` for new projects and JavaScript `openai.responses.parse` with `text.format: zodTextFormat(schema, name)`; refusals must be handled separately, and local Zod parsing remains required for the deterministic trust boundary.
- Skills used: `omo:ultrawork` for evidence-bound HEAVY execution; `omo:start-work` for Prometheus plan/Boulder/ledger orchestration; `omo:programming` for strict TypeScript/TDD; `omo:frontend` for DESIGN.md/design/performance gates; `omo:visual-qa` for real-browser responsive/CJK dual-oracle evidence; `openai-docs` for current Responses API contracts; `vercel-plugin:nextjs` for App Router boundaries; `vercel-plugin:verification` for the complete browser→API→data→response story; `vercel-plugin:react-best-practices` for post-TSX review. `omo:ulw-plan` is skipped because the repository plan is decision-complete and dependency-ordered.

## Learnings
- Root is an orchestrator under `omo:start-work`: product implementation, tests, and QA must be delegated; root may edit only `.omo/` state, select/decompose/dispatch work, and judge evidence.
- Do not auto-commit: user authorized implementation, not commits. Preserve the exact Conventional Commit subjects as proposed handoff messages.

## Transition — 2026-07-15T16:45:00-04:00
Now: Todo 01 design-system contract prerequisite. A product worker will create the greenfield `DESIGN.md` research log and neutral bilingual application tokens before any hand-authored product component is implemented. Todo 01 scaffold/behavior work remains next.

# LifeThread local vertical-slice verification

Verified on 2026-07-15 against the current workspace state.

## Passing gates

- `pnpm lint`: pass (`lint-final.log`)
- `pnpm typecheck`: pass (`typecheck-final.log`)
- `pnpm test`: 8 files, 29 tests passed (`unit-final.log`)
- `pnpm test:integration`: 1 file, 2 tests passed (`integration-local-final.log`)
- `pnpm build`: pass; `/[locale]` built as a dynamic route (`build-final.log`)
- `pnpm test:e2e`: 6 tests passed across desktop, mobile, and tablet (`e2e-exact-final.log`)
- TypeScript source-policy scan: pass (`typescript-source-scan.log`)
- Two consecutive demo resets produced the same thread ID and version (`reset-1.log`, `reset-2.log`)
- Local demo preflight: pass (`preflight.log`)

The optional plugin-cache AST helper could not resolve its own `typescript` package from its installation directory. Its two failed invocation logs are retained as `typescript-rules.log` and `typescript-rules-bun.log`. The repository's own strict compiler, ESLint, tests, and targeted prohibited-pattern scan all pass.

## Observed browser journey

The Playwright journey creates a mixed Korean/English goal, accepts and edits proposed work, adds/completes/reopens/tombstones/restores a task, records evidence metadata, exposes a confirmed-fact conflict without overwriting the confirmed value, renders the living state and cited unsent draft, and switches EN -> KO -> EN while preserving the canonical thread ID and version. The same journey passes at desktop, phone, and tablet viewports with no captured console errors.

Screenshots are under `.omo/evidence/task-14-demo/screens/`. Direct viewport inspection found no clipped controls or horizontal overflow. The mobile header keeps the private-demo label visible.

## Honest live blockers

- Supabase live integration exits before network access because `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are absent (`integration-live-blocker.log`). The local JSON repository and private filesystem storage adapter are the active working boundary.
- GPT-5.6 live smoke exits before network access because `OPENAI_API_KEY` is absent (`ai-live-blocker.log`). The strict Responses API adapter is implemented; the recorded deterministic analysis adapter drives local tests and is visibly labeled.

## Scope status

Plan Todos 01 and 02 are complete. The repository has materially advanced Todos 03-14 through a working local vertical slice, but their full live-service, file-upload, deletion-lifecycle, and exhaustive per-todo acceptance requirements remain unchecked. No public sharing, production auth, external sending, or public evidence URLs were added.

# LifeThread Three-Minute Demo Plan

Status: planned; demo is not yet runnable

## 13. Three-minute demo

The demo uses one clearly labeled `demo_user` profile and one resettable LifeThread. It is operator-controlled and has no public-sharing surface. Automated fixtures may record model responses for deterministic tests, but the judged demo must label any non-live behavior and must never imply a fixture is a live model call.

### Timed script

| Time | Action | Proof |
| --- | --- | --- |
| 0:00-0:15 | Open English UI; visible “Demo profile / no public sharing” label | Honest identity and privacy boundary |
| 0:15-0:35 | Enter a Korean free-form custom goal not chosen from a category | Arbitrary goal and genuine Korean input |
| 0:35-0:55 | Show English tentative interpretation, milestones, questions, risks, and one next action | Structured multilingual analysis, not chat-only output |
| 0:55-1:15 | Accept one task, edit one, reject one, and add a manual task | Human control and distinct provenance |
| 1:15-1:35 | Add Korean evidence | Original evidence preserved in private storage |
| 1:35-1:58 | Show cited facts, timeline, and completed/pending/waiting/uncertain states | Evidence-backed canonical state |
| 1:58-2:18 | Confirm one fact, then add contradictory/new evidence | Adaptive revision trigger |
| 2:18-2:38 | Show protected confirmed fact, visible conflict, changed open loop, and revised next action | No silent overwrite; plan adaptation |
| 2:38-2:50 | Generate an English follow-up draft | Action-oriented output, no external sending |
| 2:50-3:00 | Switch to Korean and show the same thread/revision/evidence IDs | One canonical record, localized presentation |

Target rehearsal time is at most 170 seconds, leaving ten seconds for UI latency. A Playwright test enforces the sequence and stable IDs; human narration time is rehearsed separately.

## Demo data contract

- `pnpm demo:reset` is idempotent and returns one known thread ID for `demo_user`.
- Reset removes prior derived/demo state and reseeds only clearly synthetic content.
- The prepared evidence contains no real PII, credentials, or third-party confidential data.
- Seeded records use the same repositories, migrations, routes, and UI as ordinary operation.
- A visible limitations panel states: single demo profile, no public sharing, no external sending, production auth deferred.
- The browser must not expose Storage object keys or a permanent public URL.

## Preflight and failure path

Before the live run, `pnpm demo:preflight` verifies required environment variables, Supabase reachability/migrations/private bucket, OpenAI configuration, seed/reset status, both locale dictionaries, and browser viewport. Missing requirements fail with a named remediation and no partial “ready” message.

If a live model call fails, the UI shows a localized retry/review state and preserves the previous canonical revision. The presenter does not switch to an unlabeled cached response. If the demo explicitly runs in recorded mode, a persistent “Recorded AI fixture” label must be visible.

## What the demo proves

- User-defined workflow, not a template picker.
- Korean evidence is analyzed and cited, not merely translated.
- English-speaking judges can understand the complete state.
- AI proposals remain editable and unconfirmed by default.
- Evidence changes the plan and next action.
- Confirmed information survives contradiction until user resolution.
- Locale switching preserves the same canonical record.
- The product is an adaptive state manager, not a generic chatbot/checklist.

## What it does not claim

Production authentication, multi-user isolation, public sharing, background processing, external email/calendar delivery, mobile support, or production-scale reliability.

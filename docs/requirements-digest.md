# LifeThread Requirements Digest

This repository-owned digest is the line-addressable source for the original LifeThread brief.

## Product contract

1. The product accepts any free-form user-defined goal and must not require a category, workflow, industry, or template.
2. The core flow is goal, tentative understanding, adaptive editable plan, evidence, timeline, current state, open loops, and next best action.
3. AI suggestions remain proposed until the user accepts, edits, rejects, reorders, completes, reopens, tombstones, or replaces them.
4. Tasks preserve origin: user-created, AI-suggested, evidence-extracted, or context-inferred.
5. Important derived claims cite original evidence; unknown dates remain unknown; inferred content is labeled.
6. Confirmed user facts cannot be silently overwritten. Contradictions become visible conflicts requiring an explicit user decision.
7. The canonical model includes goal, plan, milestones, tasks, evidence, facts, timeline events, current state, completed items, open loops, deadlines, waiting states, risks, recommendations, communications, corrections, conflicts, and revisions.
8. Plans adapt to new evidence while preserving original evidence, confirmed facts, prior timeline history, corrections, and source references.
9. The application supports Korean, English, and mixed input through one language-neutral schema and one underlying LifeThread.
10. Original evidence is preserved separately from translated or localized content. Locale switching must not duplicate or mutate canonical state.
11. The MVP must show a polished three-minute English-judge demo proving Korean analysis, editable suggestions, evidence citations, adaptive change, confirmed-fact protection, next action, communication draft, and locale switching.
12. The MVP must be honest about mocked, incomplete, deferred, or unsupported behavior and must not autonomously contact external people or organizations.

## Acceptance audit contract

The implementation plan must explicitly audit: arbitrary goals; no required categories; editable AI plans; complete task controls; rejected assumptions; provenance; evidence-driven adaptation; confirmed-fact protection; domain neutrality; four disparate scenarios; traceable conclusions; canonical statuses; mixed-language input; locale switching; no hard-coded UI text; original/localized separation; language-neutral enums; English judge clarity; genuine Korean analysis; hackathon scope; and adaptive behavior rather than a chatbot or fixed checklist.

## Owner decisions

- Persistence: Supabase Postgres and private Supabase Storage.
- Identity: one clearly labeled `demo_user`, no public sharing.
- Timebox: 2-3 hackathon days.

## Source note

This digest is a planning aid, not application behavior. It is intentionally repository-owned so future reviewers can cite stable paths and line numbers without relying on an unavailable chat session.

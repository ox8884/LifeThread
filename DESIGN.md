# LifeThread Action-First Design Contract

## 1. Product intent

LifeThread is a private workspace that turns an open-ended goal into a living plan. A person should understand the page in seconds: what the goal is, what to do now, what happens after completion, and which AI suggestions still need review. The primary flow is action, completion, then an optional update.

## 2. Approved visual direction

The interface uses a warm paper canvas, soft white surfaces, graphite text, and one deep green action color. It should feel calm, editorial, and practical rather than like an analytics dashboard. Hierarchy comes from spacing, type, and surface contrast—not decorative gradients, glass effects, oversized marketing type, floating side rails, or repeated card grids.

## 3. Information architecture

The page follows one document scroll with this fixed reading order:

1. Compact product header with locale navigation and truthful private-demo status.
2. Thread overview with goal, recency, and overall progress.
3. One dominant `Now` action with immediate completion and an optional evidence update.
4. A compact count and preview of AI changes that still need review.
5. The remaining plan as simple ordered rows.
6. Evidence, facts, history, drafts, limitations, and technical metadata under progressive disclosure.

The next action remains above plan details at desktop, tablet, and phone widths. Thread IDs, versions, checksums, confidence values, and source locators never compete with the primary action.

## 4. Tokens

- Canvas: `#f3f0e8`; surface: `#fffdf8`; soft surface: `#f7f3e9`; inset: `#ece7dc`.
- Ink: `#1f2923`; muted ink: `#657068`; quiet ink: `#8a918b`; border: `#d8d4c9`.
- Action: `#174f3b`; hover: `#0f3f2e`; focus: `#4f806d`; action tint: `#e4eee8`.
- Warm review: `#9b6428`; review tint: `#f7ead8`; danger: `#9f443c`; positive: `#247056`.
- Type: Geist Sans for interface text and Geist Mono only inside technical disclosure.
- Radius: 8px controls, 14px primary surfaces, 10px secondary surfaces.
- Spacing: 4px base with generous section separation and compact list rows.
- Shadow: none for normal surfaces; a restrained shadow is allowed only for temporary menus or focused overlays.

## 5. Named primitives and states

- `WorkspaceHeader`: product identity, locale links, and private-demo disclosure.
- `ThreadOverview`: goal, current status, last update, and progress meter.
- `NextActionCard`: `Now` label, one task, one primary `Done` control, help disclosure, and optional quick update.
- `CandidateReview`: proposed tasks, unconfirmed facts, and unresolved conflicts excluding the current action.
- `PlanPanel`: ordered task rows with status and origin; editing, rejection, deletion, restoration, and provenance live in each row's disclosure.
- `ThreadDetails`: native disclosure groups for evidence, facts, conflicts, communication drafts, history, limitations, and technical details.

Required states are empty, active, proposed, completed, blocked, waiting, overdue, rejected, conflicted, tombstoned, stale-version, and recoverable failure. Status is always expressed with text, never color alone.

## 6. Interaction contract

- Selecting `Done` on a proposed task completes it immediately and records that user action as explicit confirmation without changing its original source type.
- Completion refreshes the canonical thread and reveals the next actionable task.
- Adding a note or evidence after completion is optional and uses the existing evidence action.
- AI-created tasks and facts remain visibly proposed or unconfirmed until a person accepts, confirms, rejects, or completes them.
- Locale switching is navigational only and cannot fork or mutate canonical state.
- Communication remains a generated draft with a permanent `Not sent` label; there is no send action.

## 7. Scroll and responsive behavior

The browser document owns vertical scrolling. Panels must not create nested vertical scroll regions and must not use fixed content heights.

- Above 900px: overview and action/review areas use two columns; the primary action receives the wider column.
- 641–900px: every major area becomes one column while preserving the same reading order.
- 640px and below: 12px page gutters, compact header controls, full-width primary action, and 44px minimum touch targets.
- Text wraps naturally in Korean and English; `min-width: 0`, `overflow-wrap: anywhere`, and content-driven heights prevent CJK clipping.

## 8. Accessibility

Use semantic headings, landmarks, forms, labels, buttons, lists, and native `details`/`summary`. Keyboard focus is always visible. Every interactive control has a minimum 44px target. Progress includes readable text in addition to its visual meter. Mutation results use polite live regions and failures remain visible. Motion is functional, brief, and disabled when `prefers-reduced-motion` is set.

## 9. Truthfulness and accepted debt

The experience is persistently labeled as a private local demo using a recorded deterministic AI fixture. It does not imply public sharing, production authentication, collaboration, live autonomous execution, or external message sending. High-stakes information remains subject to operator verification.

Accepted MVP debt: one demo user, one canonical thread, local recorded AI output, no public sharing, and no production-grade file upload pipeline. Those limitations belong in secondary disclosure, not in the primary task flow.

## Research log

- On 2026-07-15 the user approved the action-first option A in the visual companion: one dominant action, immediate completion, optional update, and review-before-apply AI changes.
- The approved reference was implemented as a warm-paper/deep-green operational workspace; generated imagery was intentionally skipped because it would not clarify task, evidence, or state relationships.
- Stable object identity, revision history, citations, and optimistic concurrency from the prior contract remain product requirements, but their technical representation moved behind progressive disclosure.

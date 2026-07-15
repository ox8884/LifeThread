# LifeThread MVP Design Contract

## 1. Product intent

LifeThread is a private, evidence-aware workspace for turning an open-ended goal into a living plan. The interface should feel calm and exact: one canonical thread, one clearly dominant next action, and enough provenance to understand why the state changed.

## 2. Visual direction

Use a warm, paper-like light surface with restrained graphite text and one violet action accent. The visual language combines a minimalist base with Linear-like operational density: compact rows, stable first-class objects, quiet status metadata, and progressive disclosure. It must not imitate a generic analytics dashboard or use decorative gradients, glass effects, oversized marketing type, or card grids without hierarchy.

## 3. Information architecture

- Global rail: product identity, thread navigation, locale switch, privacy and adapter labels.
- Thread header: goal, revision/version, status, and last meaningful change.
- Primary column: current state, adaptive plan, tasks, timeline, evidence, and communication draft.
- Context rail: dominant next action, open loops, deadlines, risks, conflicts, and limitations.
- Mobile: the context rail follows the thread header so the next action remains above supporting history.

Every task, evidence item, revision, and conflict is a stable object in the domain. The UI exposes these objects directly instead of hiding them in transient modals.

## 4. Tokens

- Canvas: `#f4f2ed`; panel: `#fcfbf8`; inset: `#f0eee8`.
- Ink: `#201f22`; muted ink: `#69666f`; borders: `#dedbd4`.
- Action: `#6651c7`; action hover: `#5540b5`; focus ring: `#8d7be0`.
- Positive: `#247358`; warning: `#9b6519`; danger: `#a63d46`; proposed: `#765aa6`.
- Type: Geist Sans for UI and Geist Mono for identifiers, revisions, and source locators.
- Radius: 6px controls, 10px panels. Shadows are reserved for menus and focused overlays.
- Spacing follows a 4px base; desktop rows are intentionally compact while touch targets remain at least 44px.

## 5. Components and states

- Buttons: primary only for the current action; secondary and quiet controls for accept, reject, restore, and expand.
- Badges: status, origin, confirmation, adapter, privacy, and draft/not-sent are text-first and never color-only.
- Task rows: checkbox/status control, title, priority, origin, and optional citation disclosure.
- Evidence rows: ingestion state, checksum fragment, locator, retry state, and source link.
- State sections: explicit empty, loading, failed, retryable, proposed, confirmed, conflicted, tombstoned, and stale-version states.
- Draft composer: selected locale and revision with a permanent “draft · not sent” label and no send control.

## 6. Interaction and accessibility

Keyboard focus is always visible. Native controls are preferred. Status and mutation results use polite live regions; failures remain visible until dismissed or retried. CJK text wraps naturally without fixed-height containers. Motion is limited to short opacity/position transitions and respects reduced-motion preferences. Locale switching is navigational only and never mutates the canonical thread.

## 7. Responsive behavior

- Under 720px: one column, compact rail header, horizontally scrollable tabs only where unavoidable, 16px gutters.
- 720–1099px: one primary column with the next-action panel near the top and a two-column summary grid.
- 1100px and above: 232px navigation rail, flexible content column, 320px context rail; content max-width remains readable.

## 8. Safety and truthfulness

The local deterministic adapter is persistently labeled “Recorded AI fixture · local private demo.” The workspace also states “Private demo · no public sharing” and drafts say “Not sent.” Errors never print goal/evidence content. High-stakes domains show a limitation notice and require the operator to verify important facts.

## Research log

- Lazyweb screenshot MCP was unavailable in this environment; no Lazyweb reference was treated as verified.
- Public reference searches reviewed Linear issue-detail examples and Notion project/task tables on 2026-07-15. Adopted: stable object pages, visible properties/history, compact task rows, restrained hierarchy, and multiple views over the same data. Rejected: dense spreadsheet columns as the default, dark-only styling, and generic team/assignee mechanics outside the single-user MVP.
- Claude was shortlisted for calm language and disclosure patterns, but the product needs stronger state density than a chat-first surface.
- Imagen/image generation was intentionally skipped: LifeThread is an operational workspace with no expressive imagery requirement, and generated artwork would not improve the evidence/state relationships.


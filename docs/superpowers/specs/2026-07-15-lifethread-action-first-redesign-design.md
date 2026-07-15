# LifeThread Action-First Redesign

Date: 2026-07-15
Status: Approved for implementation

## 1. Context

The current LifeThread workspace is functionally complete but exposes its internal model before it explains what the user should do. Revision IDs, adapter labels, source locators, checksums, status counts, and multiple editable subsystems compete with the primary workflow. Desktop users must scan three dense columns, while mobile users see administrative controls and technical identifiers before the next best action.

The redesign changes the workspace from an internal-state dashboard into an action-oriented life-management surface. The first five seconds should answer three questions:

1. What am I trying to accomplish?
2. What should I do now?
3. Where do I report that something changed?

## 2. Approved Product Decisions

- The workspace is centered on one dominant next action.
- Completing the next action is immediate. The UI then presents the next action without forcing the user to add evidence.
- Evidence or an update remains available as an optional follow-up.
- New evidence may produce AI-proposed changes, but those changes are not applied to confirmed state until the user reviews them.
- The adaptive plan appears directly below the next action as a simple ordered sequence.
- Technical provenance remains available through progressive disclosure rather than occupying the default view.
- Korean and English remain views over the same canonical LifeThread.
- The mobile reading order keeps the next action before plan details, history, evidence, and technical metadata.

## 3. Goals and Non-Goals

### Goals

- Make the current next action unmistakable.
- Let users complete work or report a change without learning LifeThread terminology.
- Preserve evidence, provenance, confirmed facts, and revision safety.
- Make AI plan changes understandable and explicitly reviewable.
- Preserve every working vertical-slice behavior while simplifying its presentation.
- Produce a clear three-minute bilingual demo for English-speaking judges.

### Non-Goals

- Adding production authentication, collaboration, public sharing, or external sending.
- Adding a template catalog or scenario-specific workflows.
- Building multi-user or team-management concepts.
- Hiding truthful demo limitations.
- Replacing the domain aggregate or deterministic reconciliation model.

## 4. Information Architecture

### 4.1 Global header

The permanent left rail is removed. A compact top header contains:

- LifeThread identity
- locale switch
- contextual help
- a low-emphasis access point for thread-level actions

Demo, privacy, adapter, and delivery limitations move into a concise disclosure surface. They remain visible enough to be truthful without repeating across the page.

### 4.2 Thread summary

The workspace begins with:

- goal title
- short desired-outcome statement
- human-readable status
- elapsed or last-updated context
- simple completion progress

Internal thread IDs and revision IDs are excluded from the default summary.

### 4.3 Primary action area

The primary action card contains:

- the label `Now` / `지금 할 일`
- one concrete action
- a short explanation of why the action matters
- `Done` / `완료했어요` as the single primary control
- `I need help` / `도움이 필요해요` as a secondary control
- a quiet way to inspect an alternative action
- a compact update field for text or file evidence

Completing the action updates canonical task state immediately and projects the new next action. Evidence is optional and can be added after completion.

### 4.4 Proposed changes

When new evidence generates candidate changes, a secondary panel states how many changes require review and summarizes them in plain language. The user opens one review flow to accept, edit, or reject individual changes.

Candidate changes never look applied before confirmation. Confirmed facts are never silently overwritten.

### 4.5 Adaptive plan

The default plan shows a short ordered sequence:

- completed work
- the current action
- upcoming work

Each row shows one status and one concise provenance description. Editing, deletion, restoration, rejection, and detailed citations move into a contextual menu or expanded row instead of remaining permanently visible.

### 4.6 Secondary information

Open loops, evidence, updates, conflicts, communications, and revision history remain first-class objects but appear after the plan. The default view uses compact summary rows. Each section expands into its full object list.

Technical information such as checksums, source locators, internal IDs, confidence values, and revision identifiers appears only in an explicit `Technical details` disclosure.

### 4.7 Mobile order

Mobile renders in this order:

1. compact global header
2. thread title and progress
3. next action
4. quick update
5. adaptive plan
6. pending AI changes
7. open loops and evidence
8. history, limitations, and technical details

No desktop rail is converted into an oversized mobile header.

## 5. Component Boundaries

### `WorkspaceHeader`

Owns product identity, locale navigation, help, and low-frequency thread actions.

### `ThreadOverview`

Projects the goal, desired outcome, progress, and human-readable recency. It does not render internal IDs.

### `NextActionCard`

Renders the current recommendation and completion/help/alternative controls. It receives a projected next action and exposes semantic form actions without owning domain transitions.

### `QuickUpdateComposer`

Accepts text and supported files, clearly states privacy behavior, and submits evidence for analysis. It does not imply that external sending occurred.

### `CandidateChangeReview`

Displays proposed plan changes and supports accept, edit, or reject decisions. It distinguishes proposed state from canonical state.

### `PlanList`

Renders ordered task rows in completed/current/upcoming groups. Row details contain edit, origin, citation, delete, restore, and exceptional status controls.

### `ThreadDetails`

Owns expandable summaries for open loops, evidence, facts, conflicts, communications, history, limitations, and technical provenance.

## 6. Interaction Flows

### 6.1 Create a LifeThread

The creation screen asks one plain-language question: `What are you trying to get done?` / `무엇을 끝내고 싶으신가요?` It explains that any goal can be entered without a category. Product-internal terms such as fixture, adapter, cited plan, and living thread do not appear in the main call to action.

After submission, LifeThread presents its tentative interpretation, initial plan, and next action. Suggested objects remain labeled as suggestions.

### 6.2 Complete the current action

1. User selects `Done`.
2. The canonical task transition runs immediately.
3. The interface confirms completion in place.
4. The next action replaces the previous action.
5. A non-blocking prompt offers evidence or a short update.

Failure leaves the previous action visible and presents a retryable error without claiming completion.

### 6.3 Add an update or evidence

1. User adds text or a supported file.
2. Original evidence is stored unchanged.
3. Analysis produces a candidate delta.
4. Safe extracted observations are shown with provenance.
5. Plan-changing suggestions enter the proposed-changes panel.
6. User accepts, edits, or rejects each meaningful change.
7. Deterministic reconciliation updates canonical state.

### 6.4 Ask for help

`I need help` expands contextual guidance based on the current action and available evidence. It may explain the action, suggest a smaller step, identify missing information, or provide a draft. It does not create a generic chat-first interface.

### 6.5 Switch locale

Locale navigation changes presentation only. Thread ID, version, task state, evidence, and user confirmations remain unchanged. AI-generated user-facing content follows the selected display language; original evidence remains in its original language.

## 7. Visual System

The approved direction uses a warm paper canvas, soft white working surfaces, deep green action emphasis, restrained warm alerts, and dark green-black text. The design is calm, human, and operational rather than analytical.

- One primary action color is reserved for the current action.
- Panels use borders and subtle tonal separation rather than decorative shadows.
- Status is text-first and never color-only.
- Typography uses a compact but readable hierarchy with natural Korean wrapping.
- Rounded geometry is moderate and consistent.
- Motion is limited to state changes, expansion, and next-action replacement.
- Reduced-motion preferences are respected.

## 8. Error, Empty, and Transitional States

- Missing next action: explain that LifeThread needs an update or plan review and offer one recovery action.
- No tasks: show the interpreted goal and a control to generate or add the first step.
- Evidence processing: preserve the submitted evidence row and show processing state without blocking the workspace.
- Analysis failure: keep evidence stored, explain that planning was not updated, and provide retry.
- Stale version: explain that the thread changed, refresh the projection, and preserve unsent user input.
- Candidate conflict: show both values, source references, and the existing confirmed value.
- Empty history or evidence sections: use concise guidance rather than blank panels.

## 9. Accessibility and Responsive Requirements

- Native buttons, inputs, details, and form semantics remain the default.
- Keyboard focus is always visible.
- The primary action is the first meaningful workspace action in reading and tab order.
- Completion and analysis results use polite live-region announcements.
- Touch targets are at least 44px.
- Korean phrases do not break into orphaned particles or one-character final lines.
- Desktop, tablet, and phone layouts have no horizontal overflow.
- Content remains usable at 200% browser zoom.

## 10. Verification Strategy

Implementation verification must include:

- existing domain, application, integration, and bilingual tests
- targeted tests for immediate completion followed by next-action replacement
- targeted tests proving candidate plan changes remain unapplied before review
- E2E creation, completion, quick-update, change-review, plan editing, and locale-preservation flows
- desktop, tablet, and phone screenshots in Korean and English
- visual review confirming that the next action is above supporting state at every viewport
- CJK wrapping review on every captured Korean screen
- keyboard and visible-focus checks
- lint, strict typecheck, unit tests, integration tests, E2E tests, and production build

## 11. Approved Visual Reference

The approved browser companion mockup is stored locally under `.superpowers/brainstorm/1685-1784154574/content/design-v1.html`. The approved choice was recorded as `approve-design-v1` on 2026-07-15.

The mockup is a design reference, not product code. The implementation must use real components, real domain state, responsive layout, and reusable design tokens.

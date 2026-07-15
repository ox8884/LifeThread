# LifeThread MVP Product Specification

Status: approved planning baseline; not implemented  
Timebox: 2-3 hackathon days  
Demo identity: one clearly labeled `demo_user`; no public sharing

## 1. Understanding of LifeThread

LifeThread is a general-purpose, bilingual life-management application for any ongoing real-world goal. A user describes a goal in free text; the product turns it into an editable, evidence-backed model that explains the current state, preserves what happened, surfaces open loops, and recommends one useful next action.

The product is not a chatbot transcript, workflow catalog, or fixed checklist. Home selling, computer troubleshooting, travel, and an unforeseen custom goal all use the same entities, transitions, UI, and analysis path.

The canonical flow is:

`free-form goal -> tentative understanding -> editable plan -> evidence -> revisioned state -> open loops -> next best action`

## 2. Core user problem

Important life processes are spread across messages, PDFs, screenshots, receipts, notes, websites, conversations, and memory. People lose track of what is confirmed, attempted, waiting, overdue, contradicted, or still missing. Summaries alone do not answer the practical question: “What is true now, and what should I do next?”

LifeThread solves this by maintaining one living state whose important claims remain traceable to original evidence and whose AI suggestions remain visibly tentative until a user acts on them.

## 3. Arbitrary user-defined goals

Creation requires only a non-empty free-form goal. Desired outcome, description, and initial context are optional. No category, industry, template, or scenario discriminator is required.

For any goal, the system may propose:

- a tentative interpretation and desired outcome;
- milestones and tasks;
- the minimum useful clarifying questions;
- evidence worth collecting;
- risks, dependencies, deadlines, and waiting states;
- one initial next best action.

Every proposal is editable. A user can accept, edit, reject, reorder, complete, reopen, tombstone, replace, or supplement proposed work. The system asks a question only when a tentative interpretation cannot provide useful next guidance.

Four acceptance fixtures must traverse identical application services and tables:

1. Selling a home.
2. Troubleshooting a computer.
3. Preparing for a trip.
4. An unanticipated custom goal supplied by the test.

## 4. Proposed MVP

### End-to-end journey

1. Create a LifeThread from a Korean, English, or mixed-language goal.
2. Review the tentative interpretation, milestones, tasks, questions, risks, and next action.
3. Accept one suggestion, edit one, reject one, and add a manual task.
4. Add a text note, image, or PDF to private evidence storage.
5. Review cited facts, timeline events, completed/pending/waiting/uncertain state, open loops, and conflicts.
6. Add a correction or new evidence and observe an explained revision rather than a wholesale replacement.
7. Generate a communication draft in English, Korean, or both.
8. Switch locale and see the same LifeThread IDs, canonical statuses, evidence, and revision.

### Human control

- AI-originated items begin unconfirmed.
- Only an explicit UI action attributed to `demo_user` confirms an item.
- Task “delete” creates a tombstone revision; it does not erase provenance.
- A contradictory model candidate creates a conflict and cannot replace a confirmed fact.
- The application never contacts a person or organization, submits a form, or claims an external action completed.

### State the MVP must show

- Goal and adaptive plan.
- Milestones and fully editable tasks.
- Original evidence and source references.
- Extracted facts and chronological events.
- Current state and completed items.
- Open loops, deadlines, waiting states, risks, and conflicts.
- One next best action and optional alternative.
- Suggested communication.

## Required MVP features

- Arbitrary free-form goal creation with no required category.
- Tentative, editable goal interpretation and plan.
- Task create/edit/tombstone/complete/reopen/reorder/priority controls.
- Immutable origin provenance: `user_created`, `ai_suggested`, `evidence_extracted`, or `context_inferred`.
- Assumption accept/reject/correct actions.
- Text, image, and PDF evidence in private Storage.
- Traceable facts, timeline, open loops, deadlines, waiting states, risks, and conflicts.
- Candidate-delta analysis and deterministic revision reconciliation.
- Confirmed-fact protection, stale-write rejection, and idempotent replay.
- One next best action with rationale, dependencies, citations, confidence, and alternative.
- English/Korean UI and generated prose over one canonical state.
- Mixed-language input and visible fallback to original text.
- One labeled, resettable demo profile and a real-browser demo.
- Honest errors, limitations, and deferred-feature labels.

## Optional stretch goals (not in the 2-3 day build)

- Email/calendar integrations and external notifications.
- Multi-user collaboration or production authentication.
- Public links, export, or sharing.
- Background queues and enhanced OCR.
- Cross-thread search, optional templates, additional languages, mobile clients, and cost-aware model routing.

Stretch work must not begin until all MVP acceptance checks pass and the user explicitly changes scope.

## Major risks and controls

| Risk | MVP control |
| --- | --- |
| Unsupported AI conclusions | Closed schema, mandatory citations, candidate-only writes, visible uncertainty |
| Confirmed facts overwritten | User-only confirmation transition; conflicts and revisions |
| Korean meaning/date/name drift | Verbatim originals, bilingual fixtures, locale-specific prose, visible citations |
| Sensitive data exposure | Private bucket, short-lived signed URLs, log redaction, no public sharing |
| Duplicate or stale processing | Checksums, idempotency keys, aggregate versions, optimistic concurrency |
| Demo latency or nondeterminism | Seed/reset command, rehearsed input, visible failure state; no hidden simulation |
| Scenario hard-coding | Four-domain parameterized tests through identical services and schema |
| Scope expansion | Explicit Must-NOT-Have list and 2-3 day dependency spine |
| High-stakes overreach | Uncertainty language, question drafting, professional follow-up, no autonomous action |

## Product success

The MVP succeeds when an English-speaking judge can watch a Korean free-form goal become a cited, editable plan; see new Korean evidence revise the living state without overwriting a confirmed fact; receive one useful English next action or draft; and switch the same record to Korean within three minutes.

Implementation is not authorized by this document. The executable work plan remains approval-gated in `.omo/plans/lifethread-mvp.md`.

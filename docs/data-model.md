# LifeThread Canonical Data Model

Status: decision-complete logical model; physical migration is not yet implemented

## 6. Domain-agnostic data model

Every scenario uses one `LifeThread` aggregate. Domain meaning lives in user content, canonical types, provenance, and source references; there is no workflow/category discriminator.

### Core records

| Record | Required purpose and fields |
| --- | --- |
| `LifeThread` | `id`, `demo_user_id`, `title`, `goal_text`, `desired_outcome?`, `description?`, `interpretation?`, `goal_confirmed`, `version`, timestamps |
| `Milestone` | `id`, `thread_id`, content, status, position, provenance fields, confirmation fields, `deleted_at?` |
| `Task` | `id`, `thread_id`, `milestone_id?`, content, status, priority, position, provenance fields, confirmation fields, `deleted_at?` |
| `EvidenceItem` | `id`, `thread_id`, kind, private object key or verbatim note, checksum, media type, size, original filename, source language, capture date?, ingestion state, timestamps, deletion tombstone |
| `SourceReference` | `id`, `evidence_id`, locator kind, page/region/span payload, quoted hash or anchor, created timestamp |
| `Fact` | `id`, `thread_id`, content, fact type, status, confidence, directly-stated flag, provenance, confirmation, relevant date?, source references |
| `TimelineEvent` | `id`, `thread_id`, description, event type, occurred-at/precision nullable, status, confidence, provenance, source references |
| `OpenLoop` | `id`, `thread_id`, content, loop type, status, priority, owner/external party?, follow-up date?, provenance, sources |
| `Deadline` | `id`, `thread_id`, description, due-at, status, related entity, confidence, confirmed, sources |
| `WaitingState` | `id`, `thread_id`, content, waiting-on, started-at?, follow-up-at?, stale-after?, status, sources |
| `Risk` | `id`, `thread_id`, content, severity, likelihood/confidence, status, rationale, sources |
| `Conflict` | `id`, `thread_id`, existing entity/value, candidate value, reason, candidate sources, status, resolution actor/time, resulting revision |
| `Recommendation` | `id`, `thread_id`, action, rationale, dependencies, confidence, confirmation requirement, alternative?, sources, revision id |
| `SuggestedCommunication` | `id`, `thread_id`, kind, locale, content, revision id, generator version, source/relevant entity links |
| `LocalizedContent` | entity/field, revision id, locale, content, source locale, translation status, generator version |
| `AnalysisRun` | `id`, `thread_id`, input revision, schema/prompt/model version, idempotency key, outcome/error category, timestamps |
| `ThreadRevision` | `id`, `thread_id`, monotonically increasing version, actor/source, command, change summary, previous version, timestamp |
| `UserCorrection` | target entity/field, old/new value, reason?, actor, supporting sources?, revision id |

### Shared derived-item fields

All AI-derived or evidence-derived items carry:

- stable `id` and `thread_id`;
- canonical type and status;
- `source_type`;
- `confidence` when meaningful;
- `user_confirmed`, `confirmed_by?`, `confirmed_at?`;
- `derivation = direct | inferred`;
- `source_reference_ids` (required for important direct claims);
- `inference_reason?`;
- `source_language?`;
- `analysis_run_id?` and `revision_id`;
- created/updated timestamps and optional tombstone.

## 7. Task provenance model

| `source_type` | Initial confirmation | Meaning |
| --- | --- | --- |
| `user_created` | true | Explicitly entered through a human UI action |
| `ai_suggested` | false | Proposed from goal/current-state analysis |
| `evidence_extracted` | false | Directly extracted from cited original evidence |
| `context_inferred` | false | Inferred across context rather than directly stated |

Accepting a suggestion changes confirmation fields, never historical `source_type`. Editing creates a new revision. User-visible deletion sets `deleted_at` and records an actor/revision; it never physically removes the task, origin, or citations.

Compact badges identify origin and confirmation in list views; full source/confidence/reason detail appears on demand.

## Canonical statuses

`proposed`, `pending`, `in_progress`, `waiting`, `blocked`, `completed`, `rejected`, `uncertain`, `overdue`, `cancelled`

Status labels are localized at presentation. Completion requires explicit user action or sufficiently cited direct evidence accepted by deterministic policy; a suggestion alone cannot complete anything.

Allowed task transitions:

```text
proposed -> pending | rejected
pending -> in_progress | waiting | blocked | completed | cancelled
in_progress -> waiting | blocked | completed | cancelled
waiting -> in_progress | blocked | completed | overdue | cancelled
blocked -> in_progress | waiting | completed | cancelled
completed -> in_progress
overdue -> in_progress | waiting | blocked | completed | cancelled
```

Invalid transitions fail with no revision. Tombstoning is orthogonal and reversible by a new user revision.

## 8. Adaptive planning and revisions

The initial plan is revision 1, not a permanent checklist. New evidence or corrections produce a candidate delta against an explicit input version. Reconciliation may:

- propose/add/tombstone/reorder tasks or milestones;
- propose status, priority, deadline, waiting-state, risk, or next-action changes;
- add facts, events, open loops, or conflicts;
- retire irrelevant unconfirmed suggestions;
- explain every meaningful change.

Reconciliation cannot confirm an item, overwrite a confirmed value, erase history, invent an unknown date, or apply a source reference that does not resolve to the same thread.

Atomic persistence writes accepted changes, conflicts, a revision, and updated projections in one transaction. An expected-version mismatch returns `stale_version`; identical analysis-run idempotency keys produce no second revision.

### CandidateDelta v1 deterministic contract

The closed contract is `lifethread.candidate_delta.v1`. Existing records are addressed by ID. New records use `sha256(entity_type + parent_id + normalized_content + normalized_date_or_null)`; normalization is Unicode normalization, trim, case-folded identifiers, and stable date precision. Per-operation preconditions include base revision, optional entity version, semantic key, and expected status. Effects are limited to the declared operation union and are always proposed until an explicit user command accepts them.

The reconciler rejects unknown operations, checks citations and semantics, resolves identity, protects confirmed facts, collapses exact replay and same-key duplicates, creates conflicts for overlapping contradictory operations, and writes one atomic revision. A semantic-key match to a confirmed fact creates a conflict even without an entity ID. Stale versions and failed preconditions produce no mutation.

## Evidence and source locators

- Text notes: UTF-8 character start/end plus hash of cited text.
- PDFs: page number plus optional bounding box/text-span hash.
- Images/screenshots: full image or normalized bounding box plus optional OCR-text hash.
- Files without a stable fine locator: evidence-level reference with an explicit “whole document/image” locator.

Unknown or approximate dates store `null` or an explicit precision (`day`, `month`, `year`, `approximate`); a model must never synthesize a precise timestamp.

## Confirmed-fact protection

No AI operation can set `user_confirmed`, `confirmed_by`, or `confirmed_at`. If a candidate disagrees with a confirmed field, it creates `Conflict` with both values and citations. Canonical state stays unchanged until `demo_user` explicitly resolves the conflict; resolution creates a correction and revision.

Claims requiring citations are facts, dates, statuses, deadlines, waiting states, risks, recommendations, completion claims, and anything shown as current state or generated communication. An uncited claim is rejected or shown only as an explicitly uncertain question. Goal input is limited to 2,000 UTF-8 characters after normalization; empty or over-limit input creates no thread. Task and milestone removal is a provenance-preserving tombstone and can be restored only by an explicit user command.

Evidence deletion uses `requested`, `deleting`, `deleted`, and `failed_retryable`. Derived translations, summaries, caches, searchable rows, and private Storage objects are removed in recorded order; partial failure records the failed step and supports safe retry. `deleted` means no original or derived content remains, while a content-free audit tombstone remains.

## Domain-agnostic proof matrix

| Scenario | Same model mapping |
| --- | --- |
| Home sale | documents as evidence; shipment as event/task; receipt as waiting state; closing as deadline |
| Computer troubleshooting | screenshots/logs as evidence; attempts as events/tasks; unresolved error as open loop; diagnostic as next action |
| Travel | bookings as evidence/facts; itinerary as milestones; passport gap as open loop; departure as deadline |
| Unanticipated goal | free text supplies semantics; identical generic entities/transitions accept evidence and recommendations |

No row permits a scenario-specific table, enum, prompt route, or required category.

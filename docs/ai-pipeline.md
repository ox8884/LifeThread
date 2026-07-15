# LifeThread AI and Reconciliation Pipeline

Status: planned contract; no API integration exists yet

## 9. Evidence and source-reference approach

Original evidence is persisted before analysis and is immutable through normal application paths. Each evidence item stores its private object key or verbatim note, checksum, media metadata, original filename, source language, user-supplied date if any, and ingestion state.

Every important direct claim requires one or more resolving `SourceReference` locators. Inferences without direct evidence must use `derivation = inferred`, provide an `inference_reason`, and never masquerade as cited fact. Unknown dates stay unknown.

Source references always resolve to original evidence, never to a translation or AI summary. Deleting sensitive evidence through the explicit privacy flow removes originals and all derived translations/summaries/caches; a content-free tombstone may retain when/why deletion occurred.

## 11. Language-aware AI processing pipeline

1. Validate input, media type/size, actor, thread, and expected thread version.
2. Persist the original note/object and checksum in private storage.
3. Detect probable source language as metadata; never override selected display locale.
4. Assemble minimum necessary context: current canonical revision, confirmed facts, unresolved conflicts/open loops, selected evidence, and display locale.
5. Call GPT-5.6 through the Responses API with `store: false`, a versioned prompt, and strict Structured Outputs.
6. Parse a versioned `CandidateDelta` with Zod; handle refusal/incomplete/timeout separately.
7. Validate semantics and provenance: allowed operations, canonical enums, confidence bounds, dates, same-thread IDs, resolving citations, and no confirmation fields.
8. Apply confirmed-fact and prompt-injection guards. Evidence content is untrusted data and cannot change system policy or operation permissions.
9. Check analysis idempotency and expected aggregate version.
10. Reconcile deterministically and atomically persist accepted proposals, conflicts, the analysis outcome, and one new revision.
11. Generate/store localized presentation keyed to the resulting revision and locale.
12. Return an explanation of accepted, rejected, conflicted, and unchanged items.

Structured output constrains shape, not truth. Factual support, permissions, transitions, and mutation policy remain application responsibilities.

## CandidateDelta contract

The root is closed (`additionalProperties: false`) and includes:

- `schema_version`, `thread_id`, `input_revision`, `analysis_reason`;
- `operations[]` with stable candidate IDs;
- `current_state_summary`, `next_best_action`, optional alternative;
- `change_explanation`;
- detected source languages and requested output locale.

Allowed operation kinds are exactly this closed union, with no aliases: `create_task`, `update_task`, `tombstone_task`, `reorder_task`, `create_milestone`, `update_milestone`, `tombstone_milestone`, `propose_fact`, `propose_timeline_event`, `propose_open_loop`, `propose_waiting_state`, `propose_deadline`, `propose_risk`, `raise_conflict`, `propose_recommendation`, and `propose_communication`.

Each operation has one deterministic effect: `create_*` inserts a proposed entity only if its semantic key is new; `update_*` changes only listed unconfirmed fields when expected version matches; `tombstone_*` hides the entity and writes a provenance-preserving tombstone; `reorder_task` changes only explicit sibling order; `propose_*` creates or updates an unconfirmed derived item with citations; and `raise_conflict` creates a visible conflict without changing either canonical value. No operation can imply acceptance, completion, confirmation, physical deletion, or external sending.

Model operations cannot confirm, physically delete, mutate evidence bytes, change actor/ownership, write arbitrary fields, resolve a conflict, or overwrite a confirmed value.

Each operation declares target/new stable ID, canonical fields, derivation, confidence, evidence references, inference reason when needed, and expected prior value/version for an update.

### Normative v1 identity and precedence rules

`CandidateDelta` is a closed object with `schema_version: "lifethread.candidate_delta.v1"`, `thread_id`, `base_revision_id`, `analysis_run_id`, and `operations`. Unknown operation names, fields, entity types, statuses, or enum values are rejected. Existing entities use `entity_id`; new entities use `semantic_key = sha256(entity_type + parent_id + normalized_content + normalized_date_or_null)`. Normalization trims whitespace, applies Unicode normalization, case-folds identifiers, and preserves original text separately.

Every operation declares a precondition and effect. The reconciler applies schema, base revision, identity, source-reference, semantic, confirmed-fact, duplicate/overlap, and atomic-write checks in exactly that order. Exact `operation_id` replay returns the prior result. Same semantic keys collapse to the first operation. Conflicting operations on one entity create a `Conflict`, never last-write-wins. A semantic-key collision with a confirmed fact is a conflict even when the candidate omits the confirmed fact ID.

Create and update operations are proposals until an explicit `demo_user` command accepts them. The model cannot confirm, resolve conflicts, physically delete, or perform external actions. `tombstone` is the only removal operation and retains stable ID, origin, citations, revision, actor, and deletion time in a content-free audit record. A stale base version or failed precondition performs no canonical write.

## 8. Adaptive reconciliation

Validation order is fixed:

1. JSON/schema validity.
2. Semantic values and bounds.
3. Provenance/source-reference resolution.
4. Confirmed-fact protection and operation authorization.
5. Analysis idempotency and optimistic version check.
6. Duplicate/overlap detection.
7. Deterministic effect calculation: first exact replay result, then first semantic-key operation, then conflict for contradictory same-entity effects; accepted changes remain proposed until a user command.
8. Atomic revision persistence.

Malformed, uncited, cross-thread, invented-date, unauthorized, duplicate, stale, timed-out, refused, or incomplete candidates produce no canonical mutation. The `AnalysisRun` records a safe error category for user-visible retry/review.

Replaying the same evidence/checksum, input revision, schema/prompt version, and analysis reason yields the same idempotency key and at most one revision.

## 12. Preserving user-confirmed facts

The model has no transition capable of producing confirmation. Only an explicit UI command attributed to `demo_user` can confirm or resolve.

When new evidence contradicts a confirmed value:

- the original canonical value remains;
- both old and new evidence stay visible;
- a `Conflict` stores the candidate, reason, and citations;
- the next action may ask the user to resolve it;
- resolution creates a `UserCorrection` and revision.

A stale browser action or analysis run fails with `stale_version`. It never performs a last-write-wins merge.

## Initial goal analysis

The goal analyzer receives free text, optional desired outcome/description/context, and display locale. It returns tentative interpretation, milestones, tasks, minimal clarifying questions, useful evidence, risks/dependencies/deadlines, and one next action. All AI-originated structures are `proposed` and unconfirmed.

The prompt and schema contain no scenario catalog and no branching on home/travel/computer labels. Four-domain contract tests assert identical operation shapes and application services.

## Generated communication

Communication uses the selected revision and citations to draft an email, text, phone script, follow-up note, checklist, or questions in English, Korean, or both. It is a draft only: the MVP has no send action. Drafts preserve names, organizations, identifiers, filenames, error codes, and tracking numbers.

## Failure behavior

| Failure | Observable result | Canonical mutation |
| --- | --- | --- |
| Missing credentials | Preflight names missing variable before live call | None |
| Refusal/incomplete/timeout | Localized retry/review message; analysis outcome recorded | None |
| Invalid schema/enum/confidence | Localized validation failure category | None |
| Missing/cross-thread citation | Candidate rejected with provenance reason | None |
| Contradicts confirmed fact | Visible conflict | Conflict + revision only; fact unchanged |
| Stale input version | Refresh/retry instruction | None |
| Duplicate analysis | Existing result returned | No new revision |

## Privacy and safety

- Send only selected evidence and minimum current state.
- Use `store: false`; disclose that this does not by itself eliminate all provider retention categories.
- Delete temporary provider file objects after processing when used.
- Never log raw prompts, evidence, full model output, credentials, or personal data.
- Treat evidence instructions as untrusted content.
- For medical/legal/financial contexts, organize facts and questions, express uncertainty, recommend qualified follow-up, and avoid professional claims or autonomous action.

Evidence deletion is an idempotent state machine: `requested -> deleting -> deleted` or `deleting -> failed_retryable`. The ordered steps are mark state, remove derived localized content/caches, remove private Storage objects, remove searchable derived rows, and write a content-free tombstone. A retry resumes at the first incomplete step; repeated requests are safe and `deleted` is never claimed after a partial failure.

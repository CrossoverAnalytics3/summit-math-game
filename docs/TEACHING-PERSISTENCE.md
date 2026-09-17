# Teaching evidence persistence

Teach the Climb saves its journal to SQLite on the local Summit server. The browser retains a local copy for offline play. Another browser connected to the **same running server** can read its saved evidence. This is one demonstration workspace for the existing synthetic learner `L-1`, not an authenticated account or a deployed cross-device learner service. Separate servers and separate database files do not share records.

## API contract

| Route                        | Contract                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `GET /api/teaching/journal`  | Returns `{ revision, journal }`. A new workspace returns revision `0` and journal `null`. |
| `PUT /api/teaching/journal`  | Accepts `{ revision, journal }` and returns the canonical saved snapshot.                 |
| `GET /api/teaching/runs/:id` | Returns `{ run }` for an observed attempt, or `404`.                                      |
| `GET /api/teaching/brief`    | Returns the revision, evidence summary counts, canonical runs and interpretations.        |

A changed write against an old revision returns **409**, including the current server snapshot. The client must let the adult review the conflict; it must not silently overwrite either copy. Retrying the exact saved payload is idempotent and does not increment the revision or duplicate attempts.

## Boundaries that preserve useful evidence

- `shared/journal.ts` defines and validates the same bounded contract for browser restoration and server writes. A workspace accepts up to 200 runs and 200 interpretations. It rejects missing references, duplicate identifiers, invalid instructions, unknown fields and unsupported statuses.
- The server rebuilds every run's context, shares, replay steps and outcome with `createRun`. A submitted result or completion claim cannot determine the mathematical result.
- Previously saved run instructions, predictions, support labels, dates and ordering cannot be replaced or deleted. New attempts are appended. Notes are editable context. System corrections add a flag and explanation alongside the original replay.
- Interpretations retain their original wording, evidence references and question dependencies. The engine requires two distinct eligible observations before a proposed interpretation can be active. Legacy single-observation interpretations become **insufficient evidence**.
- Corrections withdraw dependent questions, including indirect dependencies. A system correction can identify one affected run instead of incorrectly excluding every run in the comparison. Withdrawn questions and existing corrections cannot be silently reactivated or rewritten.
- Mathematical support and predictions are still **client-recorded observations**, not proof of supervision, identity or learning gains. Server recomputation protects mathematical consistency; it does not turn a local demo into a verified assessment service.

The database has separate `teaching_journals`, `teaching_runs` and `teaching_interpretations` tables. State and evidence changes commit in one SQLite transaction. The existing explicit demo reset clears all three tables. No new account, hosted database, authentication flow or AI data-sharing permission is implied by saving a journal.

The dedicated journal JSON limit is 2 MB so bounded replay histories fit; other API requests retain their 16 KB limit. Notes and correction text are not sent to the model by the teaching-coach endpoint.

## Completed worksheet evidence

Version 0.5.3 adds a separate record stream for **Fix Pip's homework**. These records are stored in `homework_sets`; they are not teaching runs, interpretations or changes to the journal revision. `GET /api/teaching/brief` remains climb-only. The browser tutor brief reads both streams and preserves their labels.

| Route                           | Contract                                                                                                                                                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/homework`            | Creates the three worked examples for a selected skill. An optional preferred authored slip is honored when it fits the generated numbers. It does not read or match session notes.                                                                             |
| `POST /api/homework/:id/answer` | Accepts the selected card index, reason and corrected answer. The server checks them, saves the original response and completion timestamp, and returns the checked result. Repeated submission returns the original saved result.                              |
| `GET /api/homework/evidence`    | Read-only `{ worksheets, total, limit }` for submitted worksheets in this local workspace. At most 100 records, ordered by creation time descending; `total` reports all submitted worksheets. Unsubmitted keys and solutions are never returned by this route. |

`shared/homeworkEvidence.ts` defines the read contract. Each record includes the worksheet ID, skill, level, original prompts and Pip's steps, available reason choices, exact submitted choices, completion time and separate `spotted`, `explained` and `fixed` checks. The slip and correct answer are disclosed only after submission. Earlier stored results without submitted choices or completion time return `null` for those fields; the UI identifies that missing evidence instead of guessing it.

The three checks describe a worked-example task. `explained` is a historical field name for matching a provided reason, not a scored free-form explanation. Naming and fixing require the slipped card to be selected. The task does not advance or reset independent trail progression, and its records cannot satisfy the two-climb-observation interpretation floor. Pip's steps and reason choices were visible; additional assistance was not recorded.

The GET response uses `Cache-Control: no-store`, and the browser makes a fresh request when the journal opens. Errors have an explicit retry state. Worksheets do not enter the offline teaching cache or the climb-journal export; **Export worksheets** downloads the displayed records with the full count and view limit. The explicit demo reset deletes unfinished and completed worksheets along with the teaching tables and events.

The endpoint is bound to the same synthetic learner `L-1` as the rest of this local demo. It adds no authentication or remote tutor access. Answer replay safety prevents a second submission from changing the original response; it is not an identity or supervision guarantee. Worksheet generation and checking do not call a model.

## Verification

The route tests exercise canonical recomputation, append-only observations, targeted corrections, the two-observation floor, conflict handling, duplicate retries, invalid references, bounded requests, explicit reset, and reopening saved records through a new database connection and module instance. These checks establish storage behavior and integrity rules, not educational efficacy.

Worksheet evidence tests cover completed-only disclosure, exact submitted selections and displayed work, learner scoping, submission replay, missing legacy fields, the 100-record view and reset. Browser-model tests keep the three counts and source links separate, prevent duplicate IDs from inflating counts, request fresh data and distinguish an error from an empty result. [Proposed learning evaluation](PRODUCT-GUIDE.md#worksheet-evaluation) distinguishes recognition in this supported activity from unaided explanation and correction.

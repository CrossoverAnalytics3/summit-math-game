# Local Summit server

Use Node 24 or later. The server uses Node's bundled SQLite driver, so it does not need a separately compiled database addon.

The default port is **3001**, bound to **127.0.0.1**. The optional `SUMMIT_HOST` setting can change the binding, but the unauthenticated demo is not ready for public exposure. Development uses the Vite browser on **5174**, which forwards `/api` to this server. When `web/dist/index.html` exists at startup, the server also serves the complete built game on port 3001. An explicit `PORT` setting takes precedence.

The project-root `.env` is loaded before configuration is read. `SUMMIT_ENV_FILE` can point to an existing private environment file elsewhere. Environment variables already set in the process take precedence. Never bundle that private file into a shared copy. Tests skip environment-file loading; the offline evaluation uses only explicit test adapters.

## Assessment contract

- `POST /api/round` with `{ "skill_id": "add20" }` returns a `round_id`, `level`, and seven distinct problems at that level with opaque `id` values. It does not return solutions or generator seeds. New trails start with `hearts_total: 3`, `hearts_remaining: 3`, `bonus_seconds: 120`, and a server-generated `bonus_deadline_at` in epoch milliseconds. `server_now` uses the same units.
- `POST /api/answer` with `{ "problem_id": "…", "answer": 7 }` checks the stored problem. It returns `correct` (a boolean), `expected_answer`, `used_hint`, `level`, `run`, and `unlocked`, plus current `hearts_remaining`, `answered`, `total`, `score`, `bonus_points`, `bonus_deadline_at`, `server_now`, `round_ended`, and `ended_reason`. Each first incorrect assessment consumes one heart. Only the first submission is assessed; repeated submissions return that exact original snapshot without consuming another heart or awarding progress again.
- `POST /api/hint` with `{ "problem_id": "…" }` records hint use before waiting for a provider. The client cannot change that status. Hints do not consume hearts. An answered problem, or an unassessed problem in an ended round, returns HTTP 409 instead of issuing more help.
- `POST /api/round/finish` with `{ "round_id": "…" }` requires either every problem to be assessed or the three hearts to be exhausted. It returns `score`, `base_score`, `bonus_points`, `correct` (a count), `answered`, `total`, `won`, `seconds`, `level`, `hearts_total`, `hearts_remaining`, and `ended_reason`. `total` remains the original problem count even when the trail ends early. Score, success, timing, and heart state come from stored server data. Repeated completion requests return the exact original result.
- `GET /api/round/:id` restores a round without changing it. It returns the original public problems, current round counters, `assessments` for already answered problems, `hinted_problem_ids` including unanswered hinted problems, and `result` (the saved finish response, or `null`). `level` is the round's original difficulty; `current_level` and `run` are the learner's current progress. Public problems never include solutions; original assessment responses reveal expected answers only for already assessed items. This endpoint is useful after reload or a lost answer/finish response.
- `POST /api/story` accepts a skill and a theme (`animals`, `space`, `ocean`, or `dinosaurs`). It returns a one-problem round using the same answer and finish endpoints, plus content provenance. Stories remain untimed and heart-free: heart, bonus-duration, and deadline fields are `null`; their assessment and finish responses set `bonus_points` to zero.
- `POST /api/settings/ai-consent` with `{ "enabled": true }` updates the synthetic demo profile. `/api/home` exposes a top-level boolean `guardian_consent_ai`. The profile starts with optional AI off. All live AI routes, including hints and parent guidance, use this setting; authored templates remain available when off.

Correct independent answers earn 100 points; correct answers after a hint earn 60. A new seven-question trail earns a single **50-point completion bonus** when all seven items are assessed with at least one heart remaining **strictly before** the 120-second deadline. Hinted work and up to two wrong answers can still earn that completion bonus. At exactly 120 seconds there is no bonus. The timestamp of the final assessment decides eligibility, so a slow or retried Finish request cannot remove an earned bonus.

The timer is a bonus window only. Expiry never consumes a heart, rejects an answer, or ends play. The third wrong answer closes the trail with `ended_reason: "hearts"`; other unassessed answers and hints then return HTTP 409. Prior assessed requests can still replay their original results. Finishing all items with hearts remaining returns `ended_reason: "completed"`. A third wrong answer on item seven still counts as a hearts ending and earns no bonus.

A completed round succeeds with at least 70% correct, rounded up; a hearts ending is not a win. Three consecutive independent answers at the learner's current difficulty unlock the next game level. Easier problems remaining in an existing round do not count toward unlocking another level. Losing hearts never removes unlocked levels, existing high scores, or saved history. The separate, explicitly optional comeback policy is unchanged. These game rules are not validated measures of lasting mastery.

`seconds` means wall-clock time from round creation to its terminal assessment, capped at one hour. It can include time away from the page or waiting for a hint. It is not a measure of attention or active learning time. Weekly arithmetic counts use actual event timestamps; the demo calendar controls comeback scenarios separately.

## Saved rounds and recovery

The schema upgrade adds nullable `rules` and `ended_at` columns without deleting saved work. Only newly started standard trails receive the new rules. Existing rounds retain their original untimed, heart-free behavior, including seven-item rounds. Already completed results and assessment snapshots replay exactly as stored; old snapshots may lack the new fields. Use the round snapshot for current counters instead of treating a replayed answer's old counters as live state.

The browser can persist a round ID, retrieve its snapshot, and retry Finish when `round_ended` is true but `result` is still `null`. Unanswered problems in exhausted rounds remain unassessed. Start requests are not idempotent; retrying a lost start response can leave an unused round, which awards no progress. All assessment, closure, and finish writes are transactional. The API never accepts client heart counts, elapsed times, bonus eligibility, or scores.

## Scope and verification

This is a **single-learner local demo**. It has no accounts, guardian identity verification, authorization boundary, or production rate limiting. Administrative demo endpoints are unauthenticated. Hosting the built browser on the same port does not make the demo a production service.

The provider has an implemented eight-second timeout (the elapsed timeout/abort is not directly tested) and falls back to authored content when it fails or automated checks reject its output. The checks constrain numbers and format; they do not prove semantic accuracy, child appropriateness, or learning impact. Learner names are not included in model prompts. Numeric parent counts come from stored game events.

Run `npm test -w server` for the API, privacy, progression, and arithmetic tests. Run `npm run eval -w server` for a repeatable offline evaluation of generated arithmetic and content fallback behavior. Neither command makes live model calls.

## What measurement exists

The `events` table stores an event ID, real UTC timestamp, name, learner ID, optional case ID, and JSON payload. Current event names are `round_started`, `answer`, `level_unlocked`, `round_finished`, `comeback_applied`, `story_generated`, `hint_requested`, and `guardian_consent_changed`. The parent summary derives seven-day answer/correct/hint counts, round counts, and unlock events from this log. Current game levels come from the progress table.

Round/problem tables retain generated arithmetic, the first assessment result, and recorded hint state. An answer's numeric submitted value is used to assess correctness but is not separately retained in the event payload. Events are local demo records; there is no external analytics collector or cross-device synchronization.

Fraction evidence is separate, in browser storage: per-item ID/type, correctness, assistance, and attempt count, inside a completed session with its ID and completion timestamp. The browser also stores an unfinished session for resume. This is not a server-side fraction telemetry feed.

The prototype has no research-study enrollment, pre/post outcome protocol, delayed retention test, experiment assignment, measured learning-gain estimate, or active-attention timer. Any future outcome/retention dashboard or experiment should be described as proposed work rather than existing measurement.

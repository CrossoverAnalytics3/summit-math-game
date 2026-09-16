# Local Summit server

Use Node 24 or later. The server uses Node's bundled SQLite driver, so it does not need a separately compiled database addon.

The default port is **3001**, bound to **127.0.0.1**. The optional `SUMMIT_HOST` setting can change the binding, but the unauthenticated demo is not ready for public exposure. Development uses the Vite browser on **5174**, which forwards `/api` to this server. When `web/dist/index.html` exists at startup, the server also serves the complete built game on port 3001. An explicit `PORT` setting takes precedence.

The project-root `.env` is loaded before configuration is read. `SUMMIT_ENV_FILE` can point to an existing private environment file elsewhere. Environment variables already set in the process take precedence. Never bundle that private file into a shared copy. Tests skip environment-file loading; the offline evaluation uses only explicit test adapters.

## Assessment contract

- `POST /api/round` with `{ "skill_id": "add20" }` returns a `round_id`, `level`, and seven distinct problems at the requested level with opaque `id` values. It does not return solutions or generator seeds.
- `POST /api/answer` with `{ "problem_id": "…", "answer": 7 }` checks the stored problem. It returns `correct`, `expected_answer`, `used_hint`, `level`, `run`, and `unlocked`. Only the first submission is assessed; repeated submissions return that original result without awarding progress again.
- `POST /api/hint` with `{ "problem_id": "…" }` records hint use before waiting for a provider. The client cannot change that status. Answered problems cannot request another hint.
- `POST /api/round/finish` with `{ "round_id": "…" }` requires an answer to every problem. Score, success, and elapsed time are computed by the server. Repeated completion requests return the original result.
- `POST /api/story` accepts a skill and a theme (`animals`, `space`, `ocean`, or `dinosaurs`). It returns a one-problem round that uses the same answer and finish endpoints, plus content provenance.
- `POST /api/settings/ai-consent` with `{ "enabled": true }` updates the synthetic demo profile. `/api/home` exposes a top-level boolean `guardian_consent_ai`. The profile starts with optional AI off. All live AI routes, including hints and parent guidance, use this setting; authored templates remain available when off.

Correct independent answers earn 100 points; correct answers after a hint earn 60. A round succeeds with at least 70% correct, rounded up. Three consecutive independent answers at the learner's current difficulty unlock the next game level. Easier problems remaining in an existing round do not count toward unlocking another level. This progression rule is not a validated measure of lasting mastery.

`seconds` means wall-clock time from round creation until completion, capped at one hour. It can include time spent away from the page. It is not a measure of attention or active learning time. Weekly arithmetic counts use actual event timestamps; the demo calendar controls comeback scenarios separately.

## Scope and verification

This is a **single-learner local demo**. It has no accounts, guardian identity verification, authorization boundary, or production rate limiting. Administrative demo endpoints are unauthenticated. Hosting the built browser on the same port does not make the demo a production service.

The provider has an implemented eight-second timeout (the elapsed timeout/abort is not directly tested) and falls back to authored content when it fails or automated checks reject its output. The checks constrain numbers and format; they do not prove semantic accuracy, child appropriateness, or learning impact. Learner names are not included in model prompts. Numeric parent counts come from stored game events.

Run `npm test -w server` for the API, privacy, progression, and arithmetic tests. Run `npm run eval -w server` for a repeatable offline evaluation of generated arithmetic and content fallback behavior. Neither command makes live model calls.

## What measurement exists

The `events` table stores an event ID, real UTC timestamp, name, learner ID, optional case ID, and JSON payload. Current event names are `round_started`, `answer`, `level_unlocked`, `round_finished`, `comeback_applied`, `story_generated`, `hint_requested`, and `guardian_consent_changed`. The parent summary derives seven-day answer/correct/hint counts, round counts, and unlock events from this log. Current game levels come from the progress table.

Round/problem tables retain generated arithmetic, the first assessment result, and recorded hint state. An answer's numeric submitted value is used to assess correctness but is not separately retained in the event payload. Events are local demo records; there is no external analytics collector or cross-device synchronization.

Fraction evidence is separate, in browser storage: per-item ID/type, correctness, assistance, and attempt count, inside a completed session with its ID and completion timestamp. The browser also stores an unfinished session for resume. This is not a server-side fraction telemetry feed.

The prototype has no research-study enrollment, pre/post outcome protocol, delayed retention test, experiment assignment, measured learning-gain estimate, or active-attention timer. Any future outcome/retention dashboard or experiment should be described as proposed work rather than existing measurement.

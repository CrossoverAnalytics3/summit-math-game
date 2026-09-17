# Verification record — v0.3.0

Verified September 16, 2026, with Node **24.21.0**, npm **11.19.0**, and the Codex in-app browser. Checks ran in a fresh clone of `CrossoverAnalytics3/summit-math-game` after applying the reviewed changes.

## Clean install and automated checks

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | 223 locked packages installed from the available cache. |
| `npm run check:repo` | Required hidden files, safe example configuration, Git exclusions, and tracked-file checks passed. |
| `npm test` | **82 passed: 72 server tests and 10 fraction tests.** |
| `npm run typecheck` | Browser and server passed. |
| `npm run eval` | **17,952 deterministic checks passed; zero failures.** |
| `npm run build` | Production browser bundle built successfully. |

The 72 server tests include 43 foundation tests, 15 API tests, and 14 trail-rule tests. There are 16 additional tests compared with the preceding 66-test release. The deterministic evaluation covers 17,920 arithmetic cases and 32 fallback/constraint checks. The existing distinct-round test covers seven skills, ten levels, and eight seeds (560 scenarios).

New checks cover heart accounting, the third incorrect answer ending a round, blocked later unassessed answers/hints, idempotent answer and Finish replays, retained levels/history, the exact 120-second bonus boundary, continued play after expiry, delayed Finish preserving an earned bonus, a third miss on the seventh question, snapshot privacy, persistent hint use, story isolation, old-round compatibility, and an additive SQLite schema upgrade.

No live model calls are needed for these checks. The clean install did not run an npm vulnerability audit. The hosted **Verify Summit** workflow can be observed after this update is pushed; these are local verification results.

## Browser checks for this revision

A separate local preview used a fresh synthetic profile and no model key. Its runtime database was kept outside the source package.

- A standard arithmetic trail opened with three hearts, zero points, and a two-minute bonus window.
- Three correct independent answers earned 300 points and unlocked level 2. The current round continued to label its actual question difficulty as level 1.
- The bonus window expired in real elapsed time. Play remained available; the interface changed to “Keep going—your points are safe.”
- One incorrect answer used one heart. Reloading and choosing **Resume this trail** restored 300 points, two remaining hearts, the expired bonus state, and the next unanswered problem.
- Two more incorrect answers exhausted the hearts. The result showed **3 correct / 6 attempted**, 300 points, level 2 still unlocked, and six of seven stops explored. The unattempted seventh question was not counted as an incorrect answer.
- **Try a fresh trail** started a new round at level 2 with three hearts.
- At **390 × 844**, the new arithmetic status panel and controls fitted the phone viewport without horizontal page overflow.
- The isolated demo clock was advanced five days through its documented API. The interface offered an explicit optional comeback. Choosing it lowered practice to level 1 and replaced the older saved-round action with **Start this trail**, retaining prior assessed history.

The bonus award and delayed/replayed Finish cases are covered by automated tests; a new seven-answer timed bonus award was not separately recorded in this browser pass. Network-failure retries were reviewed in code and supported by API idempotency tests; this pass did not simulate a browser disconnection.

## Source and repository checks

The prior remote `main` commit `e09a3bc` contained 48 source files and omitted `.env.example`, `.gitignore`, `.nvmrc`, and `.github/workflows/ci.yml`. The original source ZIP contained those four files. The prepared update restores them and adds a repository check to CI.

The current source has an empty API-key example and no private environment file, runtime database, installed dependencies, or compiled output in the source archive. A credential-pattern scan found no candidate matches in the current source text. Git history, remote URL, and the existing `main` branch were preserved; preparing this update did not commit or push it. Third-party notice text was moved without modification.

## Earlier verification retained as history

The September 15–16 v0.2.0 checks passed 56 server tests, 10 fraction tests, the same 17,952 deterministic checks, type checking, and build. Earlier browser walkthroughs covered all three fraction towers, targeted authored help, the subdivision scaffold, reload/resume, two first-attempt checks, evidence summaries, export fallback, arithmetic, and offline stories on desktop and phone.

An earlier actual Anthropic request produced a story about three planets with four moons each and passed the implemented story checks. Another accepted story appears in the recorded demo. These are individual integration smoke tests, not a measured model reliability rate. No live provider call was repeated for this revision.

Existing 2:52 and 2:56 demo videos document the earlier build and its historical 66-test total. The 2:56 narration cut remains an edited demonstration of fraction and story interactions; it does not show the newly restored arithmetic hearts and bonus window.

## Coverage boundaries

These checks establish tested software behavior and content rules. They do not establish learning gains, retention effects, unseen transfer, full assistive-technology compatibility, or production readiness. The eight-second provider timeout is implemented, but the suite does not directly time an elapsed timeout/abort. Numeric and format validation does not establish arbitrary model semantics or age suitability.

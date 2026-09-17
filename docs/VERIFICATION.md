# Verification — v0.5.3 reviewed integration

**September 16, 2026. 264 tests pass: 176 server + 88 web.** All browser records described here are synthetic demonstration data.

## Current build checks

| Check | Result |
| --- | --- |
| Clean install | `npm ci --offline` from the supplied lockfile succeeded; 223 packages installed. |
| Tests | 176 server tests and 88 web tests pass, zero failures. |
| Typecheck / repository checks | Pass. |
| Production build | Pass; 328.45 KB JavaScript and 134.91 KB CSS (100.85 KB / 29.73 KB gzip). |
| Legacy arithmetic evaluation | 17,952 checks pass. |
| Generated worksheets | 2,100 sets across all seven skills and ten levels; exactly one valid planted slip. |
| Excluded-digit rules | 6,300 generated rounds across the three offered digits; seven distinct questions, excluded digit absent from questions and correct answers. |
| Existing teaching engine | 52,500 bounded simulations remain covered by the web suite. |

## Fixes confirmed in this review

The supplied integration reported 157 server and 83 web tests. Review added 13 homework/rule regression tests, 6 completed-evidence tests, and 5 web evidence tests. Regression coverage includes wrong-card coincidence, scaffolded worksheet results not changing independent mastery, easier-at-level-one practice, no pre-submission seed/slip disclosure, place-value retries, deterministic shuffling, timer-off scoring, completed-only evidence and exact-response persistence. It also covers replay-safe submissions, learner scoping, bounded latest-100 evidence and reset behavior.

## Browser checks

| Scenario | Observed result |
| --- | --- |
| Teaching regression | Meadow Camp fixed four works for twelve/three; twelve/four leaves one out; repeated sharing produces 3 each, then 2 each for eight/four. Summit reached. |
| Support and correction | Picture support appears on the revised run. A clearly labeled demo correction marks Teaching 2 as a system issue, preserves its 4,4,4,0 trace, and withdraws dependent questions. Reload retains the record. |
| Rules in play | Selected one heart, clock off, easier and no 5s. Actual round showed one heart, no deadline, and practice-only streak messaging. Correct 13 + 1 earned points while the level and streak stayed at one and zero. Rule selection retained keyboard focus. |
| Wrong-card collision | Chose a correct card but supplied the planted slip’s reason and numerical answer. All three success flags stayed false. |
| Homework keyboard flow | Arrow keys moved worksheet selection; Enter submitted 17 for the visible 2 + 15 counting slip. Found/named/fixed all succeeded, and results received focus. |
| Journal bridge | “See teaching journal” opened the tutor brief with separate worksheet counts. Its source link focused the matching record, which retained the selected card, reason, answer and original worked page. |
| Interrupted submission | Stopped the local server after choosing a mobile worksheet response. The failed save retained and locked those choices for retry. Restarting the server and retrying saved that same response successfully. |
| Parent report | After three synthetic worksheet checks, the report showed found 2, named 2, fixed 2, separate from one arithmetic answer and unchanged level. |
| Mobile layout | At 390 × 844, worksheet controls and evidence had document width 375 px without horizontal overflow. Rule sheet remained scrollable. Evidence link focused the correct worksheet. |
| Desktop layout | Inspected and captured at 1440 × 900. Existing visual design retained. |

The silent guided demo is an edited sequence of genuine browser captures with held reading time and an explanatory footer outside the app. It is not a continuous full-frame-rate desktop recording. The source app’s displayed outcomes were not altered for the video. A separately completed negative test is included in the aggregate counts visible in the recording; it is synthetic QA data.

No live AI call, full screen-reader audit, classroom authentication test, or child learning study was performed. Retry after losing the connection was exercised; an ambiguous lost response after the server commits is covered by server idempotency tests, not browser fault injection. These checks establish software behavior, not educational effectiveness.

[Mobile worksheet evidence](images/v053-homework-evidence-mobile.png) · [Mobile worksheet result](images/v053-homework-result-mobile.png)

---

## Previous v0.5.2 and v0.5.1 records

**September 16, 2026 — v0.5.2: durable journal, tutor brief, two-event floor, and progression verified; 225 tests pass.** The tested scenarios and remaining validation limits are identified below. All demonstrations use synthetic data and authored coach content.

The earlier math release's historical results remain in [legacy/QA.md](legacy/QA.md). The totals below come from the current iteration. The legacy arithmetic evaluation and the new teaching simulations are different suites and are reported separately.

## Automated checks

| Check                                      | Current result                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Repository hygiene                         | Pass — required source files and private-configuration hygiene check                                          |
| Server tests                               | 142 pass — 115 existing plus 27 journal persistence and integrity tests                                       |
| Teaching-engine tests                      | 37 pass, including **52,500 bounded simulations** checking berry conservation and execution-trace consistency |
| Fraction tests                             | 10 pass                                                                                                       |
| Idle-guidance tests                        | 12 pass — 10 seconds, then 30 seconds, then silence; activity-scoped budget and timing                        |
| Tutor-brief tests                          | 9 pass — evidence links, source support, uncertainty, correction and floor                                    |
| Expedition-progress tests                  | 3 pass — all-stage completion, corrected evidence, five-day return eligibility                                |
| Local-cache recovery tests                 | 12 pass — migration, rejected-data preservation, read/write failure and exact recovery export                 |
| **Current test total**                     | **225 pass**                                                                                                  |
| Type checking                              | Pass                                                                                                          |
| Legacy deterministic arithmetic evaluation | **17,952 checks pass, 0 fail** — rerun for v0.5.2; separate from the teaching-engine cases                    |
| Production build                           | Pass                                                                                                          |
| Isolated clean installation                | Prior v0.5.0 pass — 223 packages installed in a separate clean copy; v0.5.2 dependency metadata is unchanged  |

### Current verification scope

Server tests use an isolated temporary SQLite database and verify recomputation, append-only observed inputs, missing references, two-event migration, targeted correction, dependent withdrawals, revision conflicts, duplicate retries, another connection and module reload. Browser cache tests preserve rejected raw records and do not silently replace them. Guidance tests verify ten seconds, thirty seconds, then no more automatic hints during that activity's page visit. Tests establish software behavior, not educational outcomes.

## v0.5.2 browser checks

| Scenario                          | Observed result                                                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing journal migration        | Two previous local attempts moved to the server. Single-run interpretations became insufficient instead of being promoted from the presence of unrelated history.                                                             |
| First, changed, transfer          | Beacon Ridge: fixed four shared twelve berries fairly; the same instruction with nine produced 4,4,0 and one leftover. Repeated rounds produced 3,3,3, then the same rule shared eight among four as 2,2,2,2. Summit reached. |
| Keyboard controls                 | Enter selected a method, increased the amount, confirmed a teaching and ran it. The accessibility tree exposed pressed state, the new amount, labels, and the selected prediction. This is not a full screen-reader audit.    |
| Tutor brief                       | All four questions rendered with links to their source attempts. Transfer was identified as a local observation; supports and uncertainty stayed separate.                                                                    |
| Separate browser origin / process | A fresh localhost:3014 origin, served by a second process reading the same SQLite file, opened all six saved attempts. This verifies retrieval beyond the original browser cache, not authenticated remote access.            |
| Concurrent edits                  | A note saved through the second origin caused a stale primary-browser save to show a conflict. The explicit export-and-open action retained the newer server note. No silent overwrite occurred.                              |
| Targeted system correction        | Flagging synthetic Teaching 4 preserved its original 4,4,0 allocation and actual steps, marked exactly one system issue, and withdrew its question. The flag persisted after reload.                                          |
| Evidence link on mobile           | Tapping the system-issue evidence link focused the matching run. Its original two execution steps remained inspectable.                                                                                                       |
| Responsive views                  | Tutor brief inspected at 1264 × 900 and 390 × 844; mobile document width was 375 px with no horizontal overflow.                                                                                                              |

The five-stage expedition map was also checked at 390 × 844: the next-step condition stayed readable, and starting the other route retained all six journal records.

The five-day return trigger, 30-second second hint, and final hint suppression have deterministic test coverage and component review; this iteration does not claim a multi-day browser study or a timed manual replay of every variation. Original arithmetic/fraction regression suites pass; the main manual walkthrough for this iteration focused on teaching and persistence. No live provider call was made.

## v0.5.1 onboarding browser checks

The running app at localhost:3013 was checked at the normal 797 × 770 viewport and at 390 × 844. These are specific manual checks, not a full accessibility or child-usability study.

| Scenario                               | Observed result                                                                                                                                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meadow tutorial                        | All four steps opened; illustrated sharing reached two berries per friend with an empty basket. Back/step navigation and completion controls were available.                                                                                                      |
| Ridge and fraction tutorials on mobile | Tower, number line, instructions, and Next/Skip controls fit. Document width was 375 px inside the 390 px viewport.                                                                                                                                               |
| Example isolation                      | No beacon appeared while a tutorial was open. Teaching journal stayed unchanged through tutorials and increased only for the two actual runs.                                                                                                                     |
| Idle hint and interaction              | After a fresh interaction there was no beacon. After 10.5 seconds of inactivity, Use this teaching glowed. Show me focused it without confirming it; prediction remained disabled.                                                                                |
| Mobile prediction hint                 | Prediction selector glowed with no answer selected. The hint card and target were visible together.                                                                                                                                                               |
| Teaching sequence                      | Confirmation enabled prediction. A fixed-three plan with twelve berries left three in the basket; Try another idea reset confirmation and prediction. Revised fixed-four plan produced four each and enabled Continue. New stage returned to choosing a teaching. |
| Fraction controls                      | Turning each of the three layers moved the idle target to Light the beacon. Checking mismatched layers returned the specific picture-layer feedback.                                                                                                              |
| Arithmetic start                       | While the tutorial remained open beyond ten seconds, the live problem was not loaded. Closing it started the round with a full 2:00 bonus window.                                                                                                                 |
| Arithmetic answer and replay           | 1 + 3 = 4 awarded 100 points and enabled Next. Reopening and closing the tutorial preserved the result and existing countdown.                                                                                                                                    |
| Story entry and play                   | Tutorial opened before world selection. Choosing Forest friends made Make my adventure the idle target. The offline story accepted 4 × 2 = 8 and enabled Finish.                                                                                                  |
| Reduced motion                         | Tutorial final fraction appeared immediately with animation disabled and full opacity.                                                                                                                                                                            |
| Keyboard                               | Escape closed the replay and settings dialogs; Show me moved focus to its intended control.                                                                                                                                                                       |

The fraction session-check group targeting, hidden-tab lifecycle, and all seven arithmetic trail variations were reviewed in code and share the tested guidance components; they were not each manually replayed in this iteration. Live AI was not called.

## Earlier core-flow browser scenarios

These core-flow checks were completed for v0.5.0 before adding onboarding. The new checks above cover the modified interaction flow.

| Scenario                                | Expected evidence                                                                             | Status                                                                                                                                                                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop entry                           | Original mountain, clear teaching objective, usable primary action                            | Pass — desktop 1264 × 712, localhost:3013                                                                                                                                                                                                                                             |
| Initial sharing                         | Twelve berries, three friends, accepted instruction and actual execution agree                | Pass — fixed four produced 4, 4, 4 and an empty basket                                                                                                                                                                                                                                |
| Correct initial plan                    | Successful instruction works without manufactured failure                                     | Pass — first run completed immediately                                                                                                                                                                                                                                                |
| Incomplete plan                         | Real leftovers or invalid allocation displayed and accounted for                              | Pass — twelve / four with fixed four produced 4, 4, 4, 0; mismatch shown                                                                                                                                                                                                              |
| Beacon Ridge                            | Nine berries, three friends, visible route consequence                                        | Pass — 2/6 of twelve produced four each; the unchanged 2/6 instruction with nine produced three each                                                                                                                                                                                  |
| Meadow Camp                             | Twelve berries, four friends, new companion visible                                           | Pass — changed group, then revised to fixed three and completed                                                                                                                                                                                                                       |
| Prediction / revision                   | Record links prediction, run, and later revision without silently replacing history           | Pass — four attempts retained: initial, mismatch, supported revision, final follow-up                                                                                                                                                                                                 |
| Common follow-up                        | Eight berries, four friends, prediction and actual result visible                             | Pass — predicted two, rounds plan completed, summit reached                                                                                                                                                                                                                           |
| Fraction plan limitation and revision   | Whole-berry constraint is explained; changing the teaching produces a real new result         | Pass — 2/6 of eight paused with zero steps; changed to 1/4 and predicted two, producing 2, 2, 2, 2                                                                                                                                                                                    |
| Support                                 | Help is available and identifiable in the evidence                                            | Pass — authored coach plus picture; exactly one of the four attempts recorded both supports                                                                                                                                                                                           |
| Journal inspection                      | Observations, accounts, and tentative interpretation visibly distinct                         | Pass — run details, learner account, and authored proposal inspected                                                                                                                                                                                                                  |
| Correct interpretation                  | Original observation retained; disputed interpretation and dependent suggestion change status | Pass — added intention/context; dependent question visibly withdrawn; observation retained                                                                                                                                                                                            |
| Report system misunderstanding          | Event is not automatically treated as an independent learner error                            | Pass — flagged final run; success count changed from three to two, system-issue count to one                                                                                                                                                                                          |
| Authored fallback                       | Complete usable play with no provider access                                                  | Pass — authored coach and complete Meadow-to-summit flow                                                                                                                                                                                                                              |
| AI enabled                              | Actual live-provider behavior                                                                 | Not exercised; automated adapter cases passed                                                                                                                                                                                                                                         |
| Journal reload                          | Saved observations, account, and corrections survive refresh                                  | Pass                                                                                                                                                                                                                                                                                  |
| Active-attempt resume                   | Reload during an unfinished expedition restores the promised state                            | Pass — after the first Ridge run, refresh and Continue restored the exact completed run and 2/6 instruction                                                                                                                                                                           |
| Another expedition on the same route    | Start fresh without losing historical observations                                            | Pass — a new Meadow expedition showed empty packs, twelve in the basket, a blank prediction, and no active result while retaining four earlier runs                                                                                                                                   |
| JSON export                             | Real downloaded data contains the saved evidence                                              | Pass — downloaded JSON inspected: four runs, one system issue. The browser automation's download wait timed out, but the actual completed file existed and parsed correctly.                                                                                                          |
| Phone-sized viewport                    | Core controls accessible, no obstructive overflow                                             | Pass — 390 × 844; a number-line overflow was found and corrected. Final document width was 375 px within the viewport, accounting for its scrollbar                                                                                                                                   |
| Mobile journal and parent explanation   | Evidence and adult-facing content remain readable                                             | Pass — both opened and inspected; 375 px document width within the 390 px viewport                                                                                                                                                                                                    |
| Keyboard / motion                       | Selected controls and comfort settings work                                                   | Limited manual pass — Enter activated Previous fraction and Run; Escape closed settings; Reduce motion and Stronger contrast were toggled on; reduced-motion run showed the result immediately. This is not a full accessibility audit                                                |
| Original practice camp                  | Original activities remain available through **A little practice at basecamp**                | Smoke test passed — Little additions accepted 4 + 2 = 6, awarded 100 points, recorded an independent run of 1/3, and enabled the next challenge. Fraction Peaks opened its first 1/2 tower with three interactive layers. This was not a full manual rerun of the original activities |
| Navigation during pending coach request | Late response cannot alter another active teaching                                            | Pass — a temporary QA proxy delayed the coach by four seconds. The request visibly entered its pending state; advancing to the next camp cancelled it. The later attempt and both journal entries retained no recorded support, and no late coach card appeared in the new situation  |

## Captured evidence

These are captures of the running app, not generated mockups:

- [Five-stage map on mobile](images/v052-progression-map-mobile.png)
- [Tutor brief on desktop](images/v052-tutor-brief-desktop.png)
- [Tutor brief on mobile](images/v052-tutor-mobile.png)
- [Transfer result](images/v052-transfer-desktop.png)
- [Targeted correction](images/v052-correction-desktop.png)
- [Animated teaching tutorial](images/tutorial-teaching-desktop.png)
- [Ten-second prediction beacon on mobile](images/tutorial-beacon-mobile.png)
- [Ridge tutorial on mobile](images/tutorial-ridge-mobile.png)
- [Fraction tutorial on mobile](images/tutorial-fraction-mobile.png)
- [Original mountain home](images/teach-home-desktop.png)
- [Consequential route choices](images/teach-routes-desktop.png)
- [Meadow changed-condition mismatch](images/teach-meadow-mismatch.png)
- [Summit arrival](images/teach-summit-desktop.png)
- [Teaching journal](images/teach-journal-desktop.png)
- [Correctable interpretation](images/teach-correction-desktop.png)
- [Fraction teaching tower on phone-sized viewport](images/teach-tower-mobile.png)
- [Beacon Ridge on phone-sized viewport](images/teach-ridge-mobile.png)
- [Mountain home on phone-sized viewport](images/teach-home-mobile.png)
- [Journal on phone-sized viewport](images/teach-journal-mobile.png)

Hosted CI, live-provider behavior, public deployment, and learner outcomes are separate from these local results. The new chapter's **AUTHORED QUESTION** badge was verified; no live model call was made. The pending-request check used a temporary transport delay, not a live provider. Original practice, keyboard, and comfort checks cover only the interactions listed above.

## Educational validation

No learner study, retention result, learning-style inference, or effectiveness result is claimed. The [product guide](PRODUCT-GUIDE.md#measure-and-iterate) provides proposed measures, denominators, and iteration decisions. Software tests verify supported program behavior rather than educational benefit.

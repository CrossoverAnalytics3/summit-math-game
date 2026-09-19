# Architecture — Teach the Climb

This document describes version 0.5.3. Current check results belong in [VERIFICATION.md](VERIFICATION.md); the [persistence contract](TEACHING-PERSISTENCE.md) details the journal and worksheet evidence APIs. Earlier arithmetic and fraction architecture is archived in [legacy/ARCHITECTURE.md](legacy/ARCHITECTURE.md).

## Responsibilities

| Layer                       | Owns                                                                                                                                           | Does not establish                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| React / TypeScript / Vite   | Route choices, teaching controls, predictions, replay, progression, tutor brief and journal corrections                                        | Mathematical truth through visual appearance alone                                              |
| Shared deterministic engine | Supported instructions, quantities, contexts, run results, evidence floor and correction dependencies                                          | Long-term mastery, intention or personality                                                     |
| Express / Node 24 / SQLite  | Validated journal persistence, recomputed outcomes, preserved observations, revision conflicts, model access and inherited arithmetic services | Independent proof of a child's identity or of assistance outside the app                        |
| Expedition AI coach        | Selects a reviewed question and Pip line using bounded integer IDs                                                                             | Generating report claims, grading, modifying outcomes or retraining itself from a child's input |
| Tutor brief                 | Traceable session observations, uncertainty, support and questions with sufficient eligible sources                                            | A clinical, psychometric or learning-style assessment                                           |

## Frontend structure

`App.tsx` coordinates the active page, teaching actions and shared dialogs. The main surfaces have separate components:

- `TeachHome.tsx`: the original mountain hero, entry actions and route progress.
- `TeachFlow.tsx`: instruction controls, predictions, scene, replay and next actions.
- `TeachingJournal.tsx`: individual run records, notes, interpretation status and correction entry.
- `TutorBrief.tsx` and `tutorEvidence.ts`: the four-question adult summary, computed from explicit records and linked back to them.
- `ExpeditionProgress.tsx` and `progressModel.ts`: observed successes on each route and the optional return warm-up.
- `useTeachingJournal.ts` and `localJournal.ts`: synchronization, conflict handling, offline cache and recovery of unreadable local data.
- `Homework.tsx`: the child's arithmetic rules and the worked-example activity, with server-owned answer checking.
- `HomeworkEvidence.tsx`, `homeworkEvidenceModel.ts` and `useHomeworkEvidence.ts`: separately labeled worksheet records, three outcome counts, source links and a fresh server read on each journal visit.

`TeachScene.tsx` holds the scene artwork and `ui.tsx` holds shared controls. `LegacyApp.tsx` continues to own the original practice entry points. The visual design and original mountain image are retained.

## Authoritative execution and progression

The first camp uses twelve berries and three friends. Beacon Ridge changes the basket to nine for the same group. Meadow Camp keeps twelve berries and adds a fourth friend. Both routes end with an eight-berry, four-friend summit check. The three plan types are a fixed amount, repeated one-each sharing rounds, and a fraction of the starting basket.

`shared/expedition.ts` supplies the supported plans, exact simulation, route contexts, run records, correction functions and summaries. The browser uses it for immediate feedback; the server uses it to rebuild every saved run and to prepare coaching requests. Submitted context, shares, replay steps and completion claims cannot override the engine's calculation.

Pip follows the accepted instruction. A correct plan works immediately; the changed context can expose a plan's limits without staging an error. The prediction field asks what a fair share would be, rather than asking the child to forecast an unequal execution.

The home trail displays **first teaching → changed situation → fresh summit challenge** for each route. Its checkmarks mean that an eligible, completed fair share was observed at that stage. They can accumulate across attempts; they do not imply one unchanged plan, one uninterrupted climb or enduring mastery. System-issue runs are excluded. The last successful summit record also indicates whether picture or coach support was recorded.

After five days away from an unfinished expedition, the home surface offers an existing six-berry tutorial example or a return to the saved camp. It retains previous achievements and does not reset difficulty. This is a return experience to evaluate, not a demonstrated retention intervention. Longer expeditions and a sequenced curriculum remain future work. Original arithmetic levels retain their separate consecutive-correct, no-hint progression rule.

## Guidance before and during play

`QuickTutorial.tsx` provides four-step authored demonstrations for each teaching route, Fraction Peaks, arithmetic and story play. The animations use separate example quantities and never create runs or call the model. **Use this teaching** confirms an instruction before the prediction and run; changing the plan or entering a new situation clears that confirmation. The guide follows choose, predict, try and compare. Editing a prediction after a result clears the active result reference while retaining the historical run.

`ActionBeacon.tsx` connects controls to `guidance.ts`. The first eligible idle nudge appears after ten seconds. After another interaction or reset, the next requires thirty quiet seconds; automatic nudges then stop for that activity. The budget survives target and step changes within the activity. Dialogs, hidden tabs, playback and unavailable controls suppress guidance without consuming a nudge. **Show me** scrolls and focuses the control without activating it. Reduced-motion settings use steady cues.

Tutorials and navigation cues are separate from the recorded mathematical picture and coach support. A fresh arithmetic round starts after its entry tutorial closes; replaying the tutorial cannot reset an existing server-owned bonus deadline. [Tutorial and controls guide](ONBOARDING.md)

## Evidence, interpretations and the tutor brief

The evidence flow is:

```text
accepted instruction + fair-share prediction + situation
                    ↓
              deterministic run
                    ↓
     observed execution + support + learner account
                    ↓
      at least two distinct eligible observations
                    ↓
       tentative interpretation → next question
                    ↑                ↓
          correction/context → dependent withdrawal
```

One run remains an observation, with **insufficient evidence** for an interpretation. `createInterpretation` checks actual referenced runs, not only a count of IDs. Duplicate IDs cannot satisfy the floor; missing runs are invalid and system-issue runs are ineligible. `reconcileInterpretations` applies the same rules on restore and save. Two observations permit a tentative interpretation; they do not prove a pattern, learning gain or preferred learning style.

An adult or learner can add context or report **Pip misunderstood my instruction**. The original plan and replay remain visible. A targeted system correction flags only the selected run, excludes it from learner-evidence counts and withdraws questions whose sources are no longer valid. Dependency withdrawal is transitive. Confirming a question cannot reactivate a corrected, withdrawn or insufficient interpretation. Saved correction context and withdrawn questions cannot be silently rewritten by a subsequent journal save.

The tutor brief has four rows: **what was demonstrated, what is still uncertain, what support appeared, and what could we ask next**. Each evidence-bearing line links to its run records. It distinguishes successful sharing, a fixed summit check, recorded support, system issues and the learner's own note. When no eligible interpretation-based question is active, it asks for another observation or a description in the learner's own words. It does not manufacture a profile to fill the card.

### Worksheet checks are a separate evidence stream

**Fix Pip's homework** presents three worked examples from the selected arithmetic skill, with one authored mathematical slip. The child chooses a card, chooses a reason from four options and enters a corrected answer. `shared/homework.ts` constructs and checks the task; the server retains the answer key until submission. A preferred authored slip can be requested through the API when it fits the numbers. This does not match the child's earlier worksheet or automatically interpret tutor session notes.

The server records **found the slip**, **named the reason** and **fixed the answer** separately. Naming and fixing require selection of the slipped card, preventing a coincidentally matching reason or number on the wrong card from receiving credit. These are checks of a supported task: Pip's steps and reason choices were visible. They neither advance nor reset the independent arithmetic trail streak. Additional adult assistance and an unaided verbal explanation are not recorded by this activity.

The browser tutor brief combines climb records with completed worksheets while retaining their distinct labels and source links. The worksheet follow-up is an authored invitation to explain a step, not an inferred learner trait or a climb interpretation. Worksheet records do not satisfy the two-climb-observation interpretation floor. An adult can inspect the exact submitted choices, Pip's original steps and the checked result; older records without saved selections say that those selections were not recorded. [Proposed evaluation measures](PRODUCT-GUIDE.md#worksheet-evaluation)

## Persistence, conflicts and recovery

`shared/journal.ts` defines the shared `Journal` contract and its strict parser. SQLite has separate tables for current journal state, runs and interpretations. A bounded workspace holds up to 200 runs and 200 interpretations. Previously saved instructions, predictions, support labels, dates, evidence links and ordering are preserved; new attempts append to the history. Notes remain editable context. State and record changes commit together.

The four journal endpoints are:

| Endpoint                     | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `GET /api/teaching/journal`  | Read the current `{ revision, journal }` snapshot.       |
| `PUT /api/teaching/journal`  | Validate and save against the supplied revision.         |
| `GET /api/teaching/runs/:id` | Read a canonical observed run.                           |
| `GET /api/teaching/brief`    | Read canonical runs, interpretations and summary counts. |

`GET /api/homework/evidence` is a separate read-only route returning `{ worksheets, total, limit }`. It reads only submitted worksheets for the current local learner, with a view limit of 100, ordered by creation time. `shared/homeworkEvidence.ts` specifies worksheet prompts and steps, reason choices, the exact submitted response, completion time and three checked outcomes. The underlying `homework_sets` table is separate from teaching runs and interpretations. The journal write API cannot create or rewrite these worksheet results. `GET /api/teaching/brief` remains climb-only; the frontend composes the two evidence streams.

The worksheet evidence route and browser request use `no-store`. Each journal visit refreshes the worksheet view; a failed read shows an error and retry, not a claim that no work exists. Worksheet records do not enter the offline teaching cache. The UI provides separate climb-journal and worksheet exports, and identifies when its worksheet counts cover a limited view rather than the full history.

A changed save against an old revision returns **409** with the server copy. An exact retry of the already-saved payload returns that snapshot without duplicating records. The browser serializes writes, retains local edits during a conflict and offers a local download before loading the server copy. It does not silently merge incompatible observations. The existing explicit demo reset clears the teaching tables along with the other demo data.

The browser cache remains at `summit.teach.v1`, with separate synchronization metadata. It allows local work when the server is unavailable. The known older omission of `planConfirmed` is migrated; other rejected data is preserved verbatim in a recovery archive and offered for download. If local storage cannot preserve that archive, the original key is protected from overwrite and an in-memory recovery download remains available. Storage failure and sync failure are surfaced rather than presented as successful saving.

This is one **local demonstration workspace**, consistently bound to the existing synthetic learner `L-1`. Another browser connected to the same accessible server can read the saved journal. Separate servers or database files do not share it. These endpoints provide no authentication, tutor roles, account isolation or hosted cross-device service. Broader deployment needs deliberate access, retention, consent and privacy design.

Server recomputation guarantees mathematical consistency with submitted inputs. Predictions, support use and dates are still client-recorded observations, not independently supervised assessment evidence. Arithmetic and worksheets keep their own SQLite records and fraction activity keeps its browser records. Completed worksheets are now visible in both the parent report and teaching journal, with different stated scopes; neither surface turns them into expedition runs or independent mastery evidence.

## Runtime AI and fallback

API credentials belong in a private root `.env`; `.env.example` contains no usable key. An adult-facing setting must also permit AI. `server/src/teaching.ts` provides finite question and Pip-line banks. The model returns only a question ID and story-line ID; strict validation accepts integers 0–2 with no extra fields. Missing access, a failed request, an eight-second timeout or rejected output uses authored selection. The request is capped at 60 output tokens. A source label identifies the path used.

`POST /api/teaching/coach` validates route, stage, plan, bounded prediction, support labels, evidence ID and variation, then recomputes the simulation. The provider receives route, stage, quantities, plan, computed shares/leftovers/outcome, and booleans indicating whether a prediction or support was recorded. It receives **no journal notes, correction text, actual prediction, evidence ID or prior-session history**. Explicit coaching requests are limited to twelve per minute per address; ordinary local simulation does not consume that allowance.

The returned evidence ID is a journal reference, not authentication. The response combines selected language with a code-authored description of the actual simulation. The optional model does not generate report claims, determine the evidence floor, change the learner's plan, award progress or retrain itself. Notes and corrections stay in the local journal server and browser cache; JSON exports contain them too. The inherited arithmetic story adapter remains a separate feature with its own boundaries.

### Generative AI in arithmetic activities

`server/src/ai/story.ts` implements three additional runtime AI features through the Anthropic adapter:

| Feature | Context sent | Acceptance checks and fallback |
| --- | --- | --- |
| Themed word problem | Operation, operands, theme, grade | Returned story, required operands, no extra digit values, numeric answer-leak check, length, and generated problem range; otherwise an authored story. |
| Strategy hint | Problem prompt, grade, and operands; the current HTTP route sends no attempted answer | Returned hint, allowed digit values, numeric answer-leak check, and length; otherwise an authored hint. |
| Parent note | Weakest skill, whether practice occurred, whether a level unlocked | Returned note, no digits, and length; otherwise an authored note. The child's name is not sent. |

The story and hint numeric checks allow an answer that equals a supplied operand. They inspect digit strings and bounded structure; they do not prove that all language is mathematically or pedagogically correct. Provider failures also fall back to authored content. The provenance object records provider, prompt version, fields sent, named checks, and the final `ai` or `template` source. The arithmetic server owns generated problems, accepted answers, scoring, and progression throughout.

These generative features and the expedition's bank selection are distinct AI behaviors. Their proposed usefulness evaluation is described in the [AI product engineering case study](AI-PRODUCT-CASE-STUDY.md).

## Scope and reuse

The original mountain PNG, alpine visual language, Pip, code-native models, practice activities and verification infrastructure are retained. The current experience adds teaching, route consequences, visible progression, the tutor brief, durable evidence and correction behavior. Their checks are distinct from historical results in `docs/legacy/`.

The first equal-sharing expedition has fixed authored encounters. A successful summit check is a local transfer observation, not an unseen test or evidence of durable mastery. Actual learner usability, adult usefulness and learning outcomes remain to be measured. No real child's identity or private dataset is required to run the demonstration. [Problem, success criteria and iteration plan](PRODUCT-GUIDE.md) · [Hackathon prompt fit](PROMPT-FIT.md)

# Summit — Teach the Climb

**Teach Pip your way. Reach the summit together.**

Summit is a playful teaching adventure for children and a window into their thinking for parents and tutors. Lead Pip and friends up the original alpine world: choose a route, teach a sharing plan, predict a fair share, and adapt when the expedition changes. The journal makes the journey inspectable—and lets the learner correct its interpretation.

<img src="web/public/art/summit-island.png" width="760" alt="Summit's original floating alpine mountain, with a glowing trail from a warm basecamp to the snowy summit.">

[Run locally](#run) · [Product and success criteria](docs/PRODUCT-GUIDE.md) · [Prompt fit](docs/PROMPT-FIT.md) · [Architecture](docs/ARCHITECTURE.md) · [Three-minute demo](docs/DEMO.md)

## The problem

**A correct answer does not show a parent or tutor what a child intended, how they reasoned, or which support helped them move forward.** The child needs an enjoyable way to make those ideas concrete; the adult needs evidence for a useful next conversation.

Summit's working hypothesis is that teaching a character, watching an instruction execute, and explaining a revision can reveal more useful evidence than answer counts alone. The first learner focus is ages 8–10 exploring equal sharing. This is an **Open-category** learning product: one learner, one concrete problem, and a working experience to demonstrate. It retains math as the first subject while making teaching the central mechanic.

## One expedition, meaningful choices

**The Summit Picnic** starts with twelve berries and three friends. The learner can teach a fixed amount, a repeated sharing round, or a fraction of the basket. Pip follows the accepted instruction; quantities and outcomes come from code.

| Decision         | What changes                                                      | What the learner can investigate                                             |
| ---------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Beacon Ridge** | The next basket contains nine berries for the same three friends. | Does a plan built around a fixed quantity still work when the whole changes? |
| **Meadow Camp**  | A fourth friend joins the original twelve-berry basket.           | Does the same instruction adapt to a different group?                        |

Both routes reach an **eight-berry, four-friend summit check**. The home trail makes **first teaching → changed situation → summit check** visible and retains the fair shares observed along each route. A child returning to an unfinished expedition after five days can replay a small teaching example or continue from the saved camp. Earlier progress remains intact.

Fair-share predictions, runs, support, revisions, and the learner's own account belong to the record. The **tutor brief** brings four questions onto one card: what was demonstrated, what remains uncertain, what support appeared, and what to ask next. Its evidence links lead to the underlying runs. At least two distinct eligible observations are required before an interpretation is proposed; two observations still do not prove a pattern. A correction withdraws dependent questions while preserving the original replay.

The original fraction tower and arithmetic activities remain accessible through **A little practice at basecamp**, under **THE ORIGINAL TRAILS**. Arithmetic trails unlock levels through their own consecutive-correct, no-hint rule. The expedition rewards fair sharing across changed situations; these are session accomplishments, not a claim of lasting mastery. The two evidence systems remain separate. [Clause-by-clause prompt fit](docs/PROMPT-FIT.md)

## Two ways to make practice your own

**Fix Pip’s homework:** inspect three worked problems, find the one that slipped, explain why, and fix it. The tutor brief links separate found / named / fixed observations to the worksheet and the child’s response. These supported examples do not count as independent trail mastery. Worksheets are generated for the same skill and level; matching a child’s actual session mistake is future work.

**Your rules:** choose one or three hearts, a bonus clock or no clock, easier or harder numbers, and a digit to avoid. The server enforces the choices. Easier always stays practice, including at level one. [Play levers and evidence boundaries](docs/PLAY-LEVERS.md)

## A clear first step

The expedition, fraction tower and arithmetic activities open with a four-step visual tutorial using a separate, unsaved example. Children can replay a step, finish with **I’m ready**, or choose **Skip for now**; **Show me how** brings it back. During play, a short guide follows the next action. Pip offers a gentle control highlight after ten seconds without interaction, waits thirty seconds before a second nudge, and then stops automatic nudges for that activity. **Show me** brings the control into view without choosing an answer. [Quick guide to the tutorials and controls](docs/ONBOARDING.md)

## Run

**Node.js 24 or newer is required.** From this repository's root:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3013**. No AI key is required for the authored experience. The included `.nvmrc` selects Node 24. Keep development dependencies installed because the server uses `tsx`.

For optional AI, copy the root `.env.example` to a private root `.env`, set your own `ANTHROPIC_API_KEY`, and restart. Open **For grown-ups → Allow optional AI**. In this expedition, the model selects a question and Pip line from authored options; the badge distinguishes **AI-SELECTED QUESTION** from **AUTHORED QUESTION**. Never commit `.env`; `.gitignore` excludes it. See [architecture and data boundaries](docs/ARCHITECTURE.md) before using actual learner information.

## How it is built

| Layer                               | Responsibility                                                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React + TypeScript frontend**     | Separate home, teaching-flow and journal components; mountain routes, guided controls, replay, visible progression and a traceable tutor brief.                                                                                 |
| **Shared deterministic engine**     | Exact quantities, executable plans, route consequences, replay records, the two-observation floor and correction dependencies.                                                                                                  |
| **Node + Express + SQLite backend** | Recomputes saved runs, preserves observed inputs, stores the teaching journal, detects conflicting writes and bounds optional AI requests. Arithmetic remains server-owned.                                                     |
| **Optional AI**                     | Selects a question and Pip line from bounded authored banks using a recomputed simulation. It cannot write report claims, change mathematical truth, or grade the learner. Authored selection preserves the complete play flow. |

The worksheet flow uses a short Find → Explain → Fix guide.

Teaching Pip changes the instructions it follows. It does **not** retrain a foundation model.

The journal saves to the local server, with a browser cache for offline work. Other browsers connected to that same server can read saved evidence. Conflicting edits require review, and unreadable local records are preserved for recovery. This is one local demonstration workspace, not an authenticated learner account or a hosted cross-device service. [Persistence contract](docs/TEACHING-PERSISTENCE.md) · [Architecture and AI boundaries](docs/ARCHITECTURE.md)

## What success means

| Goal                                | Observable criterion                                                                                                                              | Current evidence                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Trustworthy execution**           | Pip follows the accepted plan; every berry is accounted for; route consequences match the displayed situation.                                    | 52,500 bounded teaching simulations check conservation and trace consistency. Saved run results are recomputed by the server.     |
| **Correctable evidence**            | A disputed interpretation remains identifiable, and its dependent suggestion is withdrawn without erasing the original observation.               | Automated checks cover targeted corrections, dependent withdrawal, the evidence floor, immutable observations and durable reload. |
| **Usable teaching**                 | In an initial supervised pilot, at least four of five children create and run a plan within five minutes without an adult operating the controls. | Proposed target; no learner study conducted.                                                                                      |
| **Understanding beyond completion** | Record each child's unaided prediction and explanation on three new sharing situations, with baseline and later comparison tasks.                 | Proposed measure; success thresholds should be revised after the pilot.                                                           |
| **Useful adult guidance**           | At least four of five participating adults identify the supporting event for a report item and choose a relevant follow-up task.                  | Proposed target; no adult evaluation conducted.                                                                                   |

If controls obstruct teaching, simplify the controls. If the controls work but changed situations expose weak understanding, revise the scaffold and compare a new example. If adults misread a journal entry, revise the wording and evidence display before adding more AI. [Full measurement and iteration plan](docs/PRODUCT-GUIDE.md#measure-and-iterate)

## Verify and review

```sh
npm run check:repo
npm test
npm run typecheck
npm run eval
npm run build
```

**264 tests pass:** 176 server tests and 88 web tests. These cover server-owned arithmetic, durable teaching records, correction dependencies, guidance, tutor evidence, worksheet generation and assessment, and child-selected rules. Teaching tests include **52,500 bounded simulations**. Worksheet checks cover **2,100 generated sets**; rule checks exercise **6,300 rounds** with an excluded digit. The separate arithmetic evaluation passes **17,952 checks**. [Verification](docs/VERIFICATION.md) distinguishes software checks, browser walkthroughs, and proposed learner studies.

The [demo guide](docs/DEMO.md) provides a three-minute narration and screen sequence. The [GitHub guide](docs/GITHUB.md) explains how to update a repository while preserving the previous release.

## Scope and attribution

This first equal-sharing expedition has a small authored encounter set. Its fixed summit check is a local transfer observation, not an unseen assessment or proof of durable mastery. Its session observations do not establish enduring abilities, personality, or learning gains. Learner testing and appropriate data/access controls are needed before broader use. Keep demonstration notes free of identifiable child information.

I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product direction and review were mine. This iteration retains the original alpine artwork and practice activities while changing the main experience to learning through teaching. [Current disclosure](docs/DISCLOSURES.md) distinguishes the new work from the [archived release documentation](docs/legacy/).

Source code uses the [MIT License](LICENSE). Dependencies and other materials retain their terms; the [existing inventory](docs/materials/dependency-inventory-with-sources.md) and [notices](docs/materials/THIRD_PARTY_NOTICES.txt) remain included.

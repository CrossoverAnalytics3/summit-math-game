# Summit — Teach the Climb

**Teach Pip your way. Reach the summit together.**

Summit is a learning-through-teaching adventure: a child teaches Pip how to share, watches that instruction come to life, and adapts when the mountain changes. Parents and tutors can inspect the journey and ask a better next question.

**[Watch / download the submitted demo · 2:57](docs/demo/summit-submitted-demo.mp4)** · [AI product engineering case study](docs/AI-PRODUCT-CASE-STUDY.md) · [Run locally](#run)

<img src="web/public/art/summit-island.png" width="760" alt="Summit's original floating alpine mountain, with a glowing trail from a warm basecamp to the snowy summit.">

## The problem

**A correct answer alone does not show what a child intended, which instruction they tried, or what support helped.** The child needs an enjoyable way to try and revise an idea; the adult needs evidence for a useful next conversation.

The first learner focus is **ages 8–10 exploring equal sharing**. Summit makes instructions, predictions, revisions, and support visible through play. Its hypothesis: these records can make the next tutor conversation more useful than answer counts alone. The hackathon entry follows **My own idea / Open**, with elementary math as its first subject. [Prompt fit](docs/PROMPT-FIT.md)

## Play one expedition

Start with **twelve berries and three friends**. Teach a fixed amount, repeated one-each sharing, or a fraction of the basket. Predict a fair share, then watch Pip execute the accepted instruction.

- **Choose a route:** Beacon Ridge changes the basket to nine berries; Meadow Camp adds a fourth friend. Each choice tests the instruction differently.
- **Revise and climb:** inspect the bowls, use support, and try again. Both routes reach an eight-berry, four-friend summit check. A working plan succeeds immediately.
- **Inspect the evidence:** the tutor brief shows what was demonstrated, what remains uncertain, what support appeared, and what to ask next. Each observation links to its source. Corrections preserve the replay and withdraw dependent questions.

Visual tutorials introduce the controls. The map remembers progress and offers a return warm-up. At basecamp, **Fix Pip's homework** records finding, naming, and fixing a slip separately; **Your rules** lets children choose hearts, bonus timing, difficulty, and a digit to avoid. The original arithmetic trails and fraction tower remain available. [Demo guide](docs/DEMO.md) · [Controls](docs/ONBOARDING.md)

## AI product engineering

AI adds contextual coaching and language variation. The implementation makes its contribution inspectable:

| Component | What it does |
| --- | --- |
| **Expedition AI coach** | Selects a question and Pip line from reviewed banks using the current, recomputed simulation. |
| **Generative arithmetic features** | Writes themed problem stories, strategy hints, and parent notes from limited context. Named checks examine response shape, length, and numbers; provenance records the source and checks. |
| **Shared TypeScript engine** | Executes teaching plans and computes quantities, outcomes, and evidence dependencies. |
| **Node + Express + SQLite** | Owns arithmetic answers, scoring, progression, validated journal persistence, and bounded model requests. |
| **React + TypeScript** | Presents the mountain, interactive teaching, replays, guidance, and linked tutor evidence. |

AI requires a grown-up's opt-in and a provider key. Authored content keeps play working when AI is off, unavailable, or fails checks. Source labels distinguish the returned content. [Architecture and AI contracts](docs/ARCHITECTURE.md) · [Development disclosure](docs/DISCLOSURES.md)

## Success criteria and iteration

| Question | Evidence or next test |
| --- | --- |
| Does Pip execute the accepted teaching reliably? | 52,500 bounded simulations check quantities and replay consistency; the server recomputes saved results. |
| Can records be inspected and corrected? | Tests cover evidence links, the two-observation floor, correction dependencies, persistence, and conflicts. |
| Can children use the experience? | Proposed pilot target: four of five children create and run a plan within five minutes without an adult operating the controls. |
| Does the learning travel? | Compare unaided predictions and explanations on new and later sharing tasks, with support recorded separately. |
| Does it help tutors, and does AI add value? | Test evidence retrieval and follow-up quality; compare AI guidance with authored guidance for relevance, usefulness, latency, and fallback rate. |

**v0.5.3 verification: 264 tests (176 server + 88 web), 17,952 arithmetic evaluation checks, typecheck, and production build passed.** [Verification record](docs/VERIFICATION.md)

The next iteration starts with observed usability and tutor usefulness. The [case study](docs/AI-PRODUCT-CASE-STUDY.md) prioritizes learner explanations and research-informed everyday math missions that connect objects, diagrams, and symbols. These are proposed extensions to the submitted build.

## Run

**Node.js 24 required.** If you use nvm, run `nvm install` and `nvm use` first; `.nvmrc` is included.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3013**. Keep development dependencies installed; the server uses `tsx`.

For runtime AI, copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, restart, and enable **For grown-ups → Allow optional AI**. `.env` is excluded from Git. No key is needed to explore the authored experience.

To reproduce the checks: `npm run check:repo`, `npm test`, `npm run typecheck`, `npm run eval`, and `npm run build`.

## Limits and attribution

This is one local demonstration workspace with fixed expedition encounters. Software checks establish tested behavior; learner benefit and AI's incremental value require evaluation. Selected answers are observations, not complete accounts of reasoning. The journal's “What I meant” field accepts the learner's own words. Model validators check specified properties, not every possible semantic error. Broader use needs appropriate access and data controls. [Full criteria and measurement plan](docs/PRODUCT-GUIDE.md)

I built the foundation with ChatGPT and Claude, then iterated with Codex. AI coding tools did most of the typing; the product direction and review were mine.

Source: [MIT License](LICENSE). [Artwork and dependency disclosures](docs/DISCLOSURES.md). The original mountain artwork is retained.

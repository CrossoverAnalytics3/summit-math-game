# Summit

**Understand the math. Earn the climb.**

Summit is a mountain adventure for the **K–5 Math Game** challenge. Practice addition, subtraction, place value, multiplication, and division on arithmetic trails. In **Fraction Peaks**, turn a fraction symbol, shaded model, and number line until they agree. Correct math earns progress; Pip helps make the next attempt understandable.

[Run locally](#run) · [Walk through the product](docs/PRODUCT-WALKTHROUGH.md) · [Explore the architecture](docs/ARCHITECTURE.md)

<img src="web/public/art/summit-island.png" width="760" alt="Summit's original hero mountain: a floating, snow-covered alpine island with a glowing path from the cozy basecamp to a flag at the summit.">

## The challenge that guides the product

> Develop an interactive, gamified math experience tailored for elementary students that makes foundational arithmetic concepts both intuitive and engaging.
>
> We're looking for: innovative mechanics that encourage steady progression and reward mastery of core numeracy skills.

The design loop is **explore a mathematical relationship → try it → receive useful feedback → earn progress → apply it again**. The mountain, tower, Pip, rewards, stories, journal, and comeback all serve that loop. [Prompt-to-feature mapping](docs/HACKATHON.md#how-the-experience-answers-the-prompt)

## Problem and product hypothesis

**Answer-only practice can hide whether a child understands the number relationship or how much help they needed.** The design challenge is to make that relationship understandable through play and give the child a rewarding, manageable next step.

The hypothesis: directly manipulating equivalent representations makes the relationship visible, while short arithmetic rounds reward independent performance with points and new levels. Fraction Peaks demonstrates the visual mechanic in depth; arithmetic trails apply progression to core numeracy. The journal preserves evidence of help and first attempts.

Comeback supports continuity within this adventure: after five days away, a returning learner can choose arithmetic practice one level lower, retain history, and use an available streak freeze. It appears after a return. These design hypotheses still need evaluation with learners, parents, and tutors.

## Run

**Node.js 24 or newer is required.** From the repository root:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3001**, choose **Let's climb**, and play. SQLite is built into Node 24; no separate database, account, or AI key is needed. The local server creates the synthetic demo profile automatically.

For development, run `npm run dev` and open **http://127.0.0.1:5174**. The included `.nvmrc` selects Node 24. Keep development dependencies installed: the server runs TypeScript through `tsx`. More setup and API details are in the [server guide](server/README.md).

## A climb worth exploring

- **Fraction Peaks:** three towers connect equivalent fractions across symbols, same-size shaded wholes, and number lines. A subdivision scaffold makes the unchanged amount visible. Two session checks follow.
- **Seven arithmetic trails:** seven distinct questions, three hearts, and a two-minute bonus window. A third miss ends the round without lowering a level. Answering all seven questions with a heart remaining before the window closes earns 50 bonus points; expiry alone never ends play.
- **Earned progression:** three consecutive correct answers without hints at the current arithmetic difficulty unlock the next level, up to level 10. A hint or miss resets that run, while already unlocked levels remain. Supported correct answers still earn points.
- **Four story worlds:** space, ocean, dinosaurs, and animals turn a single arithmetic problem into a small story. These rounds have no timer or hearts.
- **Field journal:** completed practice, first-attempt checks without hints, and supported work stay distinct. Save or resume a fraction climb and export the session record.
- **Comfort controls:** keyboard and touch controls, optional sound, motion and contrast settings, and browser read-aloud where available. Fraction Peaks stays untimed and heart-free.

The [product walkthrough](docs/PRODUCT-WALKTHROUGH.md) explains each flow, scoring rule, and design tradeoff.

## How the build works

| Layer | Responsibility and reason |
|---|---|
| **Frontend — React, TypeScript, Vite** | Renders the tower, models, controls, and journal. The browser checks fraction equivalence with exact integer math, selects authored feedback, and saves fraction sessions locally for resume and review. |
| **Backend — Express, Node 24, SQLite** | Generates arithmetic problems and stores their answers. The browser sends a problem ID and response; the server owns assessment, hint use, hearts, bonus timing, scores, progression, and recovery. Repeated requests cannot award progress twice. |
| **Optional AI — server-side Anthropic adapter** | Adds arithmetic stories, hints, and parent guidance around code-generated math. Numeric/format checks screen the text; missing access, failed requests, timeout, or rejected output selects authored content. The source label exposes that choice. Fraction coaching is authored. |

Fraction records live in browser storage; arithmetic records live in local SQLite. The [architecture](docs/ARCHITECTURE.md) traces both paths and their boundaries. AI does not decide mathematical correctness or game progression.

## Success criteria and evidence

| Goal | Success criterion | Evidence and status |
|---|---|---|
| **Make the math interaction reliable** | Only equivalent representations light a beacon; feedback targets a mismatch; subdivision preserves the whole and amount. | Implemented; fraction tests and documented browser walkthroughs. |
| **Reward demonstrated skill with progression** | Three consecutive unhinted correct answers at the current arithmetic difficulty unlock the next level. Easier leftover questions cannot keep unlocking levels; timing alone never unlocks one. | Implemented; progression tests and the documented three-answer level-unlock walkthrough. This is the game's performance rule; longer-term mastery is evaluated separately. |
| **Keep the record trustworthy** | Hints and retries cannot become independent success; arithmetic answers and repeated requests follow the scoring, recovery, and progression rules. | Implemented; **82 tests and 17,952 deterministic checks pass** across the release. See [QA](docs/QA.md). |
| **Support independent understanding** | On unseen tasks appropriate to the practiced skill, learners solve arithmetic or match equivalent fractions without hints and explain their reasoning; check again later with different items. | Proposed learner evaluation: record correct unassisted responses / attempted items, explanation quality, and pre/post/delayed results. No learner results yet. |
| **Make restarting manageable** | Eligible returning learners can begin appropriate practice and work through all seven questions, while feeling comfortable asking for help. | Proposed evaluation: starts / eligible return visits; all-seven-answer rate among starts; accuracy, heart endings, help use, and learner feedback. This measures continuation after a return. |

**Measure today:** the journal separates completed towers, correct first-attempt checks without help, and supported successes. Its two checks repeat, so the counts describe this session. Arithmetic records provide assessed answers, hint use, and round results. These local stores are not a cohort analytics system; learner studies and return-flow instrumentation are still to build.

**Iterate from the evidence:** observe controls first; simplify them if they block progress. If controls work but unseen equivalence tasks fail, revise the scaffold and item sequence. If returning learners start but stop early, examine difficulty, hearts, and the bonus. Observe help-seeking as well as completion—less help is not automatically better. Review AI meaning and suitability separately from its format checks. The [measurement plan](docs/PRODUCT-WALKTHROUGH.md#5-measure-and-iterate) defines the denominators and next experiments.

## Verify

```sh
npm run check:repo
npm test
npm run typecheck
npm run eval
npm run build
```

The **Verify Summit** workflow runs these checks on Node 24. See the [current verification record](docs/QA.md) for results, scenarios, and remaining coverage. These commands check software behavior and content rules; learner outcomes need a separate study.

## AI, evidence, and release scope

Numeric and format checks bound AI output, but cannot establish every story's meaning or suitability.

To try live AI, copy `.env.example` to a private `.env`, add your own `ANTHROPIC_API_KEY`, restart, and enable **For grown-ups → Optional AI features**. AI starts off. Missing access, provider failure, timeout, or rejected output uses authored content. Keep real keys out of Git and browser code; the example model alias is `claude-sonnet-4-5`.

This release covers selected elementary arithmetic skills and a Grade 4 fraction-equivalence focus; it is a scoped entry for the K–5 prompt, not a complete curriculum for every grade. It runs locally with one synthetic learner. Accounts, guardian verification, shared storage, and protected administration are needed before public multiuser use. Learning gains, delayed retention, and comeback outcomes remain to be evaluated. [Architecture](docs/ARCHITECTURE.md) and [QA](docs/QA.md) describe the practical limits.

## Built with AI, directed by a person

> I built the foundation with ChatGPT/Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine.

The alpine scenery was generated with an AI image tool; the tower, Pip, icons, and mathematical models use SVG/CSS/React. The [development record](docs/DEVELOPMENT-RECORD.md), [AI/material disclosure](docs/DISCLOSURES.md), and [artwork record](docs/ARTWORK.md) make those contributions explicit.

The project uses the [MIT License](LICENSE). Third-party materials retain their own terms; see [licensing](docs/LICENSING.md), the [dependency inventory](docs/DEPENDENCIES.md), and [package notices](docs/materials/THIRD_PARTY_NOTICES.txt). The [challenge guide](docs/HACKATHON.md) keeps submission context separate from the product walkthrough.

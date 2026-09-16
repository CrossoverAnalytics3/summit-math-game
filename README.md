# Summit

A playable elementary math prototype built around a small mountain adventure. Its featured Grade 4 route makes fraction equivalence tangible: align a symbol, a shaded model, and a point on a number line, then try two individual session checks.

![Summit's alpine island artwork](web/public/art/summit-island.png)

This repository is prepared for local evaluation and development. It has one synthetic learner and no authentication. **It is not ready to expose as a public service.** Its journal reports observed practice; it does not establish lasting mastery or measured learning gains.

## Run locally

Install **Node.js 24 or newer** and npm. The included `.nvmrc` selects Node 24 for compatible version managers. From this repository's root:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3001** on the same computer. The server serves the built browser app and creates its local SQLite database automatically. No separate database installation, account, or AI key is needed. The server binds to the loopback interface by default.

The first dependency installation needs npm-registry access unless the pinned packages are already cached. Keep development dependencies installed: the local server uses `tsx` to execute its TypeScript source. `npm ci --omit=dev` is not the supported startup recipe.

For development with automatic reload:

```sh
npm run dev
```

Open **http://127.0.0.1:5174**. Vite forwards API requests to port 3001. Stop other local copies if a required port is in use. Neither address is a public deployment link.

## Play and inspect

- **Fraction Peaks:** three authored towers connect equivalent fractions to continuous shaded models and number-line positions, followed by two individual session checks.
- **Pip's support:** deterministic strategies target the first mismatched representation; a subdivision scaffold preserves the whole and shaded amount while changing the pieces.
- **Seven arithmetic trails:** ten game levels each, seven distinct problems per round, server-owned answer checking and scoring, and persisted hint use. There is no countdown or lost-heart failure.
- **Four story worlds:** space, ocean, dinosaur, and animal stories work with authored fallback content. Optional live AI can frame arithmetic stories, hints, and parent guidance.
- **A field journal:** fraction practice, first-attempt checks without help, and supported items remain distinct. Arithmetic counts appear separately. JSON export includes a selectable-text fallback.
- **Comfort controls:** keyboard and touch controls, browser read-aloud where available, opt-in sound, motion/contrast settings, and browser-local fraction save/resume.

See the [product walkthrough](docs/PRODUCT-WALKTHROUGH.md) for a guided inspection.

## Optional live AI

AI starts **off** for the synthetic demo learner. The fraction coach is authored code and does not call a model.

1. Copy `.env.example` to `.env` and add your own `ANTHROPIC_API_KEY` privately. The example uses the configured model alias `claude-sonnet-4-5`; `AI_MODEL` can select another compatible available Anthropic model.
2. Restart the server.
3. Open **For grown-ups → Optional AI features → Enable AI**.
4. Create a story and inspect its source badge: **AI STORY · CHECKED** means the response passed the implemented checks; **OFFLINE STORY** means the authored fallback was displayed.

The server can instead load a private environment file referenced by `SUMMIT_ENV_FILE`. Existing process environment values take precedence. Never put credentials in browser code or commit `.env`.

The model supplies text. Code generates the arithmetic, checks submitted answers, and computes scores, progress, and evidence totals. Consent gates every live model route. Provider failures, an eight-second timeout, or failed numeric/format checks lead to authored fallback content. These checks do not prove the meaning or child suitability of arbitrary generated text. A historical single-request live smoke test is described in [QA.md](QA.md); the automated checks do not make model calls.

## Architecture and recorded evidence

The project uses npm workspaces:

- `web/`: React and TypeScript with Vite. Fraction content, exact equivalence checks, and session summaries run in the browser. Completed fraction sessions and an unfinished climb are stored in local browser storage.
- `server/`: Express and TypeScript. Node's built-in SQLite stores arithmetic rounds, problems, hint state, assessed results, game progression, and events. Opaque problem IDs and transactional submissions prevent duplicate progress awards.
- `server/src/ai/`: one optional Anthropic adapter plus authored fallback text and provenance checks.

The seven-day arithmetic report counts logged answers, correct answers, hint use, completed rounds, and level unlocks. Fraction records contain item ID/type, correctness, whether help was used, and attempt count, summarized once per item. These stores are separate and do not synchronize across devices.

No learning-gain study, delayed retention measurement, A/B experiment, or centralized analytics service is implemented. Arithmetic elapsed time is wall-clock round duration, capped at one hour, and can include time away from the page. See the [architecture](docs/ARCHITECTURE.md) and [server contracts](server/README.md) for details.

## Verify

```sh
npm test
npm run typecheck
npm run eval
npm run build
```

The recorded checks pass **66 tests** (56 server and 10 fraction) and **17,952 deterministic evaluation checks**. They test arithmetic/content integrity, API assessment rules, consent and fallback behavior, and evidence summaries—not educational effectiveness.

The **Verify Summit** workflow runs a fresh dependency install and those commands on Node 24 for pushes and pull requests. Local checks have been run; a hosted GitHub Actions result exists only after the workflow is uploaded and executes. See [QA.md](QA.md) for the exact verification record and limits.

## Prototype boundaries

This is a single-learner local demo. It has no account/guardian authentication, multi-user authorization, production rate limits, or public hosting. Administrative reset, event, and demo-clock routes are unauthenticated. The consent switch is a setting for a synthetic profile, not verification of a guardian's identity. Additional work is required before any public exposure or real learner use.

The three fraction towers and two checks repeat across climbs. First-attempt success without recorded help describes that session; it does not establish unseen transfer on later replays, retention, or lasting mastery. Game levels follow a progression rule. The inherited comeback rule optionally lowers practice levels after a quiet stretch; it is not a validated retention intervention.

Browser speech varies by platform. Google Fonts are requested when available, with system-font fallback. Full assistive-technology user testing has not been performed.

## Attribution and repository contents

This iteration extends a supplied Summit prototype. The [development record](docs/DEVELOPMENT-RECORD.md) distinguishes inherited work from new changes and assistance. An open-source license for the entrant's own work has **not** been selected; see [LICENSE-NOTICE.md](LICENSE-NOTICE.md).

- [Materials and AI disclosure](DISCLOSURES.md)
- [Artwork generation record](ARTWORK.md)
- [Package versions and declared licenses](DEPENDENCIES.md)
- [Collected package license texts](THIRD_PARTY_NOTICES.txt)
- [Dependency sources](docs/materials/dependency-inventory-with-sources.md)
- [Supplemental notices and unresolved license-text limits](docs/materials/supplemental-license-notices.txt)
- [Challenge context and demonstration plan](HACKATHON.md)

The uploadable source excludes installed dependencies, compiled browser output, runtime databases, private configuration, personal/interview documents, and recording binaries. Build artifacts are generated locally or by CI. No repository has been published by preparing this folder.

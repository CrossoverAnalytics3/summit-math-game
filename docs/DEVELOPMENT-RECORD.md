# SUMMIT — development in this iteration

This statement distinguishes the supplied starting project from work evidenced in the current development session. It is a technical change record, not a certification of the entrant's ownership, eligibility, or earlier project history.

The official entry window is August 27–September 18, 2026. The session's build, artwork, and verification records identify September 15, 2026; the submission audit was performed September 16, 2026 UTC. These records document this iteration. They do not establish when the supplied prototype was first authored or who contributed to it. [Official rules, §4.4](https://hackathon.nerdy.com/terms#:~:text=New%20or%20substantially%20updated%20work.)

## Starting point

The supplied Summit folder already contained:

- A React/TypeScript interface and an Express service.
- Seven arithmetic generators and ten-level progression.
- Comeback/streak behavior, event logging, and a story rollout flag.
- An Anthropic/stub adapter with story, hint, and parent-note tasks.
- Numeric/format checks and authored fallback content.
- A 43-test baseline suite.

Those capabilities were extended in this iteration. The entire product, arithmetic foundation, and model integration should not be described as having been created from scratch during this session.

## Audited comparison

The technical comparison between the supplied folder and the upgraded application found **21 added files, 16 changed files, six unchanged files, and no removed files**, excluding lockfiles and generated build outputs. This is the application snapshot audited before preparation of this submission packet; separate video and packet artifacts are not included in those counts.

All **43 original tests remain unchanged, byte for byte**. The unchanged files are:

- `server/src/events.ts`
- `server/src/flags.ts`
- `server/test/summit.test.ts`
- `server/tsconfig.json`
- `web/package.json`
- `web/tsconfig.json`

## Work added or substantially changed

| Area | Change evidenced in this iteration |
|---|---|
| Visual experience | Alpine art direction, an original generated mountain scene, responsive interface, dimensional towers, Pip, and beacon feedback. |
| Fraction learning route | Three authored towers connect symbols, continuous shaded models, and number-line positions. Two individual session checks follow. |
| Learning support | Deterministic hints target the first mismatched representation. Subdivision preserves the whole and shaded amount. Hints and retries remain distinct in the evidence. |
| Progress record | Browser-local fraction save/resume, a field journal, separate arithmetic logs, JSON export, and a selectable-text fallback. |
| Arithmetic interface | Seven-question practice routes without a countdown or lost-heart failure. Rounds use distinct problems. |
| Assessment integrity | Server-stored problem identifiers, code-owned grading and scores, persistent hint state, idempotent answer/finish requests, and no upfront answer array. |
| Progression and content | Corrected an addition-generation boundary and prevented old-difficulty questions from repeatedly unlocking higher levels. |
| Optional AI | Broader consent gating, default AI-off behavior, an implemented eight-second provider timeout, parent names excluded from prompts, meaningful themed fallbacks, and clearer source labels. |
| Local runtime | Node 24 built-in SQLite, a single-port production app, loopback default binding, and documented startup instructions. |
| Comfort and access | Named settings/dialogs, reduced motion, extra contrast, optional game sound, browser read-aloud, and touch/keyboard button controls. |
| Verification and disclosure | Additional API and fraction tests, a deterministic evaluation runner, a QA record, setup guidance, material inventory, and artwork provenance. |
| Submission demonstration | A 2:52 edited recording of actual interactions, narrative captions, an original synthesized instrumental score, a matching transcript, and production notes. |

## How the work was directed

I directed this iteration with generative AI assistance, starting from an existing supplied prototype. Codex and assisting agents contributed research, product decisions, implementation, generated artwork, testing, review, documentation, and demonstration production. This statement does not attribute earlier human work to the entrant or establish rights to the supplied baseline. The entrant should confirm that the contribution description accurately reflects their direction and involvement before submitting.

The optional runtime provider is Anthropic through its Messages API. The configured model identifier is `claude-sonnet-4-5`; it is an alias, not a verified dated model snapshot. Runtime AI frames arithmetic stories and provides optional arithmetic hints and parent guidance. Fraction feedback, arithmetic assessment, scores, progression, and evidence totals are controlled by code.

## Verification supported by the session record

- **66 automated tests passed:** 56 server tests, including the 43 preserved baseline tests, plus 10 new fraction-content/evidence tests.
- **17,952 deterministic checks passed:** 17,920 generated arithmetic cases and 32 fallback/constraint checks.
- Distinct seven-problem rounds were checked across 560 skill/level/seed scenarios.
- Browser/server type checking and a production browser build passed.
- Desktop and phone walkthroughs exercised the fraction route, support, resume, reporting, export fallback, arithmetic, and story content.
- The recorded fraction demonstration completed three towers, two checks correctly on first attempts without hints, and one tower with support.
- The final video shows a real Anthropic-generated story, its provenance, and a server-assessed answer. An earlier request used the authored fallback; the successful take is the one shown.

Provider-failure fallback was tested. An eight-second timeout is implemented, but the automated suite did not directly exercise an elapsed timeout or aborted provider request. These checks do not measure educational effectiveness, arbitrary model semantics, full assistive-technology compatibility, or production security.

## Earlier history still requiring confirmation

No Git history was present in either compared project directory. File existence and copied timestamps cannot establish original authorship, dates, contributor rights, or prior AI use. The entrant still needs to confirm:

- When and by whom the supplied prototype was developed.
- What human and AI assistance contributed before this session.
- Rights to the baseline and any earlier incorporated material.
- Whether any earlier development or testing involved real learner data.
- Whether employment, consulting, funding, or other agreements affect submission rights.

No earlier creation date or ownership history is invented here. The comparison establishes concrete changes in this iteration; it does not resolve those personal and historical facts.

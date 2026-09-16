# Verification record

Product verification was performed September 15, 2026, on Node 24 and the Codex in-app browser. The clean source copy was verified again September 16, 2026, as recorded below.

## Clean source installation and checks

The uploadable source folder was installed from its unchanged package lock on macOS with Node **24.21.0** and npm **11.19.0**. An offline-only install could not find a cached Zod archive. A subsequent `npm ci --no-audit --no-fund`, using registry access, succeeded and installed 223 packages.

The following commands then passed in that fresh folder:

- `npm test`: 56 server tests and 10 fraction tests passed.
- `npm run typecheck`: passed for the browser and server.
- `npm run eval`: 17,952 deterministic checks passed; zero failures.
- `npm run build`: the production browser bundle built successfully.

Installed dependencies and generated build/cache files were removed after verification so the uploadable folder remains source-only. No live provider call or browser play-through was repeated for this packaging check. The install did not run an npm vulnerability audit. The **Verify Summit** GitHub Actions workflow is configured for Node 24 on Ubuntu; its hosted execution has not yet been observed.

## Automated checks

- 56 server tests, including all 43 supplied baseline tests.
- 10 fraction-content and evidence-summary tests.
- 17,952 offline deterministic evaluation checks; zero failures.
- TypeScript checking for browser and server.
- Production browser build.
- Unique seven-question rounds tested across all seven skills, ten levels, and eight dispersed seeds (560 scenarios).

An eight-second provider timeout is implemented, but elapsed timeout/abort behavior was not directly exercised by the automated tests.

These checks cover arithmetic and content integrity, duplicate submission, server-owned score/answer/hint state, consent gating, simulated-provider-failure fallback behavior, request limits, privacy fields, exact fraction equivalence, unique solutions, and evidence deduplication. They do not test educational effectiveness or the full range of possible model outputs.

## Browser play-through

- Desktop home, tower, and journal inspected visually.
- Phone viewport 390 × 844: home, tower, report, settings, arithmetic, and story flows inspected. No horizontal page overflow observed; evidence table scrolls within its panel.
- All three fraction towers completed via their actual controls.
- Deliberate incorrect match produced a hint directed at the mismatched symbol layer.
- Explicit help displayed same-size-whole visual support. Subdivision preserved the continuous shaded area.
- Reload resumed the unfinished fraction route at session check one.
- Two unaided correct checks produced a report of three towers, two of two session checks, and one supported item, matching the performed actions.
- A seven-question arithmetic round included one deliberately incorrect answer and one hinted correct answer. Final result: six of seven correct and 560 server-awarded points. The journal recorded one hint and level two, as expected.
- Ocean story fallback generated a coherent three-buckets/three-shells multiplication problem. Answering nine completed the story round and appeared in the arithmetic journal.
- Settings and dialogs exposed their accessible names. Full assistive-technology user testing has not been performed.
- No browser console errors were observed during the main completed flow.
- The JSON download action was invoked, but the in-app browser did not expose a download event to the test tool. The app also exposes the complete export as selectable text in a named dialog, so evidence remains retrievable even when a browser blocks file saving. The selectable export dialog was verified in the final production build. External-browser file saving was not independently verified.

## Live model smoke test

An actual Anthropic request used the supplied private local configuration. The story described three planets with four moons each. The displayed source was `ai`; all six story checks passed. The response did not include the answer. AI consent was returned to its default off state after the test.

This one successful request verifies the configured integration for that request. It does not establish overall model reliability, semantic correctness, latency distribution, age appropriateness, or learning gains.

## Known scope

Single synthetic learner; browser-local fraction evidence and server-local arithmetic records; repeated authored fraction checks; no authentication, cloud deployment, multi-device synchronization, or research study. Live AI output validation remains a bounded prototype. The interface labels offline output honestly.

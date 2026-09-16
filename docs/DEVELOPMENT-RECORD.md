# Summit development record

## Authorship and tools

> I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine.

This is the creator's description of the work. Claude assisted with the foundation; Codex and assisting agents contributed implementation, research, tests, review, documentation, and demonstration production in the subsequent iteration. The mountain scenery came from an AI image-generation tool. [Disclosures](DISCLOSURES.md) and the [artwork record](ARTWORK.md) describe the material and tool contributions.

## Foundation

The starting Summit project supplied React/TypeScript, an Express service, seven arithmetic generators, ten practice levels, comeback/streak logic, event logging, an Anthropic/stub adapter, authored fallback stories and guidance, and a baseline test suite. That foundation supported the subsequent product work.

The inspected starting folders contained no Git history. This record identifies the implemented changes without inventing an earlier creation date. The hackathon's entry-period requirements are linked in the [challenge guide](HACKATHON.md).

## Fraction Peaks and the alpine experience

| Area | Work in the Codex iteration |
|---|---|
| Product experience | An alpine visual world, responsive layouts, dimensional tower, Pip, beacon feedback, and comfort settings. |
| Fraction mechanic | Three authored towers connect a numeric fraction, a shaded same-size whole, and a number line. Two session checks follow. |
| Support | Strategies target the first mismatched representation. Subdivision changes the parts while preserving the whole and shaded amount. |
| Evidence | Browser-local save/resume, a field journal, separate arithmetic facts, JSON export, and a selectable-text fallback. |
| Arithmetic integrity | Server-owned problem IDs, answer assessment, hint state, score, and idempotent answer/finish requests; distinct-question rounds and progression fixes. |
| AI boundary | Default-off live AI, consent gating across model routes, an eight-second timeout, themed authored fallback, and visible provenance. |
| Local delivery | Node 24 built-in SQLite, one-process serving of the built app, loopback default binding, and reproducible setup. |
| Verification | API and fraction checks, deterministic content evaluation, type/build checks, and recorded desktop/mobile walkthroughs. |

The fraction coach is authored code. Runtime AI supplies optional arithmetic stories, hints, and parent guidance; code controls mathematical assessment and evidence totals.

## Restored trail challenge and clearer comeback positioning

The current revision brings three hearts back to standard arithmetic trails. A third incorrect answer ends the round; neither a lost heart nor the end of that round lowers a level or removes history. The 120-second clock is a bonus window: completing all seven answers with a heart remaining before it closes adds 50 points, while expiry alone allows play to continue. The server uses the final assessment time rather than the Finish click. Story rounds stay untimed and heart-free, and Fraction Peaks keeps its untimed practice loop.

The optional comeback remains a separate action after five days away. It lowers arithmetic practice levels by one, with level 1 as the floor, clears the consecutive-answer run, and preserves historical records. An available streak freeze can preserve the daily streak once. This is a designed return path, with effects on retention and learning still to evaluate.

The server also supports recovery of an existing round after reload or a failed finish request. Saved rounds from the earlier format retain their original untimed, heart-free behavior. See the [server contract](../server/README.md) for the exact state and compatibility rules.

## Verification and delivery evidence

Run the commands in the [README](../README.md#verify) and consult [QA](QA.md) for the current results. Keeping totals there avoids describing an older test count as the latest release's coverage.

Earlier recorded UI demonstrations show the fraction route, assistance, session checks, journal, arithmetic story provenance, and a server-assessed answer. Individual live Anthropic responses and an authored fallback were observed. These are bounded integration observations, not a reliability benchmark or a learner study. The recordings predate the restored standard-trail hearts/bonus revision; they do not demonstrate that new contract.

No learner study, measured learning gain, delayed-retention result, or public production launch is claimed by this record. The [product walkthrough](PRODUCT-WALKTHROUGH.md) connects the implemented decisions to the next discovery and evaluation steps.

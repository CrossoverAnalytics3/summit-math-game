# Summit product walkthrough

**Fraction Peaks makes the relationship the game mechanic.** The learner turns a fraction symbol, a shaded model, and a number line until they name the same amount. Connecting the representations lights a beacon and advances the mountain expedition.

The second product idea is a welcoming return. Summit offers a clear comeback step after time away, preserving the learner's history while easing the arithmetic starting point. Together, these choices make the product about seeing a connection and finding the next manageable step.

## 1. Make equivalent value visible

From the home screen, **Let's climb** opens or resumes Fraction Peaks. Each tower has a target and three layers:

1. A numeric fraction.
2. Equal parts of a same-size shaded whole.
3. A point on a number line from zero to one.

Every layer must equal the target before the beacon lights. The three targets are one half, one quarter, and three quarters. The controls, dimensional tower, and SVG models make each representation directly inspectable.

A mismatch prompts a strategy aimed at the first incorrect layer. **Give me a little nudge** opens a visual scaffold; splitting each piece in two changes the numerator and denominator while the whole and shaded amount stay fixed. This route is untimed and heart-free, leaving room to explore the model.

Two individual checks follow, using two thirds and one third. Each accepts one answer and explains the result. The journal distinguishes completed towers, checks correct on the first attempt without help, and supported work. The same checks repeat on later climbs, so they describe the current session.

### The product hypothesis

A learner can choose a correct fraction answer without connecting the notation to the amount. Summit explores whether linking representations through one repeated action can help make that relationship understandable. This is a design hypothesis informed by the challenge, visual references, and public learning guidance; it has not yet been established through Summit customer or learner research.

The release's functional criteria are concrete: representations can be changed, equivalence is assessed exactly, feedback identifies a mismatch, the scaffold preserves the amount, and the journal reflects the actions taken. Transfer and retention require separate learning evidence.

## 2. Make returning a clear next step

After five days away, the optional comeback action offers arithmetic practice one level lower, with level 1 as the floor. It keeps past results, clears the current consecutive-answer run, and can spend one available streak freeze to preserve the daily streak. The level adjustment is explicit and chosen; it is separate from losing a heart during a round.

The intent is to offer a manageable return instead of making the learner reconstruct where to begin. Whether that choice improves return rates, confidence, or learning is a question for the next evaluation. Existing history is evidence to preserve, not a reason to claim a measured retention benefit.

## 3. Add challenge where it fits

| Route | Interaction | Feedback and progression |
|---|---|---|
| Fraction Peaks | Three practice towers, then two session checks; untimed, no hearts. | Targeted authored help, visual subdivision, beacon progress, and recorded support. |
| Arithmetic trails | Seven distinct questions, three hearts, and a 120-second bonus window. | The third wrong answer ends the round. Correct answers earn points; hints are recorded. Completing all seven answers with a heart remaining before the window closes adds 50 points. Timer expiry alone does not end play. |
| Story worlds | One arithmetic problem framed in space, ocean, dinosaurs, or animals; untimed, no hearts. | The source is visible, code assesses the answer, and optional model text has an authored fallback. |

An arithmetic answer earns 100 points when correct without a hint, 60 when correct after a hint, and zero when incorrect. The bonus uses the last answer's assessment time, so a learner can read the feedback before pressing Finish. Losing hearts never lowers a level or removes history. Three consecutive unhinted correct answers at the current difficulty advance the game level; these are game rules, not a validated mastery model.

The server stores round state and prevents duplicate answer or finish requests from awarding progress again. Recovery allows an existing arithmetic round to be retrieved after reload or an interrupted finish request. Earlier saved rounds retain their original untimed, heart-free contract.

### Decisions worth defending

| Decision | What it makes possible | Tradeoff to evaluate |
|---|---|---|
| Make equivalent representations the game action | A visible connection between interaction and mathematical meaning. | A small authored item bank limits coverage and replay interpretation. |
| Keep support visible in the journal | Adults can distinguish completion, assistance, and first attempts. | Session evidence does not establish independent transfer or retention. |
| Give comeback its own optional action | A clear, transparent starting point after a break. | The one-level adjustment may help some learners and feel unnecessary to others. |
| Separate a bonus window from round failure | Arithmetic can offer pace and stakes while allowing play after the timer expires. | Hearts and hint-point differences need observation for their effect on help-seeking and comfort. |
| Use deterministic assessment and optional AI language | The game works without a provider, and math rules are inspectable. | Numeric constraints alone cannot evaluate every generated meaning. |

Motion and contrast preferences, optional sound, browser read-aloud, and touch/keyboard controls support different preferences. Fraction sessions save locally and can be resumed. The journal exports JSON and exposes selectable text as a download fallback.

## 4. Walk through the product

This five-minute outline is for a live product review. The submission video has its own shorter plan in the [challenge guide](HACKATHON.md).

| Time | Show | Explain |
|---|---|---|
| 0:00–0:25 | Home → Fraction Peaks | One concept and one central interaction. |
| 0:25–1:25 | Set the half tower's symbol to `2/4`, leave the picture wrong, and submit. Open the nudge and split the pieces. Finish with picture `3/6` and line `4/8`. | Pip's authored strategy targets the mismatch; the amount stays fixed during subdivision. |
| 1:25–2:15 | Complete the remaining towers and two checks, then open the journal. | Explain the displayed counts and the difference between help, practice, and first attempts. |
| 2:15–2:50 | Show comeback when the demo profile is eligible. | Five days away, optional one-level adjustment, preserved history, and the available streak freeze. State clearly if a demonstration clock was used. |
| 2:50–3:35 | Start a standard arithmetic trail. Show hearts, the bonus window, and a hint. | Time expiry leaves play available; a third wrong answer ends the round without lowering a level. |
| 3:35–4:25 | Open a story world and inspect the actual provenance. Answer the displayed problem. | Stories have no timer or hearts. The text source can vary; assessment belongs to code. |
| 4:25–5:00 | Show verification commands and name the next experiment. | Distinguish tested software behavior from learning evidence still to collect. |

Do not describe a fallback story as freshly generated AI. Use the actual journal state if the demonstration differs from the planned sequence. Existing recordings predate the restored standard-trail hearts and bonus; record that interaction again if the new behavior is part of the claim.

## 5. Measure and iterate

Arithmetic events and round state are stored in local SQLite; fraction sessions are stored in the current browser. They support inspection of a demonstration, rather than a unified production analytics system.

| Signal | What it currently means | Next measurement |
|---|---|---|
| Fraction correctness, help, and attempts | Actions during each authored item in the current session. | Unseen items, representation-specific errors, and a delayed check. |
| Arithmetic answers, hints, rounds, and levels | Practice activity and game progression. | Difficulty-aware performance and effects of hearts/bonus on completion and help use. |
| Comeback action and subsequent activity | A recorded choice to adjust practice after a break. | Whether learners return, continue, and find the starting level appropriate. |
| Round elapsed time | Wall time, including time away from the page. | Durable interaction timing and a defined completion funnel. |
| AI source and applied checks | How a displayed response was produced and screened. | Semantic review, fallback reasons, latency, cost, and suitability. |

Use [QA](QA.md) for the current verification record and run the [repository checks](../README.md#verify). Test totals and a polished demonstration describe software behavior; they do not establish learning gains.

Next, speak with tutors and parents to test the assumed fraction and reporting problems. Then observe learners with appropriate consent, expand the unseen item pool, and evaluate independent transfer and delayed understanding. For comeback and arithmetic challenge, observe comfort, help-seeking, and return behavior before assuming the mechanics improve engagement or retention.

## 6. Boundaries and provenance

The fraction coach is authored and deterministic. Optional Anthropic output frames arithmetic stories, hints, and parent guidance; code owns assessment, hint state, scores, and progression. Missing access, failed requests, timeout, or rejected output produces authored content. Numeric and format checks do not establish all aspects of meaning or child suitability.

The local release uses one synthetic learner, without authenticated accounts, guardian identity verification, shared storage, or protected administration. Real deployment requires those controls. Browser-local records can be edited or cleared, the two fraction checks repeat, and full assistive-technology testing is still outstanding. See [architecture](ARCHITECTURE.md) and [QA](QA.md).

> I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine.

The [development record](DEVELOPMENT-RECORD.md), [material disclosure](DISCLOSURES.md), and [artwork provenance](ARTWORK.md) document the contributions. Start the app with the [README](../README.md).

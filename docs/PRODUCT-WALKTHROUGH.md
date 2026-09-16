# Summit product walkthrough

**Summit answers the K–5 Math Game prompt: make foundational math intuitive and engaging through mechanics that encourage progression and reward demonstrated skill.** The product loop is to explore a relationship, try it, receive useful feedback, earn progress, and apply it again. Every feature should make one of those steps clearer or more rewarding.

**Fraction Peaks makes the relationship the game mechanic.** A symbol, shaded model, and number-line point must name the same amount to light a beacon. Arithmetic trails cover addition, subtraction, place value, multiplication, and division, with levels earned through consecutive independent correct answers. The mountain makes progress visible; Pip helps recovery; the journal preserves the evidence; comeback helps a returning learner continue. These are parts of one math adventure.

## 1. Make equivalent value visible

From the home screen, **Let's climb** opens or resumes Fraction Peaks. Each tower has a target and three layers:

1. A numeric fraction.
2. Equal parts of a same-size shaded whole.
3. A point on a number line from zero to one.

Every layer must equal the target before the beacon lights. The three targets are one half, one quarter, and three quarters. The controls, dimensional tower, and SVG models make each representation directly inspectable.

A mismatch prompts a strategy aimed at the first incorrect layer. **Give me a little nudge** opens a visual scaffold; splitting each piece in two changes the numerator and denominator while the whole and shaded amount stay fixed. This route is untimed and heart-free, leaving room to explore the model.

Two individual checks follow, using two thirds and one third. Each accepts one answer and explains the result. The journal distinguishes completed towers, checks correct on the first attempt without help, and supported work. The same checks repeat on later climbs, so they describe the current session.

### The product hypothesis

A learner can choose a correct answer without understanding the number relationship behind it. Summit explores whether linking representations through play can make that relationship understandable, and whether short rounds with earned progress make further practice worthwhile. Fraction equivalence provides a concrete test of the visual mechanic. This is a design hypothesis informed by the challenge, visual references, and public learning guidance; it has not yet been established through Summit customer or learner research.

The release's functional criteria are concrete: representations can be changed, equivalence is assessed exactly, feedback identifies a mismatch, the scaffold preserves the amount, and the journal reflects the actions taken. Transfer and retention require separate learning evidence.

## 2. Practice core numeracy and earn progression

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
| Unlock arithmetic levels through consecutive unhinted correct answers | Progress rewards demonstrated performance at the current difficulty. | A short answer run needs further unseen and delayed assessment before it can support a mastery claim. |
| Keep support visible in the journal | Adults can distinguish completion, assistance, and first attempts. | Session evidence does not establish independent transfer or retention. |
| Give comeback its own optional action | A clear, transparent starting point after a break. | The one-level adjustment may help some learners and feel unnecessary to others. |
| Separate a bonus window from round failure | Arithmetic can offer pace and stakes while allowing play after the timer expires. | Hearts and hint-point differences need observation for their effect on help-seeking and comfort. |
| Use deterministic assessment and optional AI language | The game works without a provider, and math rules are inspectable. | Numeric constraints alone cannot evaluate every generated meaning. |

Motion and contrast preferences, optional sound, browser read-aloud, and touch/keyboard controls support different preferences. Fraction sessions save locally and can be resumed. The journal exports JSON and exposes selectable text as a download fallback.

## 3. Keep practice going after a break

After five days away, the optional comeback action offers arithmetic practice one level lower, with level 1 as the floor. It keeps past results, clears the current consecutive-answer run, and can spend one available streak freeze to preserve the daily streak. The level adjustment is explicit and chosen; it is separate from losing a heart during a round.

The intent is to give a returning learner a manageable next step. The offer appears after they have returned; it does not itself prompt an absent learner to come back. Evaluate whether eligible returning learners start and continue appropriate practice, how the offer feels, and whether the level choice fits. A later return-rate study would need a separate design and instrumentation.

## 4. Walk through the product

This five-minute outline is for a live product review. The submission video has its own shorter plan in the [challenge guide](HACKATHON.md).

| Time | Show | Explain |
|---|---|---|
| 0:00–0:25 | Home → Fraction Peaks | One concept and one central interaction. |
| 0:25–1:25 | Set the half tower's symbol to `2/4`, leave the picture wrong, and submit. Open the nudge and split the pieces. Finish with picture `3/6` and line `4/8`. | Pip's authored strategy targets the mismatch; the amount stays fixed during subdivision. |
| 1:25–2:15 | Open arithmetic and show three consecutive unhinted correct answers at the current difficulty, followed by the level unlock. | Core numeracy and progress earned through independent performance; hearts and a bonus add stakes. |
| 2:15–2:50 | Open the fraction journal after the towers and two checks. | Distinguish completed practice, supported success, and first attempts. |
| 2:50–3:20 | Show comeback when the demo profile is eligible. | An optional manageable restart supports continued practice. Label any use of the five-day demonstration clock. |
| 3:20–4:15 | Open a story world and inspect the actual provenance. Answer the displayed problem. | Stories have no timer or hearts. The text source can vary; assessment belongs to code. |
| 4:15–5:00 | Show verification commands and name the next experiment. | Distinguish tested software behavior from learning evidence still to collect. |

Do not describe a fallback story as freshly generated AI. Use the actual journal state if the demonstration differs from the planned sequence. Existing recordings predate the restored standard-trail hearts and bonus; record that interaction again if the new behavior is part of the claim.

## 5. Measure and iterate

### What success means now

The release must assess equivalent values exactly, target the incorrect representation, preserve the amount during subdivision, and keep hints/retries in the record. Arithmetic must enforce its scoring and progression rules, recover stored rounds, and avoid duplicate awards. AI failure must leave authored content available. These are functional acceptance criteria, supported by **82 tests, 17,952 deterministic checks, and the browser observations in [QA](QA.md)**. Coverage limits are recorded there; the checks are not learner outcome evidence.

### What the current records can tell us

Arithmetic events and round state are stored in local SQLite; fraction sessions are stored in the current browser. The journal displays counts. The ratios below define how a reviewer could summarize those records; they are not a new analytics dashboard.

| Signal | Definition and interpretation |
|---|---|
| Independent fraction check success | Unique checks correct on the first attempt without help / unique checks attempted in that session. Report the numerator and denominator; no attempted checks means no result. The same two items repeat on later climbs. |
| Supported fraction success | Count unique successfully completed items with help or a retry. This can include towers and checks; the journal's supported total is not a count of hints or a tower-only count. A tower-specific rate would filter to towers and divide by successfully completed towers. |
| Arithmetic accuracy | Correct assessed answers / assessed answers, with skill, actual problem difficulty, and hint use kept visible. Unanswered questions are excluded, and duplicate submissions do not create new attempts. |
| Arithmetic participation | Count assessed answers out of seven per standard trail. A stored finish can mean heart exhaustion before question seven. All seven assessed means the learner answered every question, not that every answer was correct or a bonus was earned. Report correctness and ending reason alongside it. |
| Comeback and timing | The stored comeback choice proves that a state change occurred. Round duration is wall time, including time away. Neither supplies a reliable return funnel or active attention measure. |
| AI provenance | The response exposes source and applied checks. An accepted response is evidence of those checks passing, not proof of correct story meaning or a model reliability rate. |

Completed fraction sessions alone cannot supply an abandonment denominator. The two stores do not establish a shared learner cohort. Lower help use is not automatically better: successful recovery and willingness to ask for support matter too.

### Next evaluation: learner understanding

First, interview tutors and parents to test the assumed problem and whether the journal answers their questions. Then observe consenting learners using the product. Keep usability and understanding separate: record whether learners can operate the first tower without an adult taking over, as well as what mathematical explanation they give.

Expand the item pool before evaluating transfer. Use different, matched items before play, immediately afterward, and at a planned delayed check, such as seven days. An individual task succeeds when the learner chooses the equivalent amount without a hint and explains that equal subdivision changes the number of pieces while preserving the whole and shaded amount. Define and review that explanation rubric with tutors before the study.

Apply the same plan to the arithmetic skill practiced: use new problems at the assessed difficulty, ask the learner to explain a suitable operation strategy, and check again later. A level unlock is a game event; the follow-up asks whether the skill can be used independently beyond that answer run.

Report unassisted correct responses / attempted unseen items, the number meeting the explanation criterion, change from baseline, and delayed performance, separated by skill and difficulty. Report missed follow-ups separately. Agree on the sample, comparison activity, and decision threshold before collecting outcomes. An early usability pilot informs revision; a claim that Summit caused learning gains needs a suitable comparison design. No learner results or validated mastery threshold are claimed in this release.

### Next evaluation: restarting after a break

Instrument eligible return visits, offer views, accept/decline decisions, new round starts, assessed answers, and outcomes. Define an eligible visit once per return session after at least five days away, so refreshes do not inflate the denominator. This instrumentation is planned, not a current product capability.

- **Restart rate:** eligible return visits with a new standard trail started / eligible return visits.
- **All-seven-answer rate:** those started trails with all seven answers assessed / those started trails. This measures participation, not winning or accuracy. A third miss on question seven means all seven were answered and hearts were exhausted; record the ending reason alongside the answer count. Define a common observation window before the study and report unfinished saved rounds separately.
- **Fit and comfort:** actual starting difficulty, accuracy, hint requests, whether the learner wanted the level change, and whether hearts or the bonus discouraged help-seeking.

Observe these flows first. If a later study compares the comeback offer with the normal return screen, assign that comparison prospectively; learners who independently accept versus decline the offer are not equivalent groups. The intervention appears after a return, so its immediate success criterion is continuation, not causing that first return.

### Turn findings into the next build

| Finding | Next change and check |
|---|---|
| Controls block learners before they can express an answer | Simplify controls or onboarding; repeat the first-tower usability task. |
| Learners finish towers but fail unseen equivalences or explanations | Revise the scaffold and item sequence; repeat the evaluation with new items. |
| Returning learners start but stop early, or dislike the automatic level suggestion | Investigate difficulty and wording; revise the offered choice and reassess comfort and completion. |
| Hearts, timing, or hint-point differences discourage help or continued practice | Change the incentive and observe help-seeking alongside accuracy and completion. |
| AI passes format checks but changes the story's mathematical meaning | Add the example to a reviewed semantic evaluation set, tighten the prompt/checks or use authored text for that case, and recheck. |

For AI, collect reviewed meaning/suitability judgments plus fallback reasons, latency, and cost before claiming model quality or efficiency. Aggregate reporting is still to build. After each product change, rerun the relevant [software checks](../README.md#verify) and revisit the learner task that motivated it.

## 6. Boundaries and provenance

The fraction coach is authored and deterministic. Optional Anthropic output frames arithmetic stories, hints, and parent guidance; code owns assessment, hint state, scores, and progression. Missing access, failed requests, timeout, or rejected output produces authored content. Numeric and format checks do not establish all aspects of meaning or child suitability.

The local release uses one synthetic learner, without authenticated accounts, guardian identity verification, shared storage, or protected administration. Real deployment requires those controls. Browser-local records can be edited or cleared, the two fraction checks repeat, and full assistive-technology testing is still outstanding. See [architecture](ARCHITECTURE.md) and [QA](QA.md).

> I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine.

The [development record](DEVELOPMENT-RECORD.md), [material disclosure](DISCLOSURES.md), and [artwork provenance](ARTWORK.md) document the contributions. Start the app with the [README](../README.md).

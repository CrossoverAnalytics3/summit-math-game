# Summit product walkthrough

Summit turns equivalent fractions into a small mountain expedition. The learner aligns a symbol, a picture, and a number-line point to represent the same amount, gets help when needed, and finishes with two session checks. Seven arithmetic trails and optional themed stories extend the supplied project.

This guide follows the product work from defining a problem through measuring and improving the result. It describes the implemented prototype and identifies hypotheses that still need testing.

## 1. Define the problem and success

The design problem is concrete: can a game make the relationship between equivalent fractions visible through its actions? A learner may recognize `1/2` without connecting it to `3/6` shaded on a same-size whole or `4/8` on a number line. Summit asks for those connections in one central object.

The featured route is deliberately narrow: three Grade 4 practice towers, followed by two one-answer session checks. It is not a complete K–5 curriculum. The broader arithmetic trails preserve the starting project's seven skills and ten game levels.

**Current success criteria are functional:** each representation can be manipulated, equivalence is checked exactly, feedback points to a mismatch, help changes the visual explanation, and the journal describes the learner's actual actions. Those behaviors have recorded engineering and browser verification.

**The learning hypothesis remains unproven:** using the same amount in several forms may help learners explain equivalence and apply it to new examples. A completed tower or two correct answers does not establish that outcome. Alternate items, delayed checks, and consented learner observation are future work.

## 2. Build the learning interaction

### The fraction climb

From the alpine home, **Let's climb** opens or resumes Fraction Peaks. Each practice tower has three layers with arrow controls:

1. A fraction symbol.
2. Equal parts of a shaded, same-size whole.
3. A point on a number line from zero to one.

All three must equal the target before the beacon lights. The targets are one half, one quarter, and three quarters. The tower uses CSS dimensional styling and SVG mathematical models; its choices are authored, finite content.

An incorrect match gives a strategy for the first mismatched representation and allows another try. **Give me a little nudge** opens a scaffold. Splitting every piece in two changes both numerator and denominator while preserving the whole and continuous shaded amount. The learner can see what changed and what stayed the same.

The route then presents checks for two thirds and one third. Each accepts one answer, locks the response, and explains the result. Help is available and recorded. The journal counts a check as independent only when it was correct on the first attempt without help. The same questions repeat on later sessions, so the interface explicitly avoids a retention or mastery claim.

### Decisions and tradeoffs

| Decision | Why it matters | Current tradeoff |
| --- | --- | --- |
| Make matching equivalent amounts the central action | The game action carries the mathematical idea. | Three authored towers allow careful review but limited content coverage. |
| Separate practice, help, and first-attempt checks | The journal can explain what happened instead of inflating a completion score into a learning claim. | Two repeated checks are a narrow session signal. |
| Use deterministic math and optional AI language | Answers, equivalence, score, and progression do not depend on model judgment. | Text constraints catch some failures; they do not establish semantic correctness or suitability. |
| Remove countdown and lost-heart mechanics | The interface leaves room to inspect and retry a representation. | The intended effect on comfort or learning has not been measured. Arithmetic still awards fewer points after a hint. |
| Preserve and export the session | Reloading can resume a fraction climb; the journal makes the evidence inspectable. | Fraction data stays in one browser; arithmetic data stays on the local server. |

### Arithmetic and stories

The home also offers seven arithmetic trails. A standard round contains seven distinct problems at the learner's current game level. The server owns the problems, answers, hint state, score, and completion. Each problem has one assessed response; an incorrect answer reveals the expected answer and guidance before the next problem.

Story mode offers space, ocean, dinosaurs, or animals and creates a one-problem round. With optional AI enabled and a configured provider, the model can write the framing. Otherwise, built-in stories keep the local game usable. The screen identifies the actual source and exposes the checks applied. The fraction coach always uses authored strategies.

Motion and contrast preferences, optional sound, browser read-aloud, named dialogs, and touch/keyboard controls support the experience. These features have implementation and browser checks; they have not undergone a full assistive-technology study.

### What existed and what this version adds

The supplied Summit baseline already had the React/TypeScript and Express structure, arithmetic generators, progression, comeback/streak logic, events, story rollout, model adapters and fallback templates, and 43 tests.

This version adds the alpine visual system and generated hero artwork; fraction towers, scaffold, session evidence, resume and export; revised arithmetic presentation; distinct-question rounds and stronger server-owned assessment; consent gating and clearer AI provenance; and additional tests and packaging. Codex and assisting agents contributed research, design, implementation, testing, artwork, and documentation. See [materials and AI disclosure](../DISCLOSURES.md) and [artwork provenance](../ARTWORK.md).

## 3. Ship a reviewable experience

The app runs locally on Node 24. A production browser build can be served by the same Express process as the API. Follow the [repository setup instructions](../README.md); the game does not require an AI key, although the local server is still required. This is not an installed offline/PWA product or a deployed multi-user service.

The seeded profile is synthetic. AI is off by default. The grown-up setting demonstrates consent state but does not verify guardian identity. There is no authentication, cross-device synchronization, or production authorization. See [architecture and boundaries](ARCHITECTURE.md).

### Five-minute product demonstration

This walkthrough is for a live review. It is separate from the shorter submission video. Use a fresh browser fraction session for the stated sequence, or explain the actual resumed state.

| Time | Action | Point to make |
| --- | --- | --- |
| 0:00–0:30 | Home → **Let's climb** | One focused learning objective in a visually coherent game. |
| 0:30–1:40 | Set the half tower's symbol to `2/4`, leave a picture incorrect, and submit. Request a nudge and split the pieces. Finish with picture `3/6` and number line `4/8`. | The feedback addresses a representation; subdivision preserves the amount. Help will appear in the evidence. |
| 1:40–2:25 | Complete the quarter tower with `2/8`, `3/12`, `1/4`; then the three-quarter tower with `6/8`, `9/12`, `3/4`. | These are authored choices across the same three representations. |
| 2:25–3:00 | Answer the checks with `4/6` for `2/3`, then `4/12` for `1/3`, without help. | One answer per check. These are session observations, and the items repeat on replay. |
| 3:00–3:35 | Open the journal and download/export dialog. | This exact run should show three towers, two correct unassisted checks, and one supported item. Describe the displayed counts if your actions differ. |
| 3:35–4:25 | Choose a story world, open provenance, answer the current problem, and finish. | Read the actual AI/offline source label. The operands vary; code supplies and assesses the math. |
| 4:25–4:45 | Start an ordinary arithmetic trail and show its seven-stop counter and a hint. | Demonstrate one problem; a full round need not fit this interval. |
| 4:45–5:00 | Show motion/contrast settings and name the next priorities. | The prototype is complete enough to inspect, with explicit scope and evidence limits. |

If a live provider is used, configure it privately and enable the demo consent setting before that portion. A fallback is a valid result to demonstrate; do not describe an offline story as freshly generated AI.

### Failure behavior is part of the product

- A wrong tower match produces targeted feedback and permits practice; a later success after a retry is recorded as supported.
- Reloading an unfinished fraction climb resumes it in the same browser when storage is available.
- Duplicate arithmetic answer or completion requests return the original result without awarding progress again.
- Missing, failed, or rejected model output falls back to authored content with the actual source shown.
- An empty journal says there are no results. An unavailable arithmetic report offers a retry.
- Export prepares a JSON file and also exposes selectable text when the browser does not save it. External-browser file saving was not independently verified.

## 4. Measure what the product actually records

The latest fraction session appears separately from the arithmetic seven-day log. The export contains stored fraction sessions, currently available arithmetic facts, and guidance provenance. It is an inspectable demo record, not a school record or validated assessment.

| Available now | Appropriate interpretation | Proposed measurement, not yet established |
| --- | --- | --- |
| Fraction item, correctness, assistance, attempts | What happened during practice and each check in that session | Alternate unseen items, representation-specific errors, delayed checks |
| Arithmetic attempts, correct answers, hints, levels, rounds | Practice activity and game progression | Difficulty-aware transfer and a defined learning assessment |
| Round start-to-finish elapsed seconds | Wall time, including idle time | Interaction-based duration and an instrumented completion funnel |
| Provider, prompt version, field names, checks, final source | How one displayed response was produced | Aggregate fallback reasons, latency percentiles, cost, semantic/suitability review |
| Browser and control verification | Whether the checked flows worked | Consented learner/guardian usability and assistive-technology testing |

Recorded verification includes 66 tests, 17,952 deterministic offline checks, 560 distinct-round scenarios, type checking, a production build, and desktop and phone play-throughs. These establish bounded engineering evidence. They do not demonstrate learning gains, retention, child engagement, or broad model reliability. See the [verification record](../QA.md) for the tested scenarios and limits.

## 5. Iterate on the riskiest assumptions

Begin with tutor and parent conversations to test whether the assumed fraction difficulty and reporting need are the right problems. Use those findings to define the next study and its success criteria; no such customer discovery has been completed for Summit yet.

1. **Broaden the evidence before the claim.** Add parallel fraction items and representation-level error recording. Test delayed performance before suggesting retention or mastery.
2. **Observe the learner.** With appropriate consent, test whether children understand the task, notice the invariant, and use help comfortably. Investigate whether arithmetic's hint-point difference discourages help.
3. **Evaluate generated language.** Review semantic operation match, written-out answer leaks, suitability, fallback reasons, latency, and cost. Keep deterministic fallback available.
4. **Prepare real deployment boundaries.** Replace the synthetic identity, restrict demo administration routes, define consent and retention, and design authorized shared storage before a multi-user release.

The next decision should follow those observations, rather than adding more effects or claiming success from a completed demo.

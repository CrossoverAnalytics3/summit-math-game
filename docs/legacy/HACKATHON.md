# Summit challenge and demonstration guide

## Selected prompt: K–5 Math Game

> Develop an interactive, gamified math experience tailored for elementary students that makes foundational arithmetic concepts both intuitive and engaging.
>
> We're looking for: innovative mechanics that encourage steady progression and reward mastery of core numeracy skills.

This selected brief guides the product, README, and demo. Summit's promise is a math adventure where learners explore relationships, practice, get useful feedback, and earn their next step. Fraction Peaks is the visual lead; the arithmetic skill ladder shows progression; Pip, stories, the journal, and comeback support that journey.

## How the experience answers the prompt

| Prompt requirement | What the working product demonstrates |
|---|---|
| **Foundational arithmetic for elementary learners** | Seven trails cover addition/subtraction within 20 and 100, place value, multiplication, and equal-sharing division. Fraction Peaks adds a Grade 4 equivalence focus. This is selected skill coverage within the K–5 brief. |
| **Intuitive interaction and innovative mechanics** | Turning a symbol, shaded model, and number-line point until they agree is the action that lights a beacon. Pip identifies a mismatched representation; subdivision shows why changing the pieces can preserve the amount. |
| **Engaging play** | An alpine expedition, visible beacons, short rounds, points, hearts, a completion bonus, and four story worlds create reasons to keep exploring. Engagement is a design intention to evaluate with learners. |
| **Steady progression** | Three consecutive correct arithmetic answers without hints at the current assessed difficulty unlock the next level. Ten practice levels use skill-specific number ranges; some ranges repeat or reach a cap. Saved state lets practice continue. |
| **Reward mastery of core numeracy** | Independent correct answers earn 100 points; supported correct answers earn 60. Independent performance unlocks levels. The journal preserves help and first-attempt evidence. Unseen and delayed tasks are the next check of whether that performance reflects durable understanding. |

Keep the distinction between rewards clear: a beacon rewards correct representation matching, arithmetic level unlocks reward the independent answer run, and the timed bonus rewards timely round completion. The timer does not assess mastery. Fraction progress and arithmetic levels are separate routes; the demo should not imply that one unlocks the other.

## The product story

Lead with **Fraction Peaks**: a learner aligns a fraction symbol, a shaded whole, and a number line to light a beacon. Show a deliberate mismatch, Pip's authored strategy, and a subdivision that changes the parts while preserving the amount. Finish with the checks and journal, where help and first attempts remain distinct.

Next show **arithmetic progression**: answer three problems correctly without hints at the current level and show the next level unlock. Name the core arithmetic skills. This makes the prompt's progression and reward requirements visible, beyond a score counter.

Show **comeback** briefly as support for continued practice. After five days away, the optional action lowers arithmetic practice by one level, with level 1 as the floor, preserves history, and can use an available streak freeze. It supports a learner who has returned; its effect still needs evaluation.

Arithmetic trails add three hearts and a two-minute bonus window; the third wrong answer ends the round, while timer expiry alone allows play to continue. Completing all seven answers with a heart remaining before the window closes earns 50 bonus points. Story rounds and Fraction Peaks remain untimed and heart-free.

## Suggested description

Summit is a mountain adventure built for the K–5 Math Game challenge: make foundational math intuitive and engaging, with progress earned through demonstrated skill. Its signature mechanic is Fraction Peaks, where learners turn a fraction symbol, shaded model, and number-line point until all three describe the same amount. Pip's authored strategies guide recovery, and a subdivision scaffold shows why the amount stays the same.

Seven arithmetic trails cover addition, subtraction, place value, multiplication, and division. Three consecutive unhinted correct answers at the current difficulty unlock the next game level. Points, hearts, and a completion bonus add stakes; four story worlds offer untimed contextual problems. The journal separates supported practice from independent first attempts, and an optional comeback step offers a manageable restart after a break. Optional AI supplies arithmetic language, while code generates and assesses the mathematics and identifies whether text came from the model or authored fallback.

I built the foundation with Claude, then iterated with Codex. AI coding tools did most of the typing; the product decisions, the thesis, and the review were mine. The Codex iteration added the alpine world, Fraction Peaks, reporting, assessment protections, AI boundaries, verification, and documentation. The scenery is AI-generated; its provenance and the incorporated materials are disclosed.

The app is a working local prototype with reproducible software checks. Next I would test the assumed problems with tutors, parents, and learners, expand the unseen item pool, and evaluate independent transfer, delayed understanding, and the experience of returning. No learning gain or retention effect has yet been measured.

## A suggested demonstration under three minutes

The times below are an editorial plan, not an official judging formula. Match every claim to the footage actually recorded.

| Time | Show | Main point |
|---|---|---|
| 0:00–0:23 | Home and first fraction tower | The selected K–5 prompt, answer-only practice problem, and math adventure. |
| 0:23–0:49 | Turn the layers, leave a mismatch, use Pip's nudge, and subdivide the whole. | The relationship is the mechanic; feedback makes another attempt understandable. |
| 0:49–1:15 | Arithmetic skill choices and three independent correct answers; show the next level unlock. | Core numeracy, steady progression, and rewards tied to performance. Hearts and the bonus are supporting stakes. |
| 1:15–1:29 | Eligible comeback action and its stated adjustment. | Continued practice after a break; label the five-day demonstration simulation. |
| 1:29–1:46 | Fraction journal after the towers and checks. | Supported work and independent success remain distinct. |
| 1:46–2:16 | Actual arithmetic story/source panel and a short architecture overlay. | Browser fraction route, server arithmetic assessment, optional AI language and fallback. |
| 2:16–2:30 | Return to the product. | Disclose AI-assisted development and product ownership. |
| 2:30–2:56 | Verification label and product close. | Tested software behavior, then unseen/delayed learner tasks and the next iteration. |

An earlier 2:52 captioned recording and a 2:56 narration-ready edit demonstrate the fraction route, journal, and successful AI story. They predate the restored standard-trail hearts/bonus revision and do not show the current comeback story as this plan proposes. Do not relabel them as demonstrations of features absent from those recordings.

## Published challenge requirements

The math prompt emphasizes an engaging elementary experience, inventive mechanics, progression, and numeracy mastery. Summit's tower and arithmetic level-unlock rule lead the response; feedback, the journal, and comeback support it. The mapping above explains product alignment, not a weighted judging rubric. [Official challenge](https://hackathon.nerdy.com/)

The official rules require a functioning learning experience, a written description, a demonstration video of at most three minutes, and applicable material/AI disclosures. Repository and deployment links are optional. Judges need not run the app, and no weighted rubric is published. The published deadline is September 18, 2026, at 11:59 PM Central; maintain evaluation access through September 23. [Official rules, sections 1, 4, and 6](https://hackathon.nerdy.com/terms)

The terms also cover incorporated materials, licenses, and ownership assignment on submission. Use the actual rules for eligibility and submission decisions. This guide is preparation, not a submission or acceptance of the terms. [Official rules, section 7](https://hackathon.nerdy.com/terms)

## Evidence and materials

- [QA](QA.md): current software checks, browser observations, and coverage limits.
- [Development record](DEVELOPMENT-RECORD.md): foundation, later iteration, and tool contributions.
- [Disclosures](DISCLOSURES.md) and [artwork record](ARTWORK.md): AI assistance, imagery, fonts, and runtime model use.
- [Licensing](LICENSING.md), [dependency inventory](DEPENDENCIES.md), and [notices](materials/THIRD_PARTY_NOTICES.txt): project and incorporated-material terms.

Use synthetic demonstration data, record the actual AI/offline source label, and keep private configuration out of submission files. Test the final build and review the video against it before submitting. The fraction coach is authored; numeric checks do not establish arbitrary model meaning; repeated session checks do not establish mastery.

## Learning-design references

- Grade 4 standard 4.NF.A.1 explains fraction equivalence through visual models: part counts and sizes change while the value stays constant. [Common Core Grade 4 fractions](https://www.thecorestandards.org/Math/Content/4/NF/)
- Number lines and conceptual explanations inform the linked models and scaffold. [IES fractions practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/15)
- Connecting concrete and abstract forms, practice followed by independent problems, and explanatory questions inform the sequence. These references support the design direction; they are not evidence of Summit's educational effectiveness. [IES learning practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1)

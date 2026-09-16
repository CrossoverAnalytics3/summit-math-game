# SUMMIT — submission and demonstration guide

## What this version demonstrates

SUMMIT is a K–5 math prototype built around a mountain expedition. Its featured Grade 4 route asks learners to connect fraction symbols, shaded models, and positions on a number line. Three guided towers lead to two individual session checks. Pip offers short strategies tied to the first mismatched tower layer, and a visual scaffold shows how subdividing a whole changes its pieces while preserving the amount.

The surrounding experience includes seven arithmetic trails, four story themes, read-aloud controls, optional sound, motion and contrast settings, saved browser-local fraction sessions, and an exportable field journal. Arithmetic assessment and progression are handled by the server. The journal separates completed fraction practice, first-attempt answers without hints in the current session, and items solved with help or retries.

The fraction questions repeat on subsequent climbs. The two checks are different from the guided tower items, but they are not unseen questions on every visit. Session results are observations of play, not evidence of lasting mastery or measured educational impact.

## Suggested submission description

SUMMIT turns elementary math practice into a small mountain adventure. The featured Fraction Peaks route makes one idea tangible: a fraction can have different representations while keeping the same value. Learners align a numeric fraction, a shaded model, and a number-line point; ask Pip for a strategy when they need one; explore a subdivision model; and complete two individual session checks.

I directed this iteration with generative AI assistance, starting from a supplied React/TypeScript prototype with an Express and SQLite service for arithmetic practice. Codex assisted with product decisions, implementation, artwork, testing, and documentation. This iteration adds the alpine visual direction, custom generated scenery, fraction tower route, visual supports, accessibility controls, and a field journal that separates supported practice from first-attempt answers without hints. It also strengthens the arithmetic service, which generates and assesses the math in code and records progression from game events. The [development record](docs/DEVELOPMENT-RECORD.md) distinguishes the supplied foundation from this iteration.

An optional model adapter supports short arithmetic stories, hints, and parent guidance. It checks selected numeric and format constraints and falls back to authored content. The fraction coach is authored and rule-based. These checks do not verify every aspect of generated meaning. Individual live Anthropic responses were observed in the integration check and final demonstration; another request used fallback. Next I would broaden the content bank and model evaluation set, test with assistive-technology users, and study understanding and retention through an appropriately governed future evaluation.

Before submitting, make the first-person development statement match your actual work and disclose the tools, source materials, and contributions you used. Verification and its limits are documented in QA.md. The actual produced demonstration is 2 minutes 52 seconds; the timeline below is the earlier suggested recording plan.

## AI status and accurate claims

- The fraction tower, its targeted strategies, and the visual scaffold are deterministic. Do not call Pip in that route a live AI tutor.
- The arithmetic service contains an optional Anthropic adapter. Without a configured key, it uses authored stories, hints, and guidance. Provider failures or failed checks also use the fallback.
- The UI displays story and parent-note provenance. A fallback label means the displayed text is authored content, even when AI features are enabled for the demo profile.
- One real Anthropic space story was generated on September 15, 2026 and accepted after all six checks. This confirms the integration for that request, not broad model reliability or semantic accuracy.
- Numeric checks and answer computation are concrete safeguards. They do not establish semantic correctness, child suitability, or learning effectiveness for arbitrary model text.
- The demo consent switch is a settings demonstration for a seeded profile. It does not verify guardianship or establish production consent.

## A 2 minute 50 second demonstration

| Time | Show | Suggested narration |
|---|---|---|
| 0:00–0:15 | Alpine home and Fraction Peaks | “SUMMIT makes one Grade 4 idea visible: different fractions can name the same amount.” |
| 0:15–0:45 | First tower: turn symbol, picture, and number-line layers | “Every layer has to agree. The child connects a symbol to an amount and a position, then lights a beacon.” |
| 0:45–1:15 | Make a mismatch, ask for a nudge, open the subdivision support | “Pip responds to the first mismatched representation. Here, the pieces change while the amount stays fixed.” |
| 1:15–1:40 | Remaining route and two session checks; a brief transition cut is fine | “After guided practice, the learner tries other fractions. Help remains available and is recorded.” |
| 1:40–2:05 | Field journal and export | “The journal separates practice from first-attempt answers without hints in this session. These questions repeat, so this is not a lasting mastery score.” |
| 2:05–2:35 | A themed arithmetic story, its provenance, and an answer | “Code owns the numbers and assessment. The optional model writes the framing. This label tells you whether the current story came from the model or the authored fallback.” |
| 2:35–2:50 | Return to the mountain; show one settings control if useful | “Next I would expand the content, evaluate generated text, and test whether children can explain the idea later.” |

Show the provenance that actually appears. If it says offline story, narrate it as the fallback. Keep any feature that has not been demonstrated out of the recording's present-tense claims.

## Alignment with the published challenge

The math prompt emphasizes an engaging elementary experience, inventive mechanics, progression, and numeracy mastery. The tower mechanic, calm recovery loop, and transparent session evidence are our response to that brief. [Official challenge](https://hackathon.nerdy.com/)

There are no published judging weights. Judges retain discretion and need not run an entry. A complete, legible recording is therefore our recommended presentation strategy, not an official scoring formula. Required materials include a working learning experience, a description, a video of at most three minutes, and third-party/AI disclosures; source and deployment links are optional. The published deadline is September 18, 2026, at 11:59 PM Central. Keep evaluation access available through September 23. [Official rules, sections 1, 4, and 6](https://hackathon.nerdy.com/terms)

The rules also require identifying incorporated materials and licenses and describe an ownership transfer on submission. Review the full terms before submitting; this guide does not submit or accept them for you. [Official rules, section 7](https://hackathon.nerdy.com/terms)

## Learning-design references

- Grade 4 standard 4.NF.A.1 connects equivalent fractions to visual models and explains how the part count and size can change while the fraction's value stays constant. This is the scope of Fraction Peaks. [Common Core Grade 4 fractions](https://www.thecorestandards.org/Math/Content/4/NF/)
- The IES fractions guide recommends number lines and understanding why fraction procedures work. These recommendations support the linked number-line representation and subdivision scaffold. [IES fractions practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/15)
- The IES learning guide recommends connecting concrete and abstract representations, examples followed by independent problems, retrieval, and explanatory questions. These principles informed the practice/check distinction; they do not validate SUMMIT's effectiveness. [IES learning practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/1)

## Before recording and submitting

1. Start with a clean demonstration state so the recording shows the intended learning sequence. Completed sessions are stored in the browser; arithmetic history belongs to the local demo server.
2. Verify the full route, report, export, arithmetic round, and story fallback. Test any live provider separately and record its actual provenance.
3. Include the entry-period change summary, dependency/license inventory, font and artwork disclosures, and the nature and extent of generative-AI assistance. The custom scenery's generation record is in `ARTWORK.md`.
4. Use a synthetic demonstration profile. Do not invent learner-testing results or imply that a game-level unlock is a validated mastery finding.
5. Check that the video is under three minutes and accessible to judges. Review the submission description against the final working build, then keep the submitted version stable after the deadline.

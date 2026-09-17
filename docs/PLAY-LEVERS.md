# Play levers: Fix Pip’s homework and Your rules

Two additions let a child shape practice and inspect someone else’s reasoning, while the server retains mathematical authority.

## Fix Pip’s homework

From an arithmetic skill sheet, choose **Fix Pip’s homework**. Three worked problems appear; exactly one has a planted error. The child finds the slipped card, chooses a reason, and enters a corrected answer. The result records three distinct facts: **found the slip, named the reason, fixed the answer**.

The worksheet uses the same skill generators and the learner’s current level. It is a **new generated worksheet**, not a replay of the child’s actual work. A caller may request a supported slip through `POST /api/homework { skill_id, slip }`; the generator prioritizes it when it fits the numbers. The interface does not yet read session notes or infer a child’s misconception. Automatic session-to-worksheet matching is future work.

The server stores the answer key, checks the submission once, and preserves the response. Retries return the same result. Finding the wrong card cannot earn a successful explanation or correction through a coincidentally matching value. A completed record contains the displayed problems and work, selected card, selected reason, submitted answer, and separate outcomes. Older records without the original response are marked as such.

The **teaching journal and tutor brief** show these worksheet facts with links to the underlying worksheet. They remain separate from expedition runs and their two-observation interpretation rule. The parent report also summarizes the three facts. Reading Pip’s worked steps is support, so worksheet success does **not** advance the trails’ independent-answer mastery ladder.

Design hypothesis: examining and repairing a character’s mistake may create a useful, less personal way to discuss reasoning. This prototype has not tested whether children find it easier, more enjoyable, or more effective than other practice. A pilot should compare the child’s explanation and a later unaided problem, while recording the support shown.

## Your rules

Before an arithmetic trail starts, children choose hearts (three or one), bonus clock (on or off), difficulty (easier, current level, or harder), and a digit to avoid (5, 7, or 9). Preferences are saved per skill in the browser and sent to the server with the round. The server bounds them and generates a matching set.

- Easier mode stays practice even when the learner is already at level one. It preserves the existing mastery streak and cannot unlock a level.
- Current or harder problems can contribute to the existing independent-answer progression rule. Hint-assisted answers do not qualify.
- Clock off removes the deadline. Clock on rewards speed only; expiry does not end the round.
- A depleted heart count ends a round, not a level. Choosing one heart is optional.
- The excluded digit is filtered from the generated problem’s numbers and answer. If the bounded generator cannot fill the round, it returns an error rather than silently breaking the rule.

These choices create room for experimentation within mathematical rules. They are not a diagnosis of a preferred learning style and are not evidence of improved retention.

## Implementation

`shared/homework.ts` builds and assesses deterministic worked examples. `server/src/homework.ts` generates and stores worksheets, keeps keys private until completion, and records results. `web/src/Homework.tsx` guides Find → Explain → Fix and preserves input when submission needs a retry. Keyboard users can navigate worksheet cards with arrow keys; saved-rule changes retain focus.

`GET /api/homework/evidence` provides completed worksheet evidence to the local journal. It does not expose pending answer keys. The existing single synthetic learner and local-server boundary still apply; this is not an authenticated classroom service.

For current automated and browser results, see [VERIFICATION.md](VERIFICATION.md).

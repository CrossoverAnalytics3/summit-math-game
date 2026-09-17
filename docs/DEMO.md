# Three-minute demo — play, teach, inspect

Target **2:55**. The accompanying silent walkthrough uses genuine captures of the running v0.5.3 app, edited with cuts and held frames for narration. It shows synthetic demonstration records, not a child study. The footer identifies each scene; there is no generated narration.

## Screen sequence

| Time | Scene | Point |
| --- | --- | --- |
| 0:00–0:14 | Original mountain, route choice, brief tutorial | A child’s reasoning should be visible through play. |
| 0:14–0:31 | Teach four each; twelve berries / three friends | The instruction is executable, and prediction is separate. |
| 0:31–0:52 | Fourth friend joins; fixed four fails; picture and revision | A changed situation creates a reason to rethink. Support is recorded. |
| 0:52–1:05 | Keep repeated sharing for eight berries / four friends; summit | A rule can travel to another situation. |
| 1:05–1:21 | Four-question tutor brief | Observations link to records, with uncertainty and support visible. |
| 1:21–1:38 | Mark one attempt as a demonstration system issue; inspect trace | Preserve the observation, withdraw dependent questions. |
| 1:38–1:56 | Child’s rules, then the actual untimed practice round | Agency inside bounded rules; easier stays practice. |
| 1:56–2:23 | Find the homework slip, choose a reason, enter correction | Three distinct actions, with support visible. |
| 2:23–2:43 | Result → journal → worksheet evidence | Tutor can inspect the child’s exact response and original page. |
| 2:43–2:55 | AI boundary / product finish | What code owns, and what to test next. |

## Talk track

“Summit starts with a simple problem: a right answer can hide how a child thinks. I wanted to make that thinking visible through play, while giving parents and tutors evidence for a better conversation.

The child leads Pip and friends up a mountain. They choose a route, teach a sharing instruction, and predict what a fair share would be. Here, four berries each works for twelve berries and three friends. Pip follows the instruction we actually chose.

Then another friend joins. The same fixed amount leaves someone out. The child can inspect the bowls, open support, and revise. I change the teaching to one berry each, then repeat. That decision changes the outcome, and the support stays in the record.

Now there are eight berries and four friends. The same repeated-sharing rule works again. That is a transfer example within this expedition; it is not proof of lasting mastery.

The tutor’s brief asks four questions: what was demonstrated, what is uncertain, what support appeared, and what to ask next. Each observation leads back to its evidence.

Here I’m demonstrating the system-issue reporting path. If Pip or the interface misunderstood, the learner can say so. The replay remains, but that attempt is excluded from learner conclusions and dependent questions are withdrawn.

Play also needs room for ownership. On the arithmetic trails, children choose hearts, a bonus clock or no clock, difficulty, and a digit to leave out. The server enforces those rules. Easier rounds stay practice, even at level one.

In Fix Pip’s Homework, the child becomes the reviewer. Three worked problems contain one planted slip. Find it, choose why, and fix the answer. This is a new worksheet at the same skill and level; matching mistakes from a child’s actual session is a next step.

The journal keeps finding, naming, and fixing separate. The tutor can inspect the page and the child’s exact response. Because worked steps provide support, worksheet success does not inflate independent trail mastery.

Code owns math, scoring, and evidence. Optional AI selects bounded coach content. Next: test children’s unaided explanations and whether these records help tutors choose better questions.”

## Honesty and recording notes

- The demo correction is explicitly labeled. Fixed-four behavior is mathematically expected; do not narrate it as an actual software bug.
- No live AI provider is used in the capture. Authored content keeps play working with AI off.
- Choosing a reason from chips is recognition, not an independently composed explanation.
- Journals use one local synthetic learner on SQLite. No authenticated tutor/classroom account claim.
- The worksheet key and generator seed are not sent before submission. Completed evidence includes checked answers so an adult can inspect the result.
- Earlier worksheets may lack the exact response. Those missing values are shown as unknown, never invented.
- The new rule choices apply to the next new arithmetic round; resuming a saved round keeps that round’s original rules.
- Proposed learning and usability criteria are in [PRODUCT-GUIDE.md](PRODUCT-GUIDE.md). Test results are in [VERIFICATION.md](VERIFICATION.md).

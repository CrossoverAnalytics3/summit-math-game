# Submitted demo — Teach the Climb

**[Watch / download the submitted video · 2:57](demo/summit-submitted-demo.mp4)**

This is a web-compatible copy of Chris Conyers' submitted `NerdyHackSubConyers.MP4`, including its supplied audio. Duration: **2:56.633**; picture: **1920 × 1080**. It presents the v0.5.3 experience. The application and environment are unchanged by this documentation update.

The footage uses captures of the running product with cuts and held frames for narration, and synthetic demonstration records. The original production guide below describes the intended screen sequence and talk track; it is not a verbatim transcript of the submitted narration.

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

## Production talk track

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

## Capture notes and feature scope

- The demo correction is explicitly labeled. Fixed-four behavior is mathematically expected; do not narrate it as an actual software bug.
- The walkthrough was prepared with authored content. The application also implements optional runtime AI: expedition coaching selections and generated arithmetic stories, hints, and parent notes. See the [AI contracts](ARCHITECTURE.md#generative-ai-in-arithmetic-activities) for what each feature does and how outputs are checked.
- Choosing a reason from chips is recognition, not an independently composed explanation.
- Journals use one local synthetic learner on SQLite. No authenticated tutor/classroom account claim.
- The worksheet key and generator seed are not sent before submission. Completed evidence includes checked answers so an adult can inspect the result.
- Earlier worksheets may lack the exact response. Those missing values are shown as unknown, never invented.
- The new rule choices apply to the next new arithmetic round; resuming a saved round keeps that round’s original rules.
- Proposed learning and usability criteria are in [PRODUCT-GUIDE.md](PRODUCT-GUIDE.md). Test results are in [VERIFICATION.md](VERIFICATION.md).

## Video file details

The supplied original is retained unchanged by the author. The repository copy converts its main video stream from HEVC to H.264 for browser compatibility, keeps 1920 × 1080 resolution and all 5299 video frames, and copies the AAC audio without re-encoding. Duration and compressed audio payload hashes match. No cuts, captions, narration, or timing changes were added.

- Original: `NerdyHackSubConyers.MP4` (63557506 bytes).
- Original SHA-256: `ce2fd6446f7938b4cfdcc33beb4e586444ded8978de02e7f40c30b7c65d7a71f`.
- Repository copy: `demo/summit-submitted-demo.mp4` (8489968 bytes).
- Copy SHA-256: `0718ffd8b38dfd701c478b76c002609c88baf911138e8dfd8e5b1e858f5a0886`.

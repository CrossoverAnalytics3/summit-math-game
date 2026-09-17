# Product guide — Teach the Climb

## Product thesis

**Children teach Pip and friends how to reach the summit. Their decisions change the journey, and the resulting evidence helps parents and tutors choose a useful next conversation.**

The working problem is that a correct answer or completed activity can hide the child's intention, reasoning, and use of support. The child needs a playful way to express and revise an idea. The adult needs an inspectable account rather than an opaque score or a personality label.

Initial audience: children approximately 8–10 and an accompanying parent or tutor. Initial subject: equal sharing and the relationship between an individual share, the basket, and the group. The age range, user need, and educational effect are hypotheses to validate.

## Why the experience takes this shape

The original Summit mountain supplies a common goal and a familiar world. Leading an expedition gives the child a reason to explain a plan to someone else. An executable plan makes the child's intention testable; a changed situation invites revision without manufacturing an agent error.

The loop is **choose → teach → predict a fair share → observe → explain or revise → try a changed situation**. Help is welcome and recorded. The child can succeed immediately when their instruction works. In the expedition, Pip follows the accepted plan without staging a failure. The separate worksheet activity explicitly invites the child to find one authored mistake in Pip's worked examples.

The learner remains the author. Different routes can be worthwhile for different reasons. The system asks for the learner's account before attributing intent; route choice alone does not establish empathy, creativity, ability, or a preferred learning style.

## The first expedition

The Summit Picnic starts with **twelve berries shared among three friends**. Supported teaching forms make the plan visible before it runs:

- A fixed number for each friend.
- A repeatable round that distributes to the group.
- A fraction of the basket for each friend.

The learner answers **“Before Pip moves, what would a fair share be?”**, lets Pip execute, inspects the actual allocation, and may explain or revise. This prediction concerns the target equal share, not the literal outcome of a possibly incomplete plan. A fixed four-per-friend plan and an appropriate repeated-round plan can both work initially. Their behavior under changed conditions supplies different evidence; the first success alone does not distinguish understanding.

| Route        | Changed situation            | Consequence                                                                                      |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Beacon Ridge | Nine berries, three friends  | The basket changes while the group stays constant; the ridge's beacon records the route outcome. |
| Meadow Camp  | Twelve berries, four friends | A companion joins; the group changes while the basket stays constant.                            |

An instruction tied to a fixed amount or group may need revision. An already-general method may work unchanged. Either outcome is legitimate. The two routes differ, so their raw performance should not be compared as if the tasks were identical.

Both routes then reach a common follow-up: **eight berries and four friends**. It is a fixed authored example, not an unseen item bank; repeated expeditions can show it again. A successful run and a correct prediction are separate observations. The current product does not score the learner's free-text explanation or claim lasting mastery from this task.

The original fraction and arithmetic experiences remain in the original practice camp, opened through **A little practice at basecamp** under **THE ORIGINAL TRAILS**. They retain their scoring and records. This iteration does not reinterpret their old logs as new teaching evidence.

## Checking Pip's work and choosing the rules

**Fix Pip's homework** adds a different teaching role: inspect three worked examples, find the slipped card, select its reason and supply the corrected answer. The three results remain separate. “Named the reason” means choosing the matching option; it does not mean the learner supplied an unaided explanation. Pip's steps are part of the support. The product hypothesis is that examining someone else's work may invite useful discussion; no learner study has yet established that effect here.

These are new problems from the selected trail's generators. The current product does not retrieve the child's exact earlier worksheet, infer their misconception from session notes or automatically generate a matching mistake. An API caller may request an authored slip when it fits the generated problem. Worked-example checks do not advance or reset the independent trail streak.

In **Your rules**, the child can choose hearts, bonus-clock behavior, relative difficulty and a digit to avoid. The server enforces the allowed settings and remains responsible for the mathematical problem and outcome. Choice is part of the experience to evaluate, not evidence of a fixed preference or learning style.

## What the journal should mean

| Record type         | Meaning                                                 | Example                                                                                    |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Observation         | A game action or outcome that actually occurred         | A fair-share prediction, the accepted instruction, or the berry allocation after execution |
| Support             | A displayed prompt, model, or other assistance          | Opened the available teaching help before the next run                                     |
| Learner account     | What the learner says they intended or noticed          | “I wanted to see whether the same number would work.”                                      |
| Interpretation      | A specific possibility to examine, explicitly tentative | A plan may be tied to the starting quantity; more evidence is needed                       |
| Suggested next step | A question or task grounded in the relevant record      | Change the group and ask for a prediction before running                                   |

A learner or adult may correct the interpretation, add context, or report that Pip misunderstood. Corrections preserve the actual observation, attach the account, and withdraw dependent suggestions. They do not change mathematical truth or turn a supported attempt into independent success.

The tutor brief organizes four evidence-linked questions: what was demonstrated, what remains uncertain, what support appeared, and what to ask next. At least two distinct eligible observations are required before an interpretation can be proposed; a single observation stays insufficient, and flagged system issues cannot satisfy the floor. Two events still do not establish a pattern. The record saves to one local SQLite workspace, with a browser cache and explicit conflict recovery.

Worksheet observations now appear in that same adult surface under their own labels. Every found/named/fixed count links to the saved worksheet evidence, including the shown work and exact choices where recorded. They are not expedition `RunRecord`s and cannot satisfy the climb's interpretation floor. The server stores completed worksheets separately; the journal fetches them anew on each visit and offers a separate export. A worksheet's recorded choices can anchor a conversation, but they do not record the child's intention, outside help or an independent explanation.

“Not enough evidence” is a useful result. A citation to a recorded event does not make an interpretation true. The parent/tutor payoff is an evidence-linked next interaction, not a diagnosis.

## Measure and iterate

The following are **proposed pilot measures**, not reported outcomes or research-established thresholds.

| Question                                  | Measure and denominator                                                                                          | Initial decision rule                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Can children begin teaching?              | Children creating and running one plan within five minutes without adult control assistance / all pilot children | Aim for at least 4/5 in the first supervised usability round. If two children encounter the same control obstacle, fix it before increasing feature scope.         |
| Can children predict a changed situation? | Correct unaided predictions / new situations attempted; retain the exact conditions and assistance               | Use three appropriate new items plus an explanation. Compare with an earlier baseline and a later set; do not call prototype completion “mastery.”                 |
| Can children intentionally revise?        | Revisions linked to a stated intention and relevant rule / revision opportunities observed                       | Review event trace and learner explanation together. Distinguish purposeful experiments, control mistakes, and conceptual confusion.                               |
| Does the journal represent the child?     | Entries the child recognizes as faithful, disputes, or cannot assess / entries reviewed                          | Inspect every disagreement. Revise templates or interpretation logic when the record overstates what occurred.                                                     |
| Can adults use the evidence?              | Adults locating supporting events and proposing a relevant follow-up / participating adults                      | Initial target 4/5. A reviewer checks whether the follow-up addresses demonstrated uncertainty rather than an unsupported trait.                                   |
| Does optional AI add value?               | Useful selected questions / selections reviewed; fallback counts tracked separately                              | Compare model selection with the authored rotation. The current model chooses from approved question and Pip-line banks rather than generating unrestricted prose. |

Use task-appropriate parallel examples rather than repeatedly scoring the same fixed quest. Keep first attempts, retries, and support separate. A skipped explanation is missing evidence, not evidence of inability. Less help is not automatically better. Avoid ranking routes by speed.

### Worksheet evaluation

These are additional **proposed pilot measures**, not capabilities already measured or learning outcomes already achieved. The app currently records the first submitted card, reason and correction plus the three server checks. The unaided tasks and explanation rubric below require a supervised evaluation protocol.

| Question                                                          | Measure and denominator                                                                                                                                                                                                            | How the result would guide iteration                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can the child inspect the worked example?                         | Correct slipped-card selections / first worksheet submissions; report reason-choice and correction accuracy separately on the same submissions.                                                                                    | Inspect the work displayed and ask what the child noticed before interpreting a miss. Repeated interface misunderstandings call for a control or tutorial fix.                                                                                          |
| Does choosing a reason reflect an explanation the child can give? | On a parallel example before showing reason choices, explanations identifying the relevant mathematical step and explaining why it is wrong / all explanation opportunities. Report no response and prompted responses separately. | Have two reviewers use an agreed rubric, retaining disagreement rather than silently scoring it away. High reason-choice accuracy with weak unaided explanations suggests the choices may cue recognition; revise the teaching activity and test again. |
| Can the learner correct and solve without Pip's worked steps?     | Correct first answers on matched new, unworked problems / all attempted independent items; record skipped items separately. Compare baseline, immediate follow-up and a delayed parallel set.                                      | Keep the worksheet's supported corrections separate from these independent answers. Check for repeated-item effects and support differences before claiming improvement.                                                                                |
| Can tutors choose a useful next question?                         | Tutors who open the relevant worksheet evidence and identify the remaining uncertainty / all participating tutors.                                                                                                                 | Review whether a proposed follow-up addresses the actual card, selected reason or correction rather than assigning a learner trait. Inspect every overstatement in the brief.                                                                           |

If those measures move together, they would motivate a larger evaluation; they would still not establish durable mastery or a causal learning benefit on their own. Predefine item selection, assistance rules and comparison conditions before collecting outcomes.

## Product-engineering process

1. **Define:** select one learner, adult decision, and observable learning objective.
2. **Constrain:** support a few executable teaching plans in one coherent expedition.
3. **Build:** separate mathematical execution, presentation, optional generation, and evidence interpretation.
4. **Verify:** test quantities, progression, event integrity, fallback, and correction propagation; exercise the real interface.
5. **Evaluate:** observe children and adults separately, with a suitable consent and data plan.
6. **Iterate:** use controls, explanations, changed-task performance, and report corrections to choose the next change.

The current work supplies a prototype and software evidence. Learner research is the next validation step. Broader subjects, free-form agent instruction, and persistent classroom profiles remain future work.

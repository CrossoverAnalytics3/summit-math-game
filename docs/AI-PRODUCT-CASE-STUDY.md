# Summit: an AI product engineering case study

**A learning-through-teaching adventure, beginning with elementary math.**

This case study explains the product decisions, AI integration, and verification behind the submitted v0.5.3 experience. [Submitted video](DEMO.md). **The roadmap below is future work, not part of the submitted build. It does not change the application or its environment.**

## The problem and product hypothesis

A correct answer can hide a child's intention, reasoning, and use of support. A parent or tutor needs evidence for a useful next conversation; a child needs an engaging way to express and revise an idea.

Summit's first learner focus is ages 8–10 exploring equal sharing. Children teach Pip a plan, predict a fair share, watch the instruction execute, and adapt when the basket or group changes. The hypothesis is that this visible sequence can support better instructional conversations than answer counts alone. The need, age fit, and educational effect still require learner research.

## My role and priorities

I built the foundation with ChatGPT and Claude, then iterated with Codex. AI coding tools did most of the typing; the product direction and review were mine. My AI product engineering approach connected the learner problem to an implemented experience, defined model responsibilities, and tested the resulting behavior.

I prioritized one inspectable expedition, preserved the alpine world, and made teaching the central mechanic. The original arithmetic and fraction activities remain available with separate evidence. Correctable observations and reproducible execution anchor the experience.

## What shipped and why

The expedition moves through a first teaching, a changed situation, and a fixed summit check. A plan that already works succeeds; Pip does not stage a failure. The common summit task provides another session observation, not an unseen assessment or proof of durable mastery.

The journal and tutor brief connect observations to original runs. They separate what happened, support, learner accounts, tentative interpretations, and next questions. A system-issue correction preserves the replay and withdraws dependent suggestions. The journal already includes a **“What I meant”** field; capturing the child's explanation inside the activity is proposed work.

Homework review separately records finding, naming, and fixing a planted error. Child-selected arithmetic rules provide bounded choice. Worked examples and easier practice do not advance independent trail mastery.

React and TypeScript present the experience. A shared deterministic engine executes plans. Node, Express, and SQLite validate and persist evidence. Persistence serves one local demonstration workspace, not authenticated learner accounts. [Architecture](ARCHITECTURE.md)

## Shipped runtime AI and its value test

Summit uses runtime AI in two ways:

- **Expedition coaching:** the model selects a question and Pip line from authored banks using a recomputed simulation. This delivers contextual selection within a predictable set of coaching options.
- **Arithmetic language generation:** the model writes themed problem stories, strategy hints, and parent notes from limited context. Shape, length, and digit checks govern acceptance; provenance records the provider, checks, and final source. Authored content supplies fallback when output fails checks or AI is unavailable.

Deterministic code owns mathematical truth, scoring, and evidence. AI supplies selection and language variation. Teaching Pip changes executable instructions; it does not retrain a model.

The proposed evaluation compares each AI output with its authored baseline on the same eligible situations. Reviewers would assess contextual relevance, usefulness, and misleading implications without seeing the source label. Track fallback rate, latency, and cost separately. Retain or expand an AI behavior when its added usefulness justifies its operational cost without increasing misleading guidance. This incremental benefit remains to be measured.

## Measurement and release confidence

The [verification record](VERIFICATION.md) documents automated checks and interface walkthroughs. These establish tested software behavior, not learning gains.

The [pilot plan](PRODUCT-GUIDE.md#measure-and-iterate) separates usability, understanding, and adult usefulness. Observe whether children can operate the controls, explain a revision, and apply an idea to new and later tasks. Check whether adults can locate the evidence and propose a relevant follow-up. Record missing responses and assistance explicitly; pilot targets guide iteration.

## Prioritized roadmap and decision gates

**1. Observe the submitted experience.** Run a small supervised learner-and-tutor pilot with an appropriate consent and data plan. Repeated control confusion triggers interface fixes before adding scope. Resolve misleading journal statements before expanding interpretation.

**2. Bring explanation into play.** Move the opportunity represented by “What I meant” into the activity as an optional short explanation. Preserve exact words alongside actions. Prototype a grounded AI follow-up, with clarification and correction available. Advance only after reviewed examples show relevance and no invented intent; a skipped explanation remains missing evidence.

**3. Connect everyday actions to mathematical representations.** Prototype one mission such as packing supplies or setting a table. Model a step with clear mathematical language and optional narration, guide practice, then invite the child to teach. Connect movable objects to a distinct diagram and then symbols; replacing counters with visually similar dots adds little. Small recognizable groups can invite subitizing, then show how parts make a whole; counting stays available and speed is not the learning goal. For example, pack six crackers into “now” and “later” groups, then connect that action to a part–whole diagram and an equation. An optional physical companion activity would supply hands-on manipulation. Digital objects alone do not.

Record tool use separately from instructional hints or worked solutions. Test unfamiliar and later tasks before expanding the lesson. These proposals draw on systematic instruction and connected representations, not evidence that Summit treats dyscalculia. [IES practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/26) · [EEF guidance](https://educationendowmentfoundation.org.uk/early-years/maths/use-manipulatives-and-representations-to-develop-understanding)

**4. Prepare broader use.** Add authenticated access and appropriate consent, retention, and deletion controls before expanding beyond the local demonstration workspace. Curriculum expansion follows evidence from the earlier stages.

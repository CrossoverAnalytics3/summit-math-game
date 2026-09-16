import { generate, inRange, compute, SKILLS, MAX_LEVEL } from "./skills.js";
import { storyProblem, hint, parentNote } from "./ai/story.js";
import { stubAdapter, type AiAdapter } from "./ai/adapter.js";

// Repeatable offline checks: no provider is selected and no learner database is
// opened. This measures arithmetic and fallback behavior, not learning outcomes.
let passed = 0;
const failures: string[] = [];
function check(name: string, condition: boolean) { if (condition) passed++; else failures.push(name); }
const fake = (payload: unknown): AiAdapter => ({ name: "evaluation_fixture", model: "none", async complete() { return JSON.stringify(payload); } });

for (const skill of SKILLS) for (let level = 1; level <= MAX_LEVEL; level++) {
  for (let sample = 1; sample <= 256; sample++) {
    const problem = generate(skill.id, level, sample * 7919);
    check(`${skill.id}:${level}:${sample}`, inRange(skill.id, level, problem.a, problem.b) &&
      Number.isInteger(problem.answer) && problem.answer >= 0 && compute(problem.op, problem.a, problem.b) === problem.answer);
  }
}

for (const skill of SKILLS) for (const theme of ["animals", "space", "ocean", "dinosaurs"]) {
  const result = await storyProblem(skill.id, 3, 71, theme, stubAdapter);
  check(`${skill.id}:${theme}:offline-fallback`, result.provenance.final_source === "template" && !!result.problem.story && result.provenance.fields_sent.length === 0);
}

const p = generate("mul", 5, 71);
const changed = await storyProblem("mul", 5, 71, "space", fake({ story: "A rocket found 999 rocks and 888 more." }));
check("changed-quantities-rejected", changed.provenance.final_source === "template");
const leaked = await storyProblem("mul", 5, 71, "space", fake({ story: `${p.a} rockets carry ${p.b} rocks each. The answer is ${p.answer}.` }));
check("numeric-answer-leak-rejected", leaked.provenance.final_source === "template");
const leakedHint = await hint(p, null, fake({ hint: `The answer is ${p.answer}.` }));
check("numeric-hint-leak-rejected", leakedHint.provenance.final_source === "template");
const inventedMetric = await parentNote({ weakest_skill: null, unlocked: [], rounds: 0 }, "SyntheticLearner", fake({ note: "Your child answered 99 questions correctly." }));
check("invented-numeric-parent-metric-rejected", inventedMetric.provenance.final_source === "template");

console.log(JSON.stringify({
  mode: "offline deterministic evaluation", passed, failed: failures.length,
  arithmetic_cases: SKILLS.length * MAX_LEVEL * 256,
  scope: ["integer arithmetic and range", "themed offline fallback", "numeric answer leakage", "numeric parent metric rejection"],
  not_measured: ["learning gains", "age appropriateness", "AI semantic correctness", "live provider reliability"],
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;

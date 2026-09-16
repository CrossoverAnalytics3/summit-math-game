import { pickAdapter, parseJson, PROMPTS, type AiAdapter } from "./adapter.js";
import { generate, inRange, compute, templateStory, templateHint, skill, type Problem } from "../skills.js";

export interface Provenance { provider: string; prompt_version: string; fields_sent: string[]; checks: { name: string; passed: boolean; detail?: string }[]; final_source: "ai" | "template" }

// The model is asked to dress a problem in a story. The code generated the
// numbers, computes the answer, and checks that the story uses exactly those
// numbers. If the model changes the math, the template wins.
export async function storyProblem(skillId: string, level: number, seed: number, theme: string, adapter: AiAdapter = pickAdapter()) {
  const p = generate(skillId, level, seed);
  const s = skill(skillId);
  const fields = { op: p.op, a: p.a, b: p.b, theme, grade: s.grade };
  const prompt = [
    `Write ONE short word problem for a child in grade ${s.grade}. Theme: ${theme}.`,
    `It must use exactly these two numbers, ${p.a} and ${p.b}, and require the operation: ${opWord(p.op, p.b)}.`,
    `Under 30 words. No answer. No other numbers written as digits. Plain, warm, concrete.`,
    `Return JSON only: {"story": "..."}`,
  ].join("\n");

  const checks: Provenance["checks"] = [];
  const out = parseJson(await adapter.complete(prompt, 200));
  const story: string | null = typeof out?.story === "string" ? out.story : null;
  checks.push({ name: "model_returned_story", passed: !!story });
  const digits = (story ?? "").match(/\d+/g)?.map(Number) ?? [];
  const usesA = digits.includes(p.a), usesB = p.op === "place" || digits.includes(p.b);
  checks.push({ name: "story_contains_both_numbers", passed: usesA && usesB, detail: digits.join(",") });
  const noExtra = digits.every((d) => d === p.a || d === p.b);
  checks.push({ name: "no_extra_numbers", passed: noExtra });
  const noAnswer = !digits.includes(p.answer) || p.answer === p.a || p.answer === p.b;
  checks.push({ name: "answer_not_leaked", passed: noAnswer });
  const short = !!story && story.split(/\s+/).length <= 40;
  checks.push({ name: "under_40_words", passed: short });
  checks.push({ name: "numbers_in_skill_range", passed: inRange(skillId, level, p.a, p.b) && compute(p.op, p.a, p.b) === p.answer });

  const useAi = checks.every((c) => c.passed);
  const prov: Provenance = { provider: adapter.name, prompt_version: PROMPTS.story, fields_sent: adapter.name === "stub" ? [] : Object.keys(fields), checks, final_source: useAi ? "ai" : "template" };
  return { problem: { ...p, story: useAi ? story! : templateStory(p, theme) }, provenance: prov };
}

function opWord(op: Problem["op"], b: number) {
  return { add: "addition", sub: "subtraction", mul: "multiplication", div: "division with no remainder", place: `finding the ${b === 10 ? "tens" : "ones"} digit` }[op];
}

// A hint may explain a strategy. It may never contain the answer. Checked in code.
export async function hint(p: Problem, wrongAttempt: number | null, adapter: AiAdapter = pickAdapter()) {
  const prompt = [
    `A child in grade ${skill(p.skill_id).grade} is solving: ${p.prompt}.`,
    wrongAttempt !== null ? `They answered ${wrongAttempt}, which is wrong.` : `They asked for a hint.`,
    `Give ONE sentence that suggests a strategy. Do not state the answer or any number other than ${p.a} and ${p.b}. Under 20 words.`,
    `Return JSON only: {"hint": "..."}`,
  ].join("\n");
  const checks: Provenance["checks"] = [];
  const out = parseJson(await adapter.complete(prompt, 120));
  const text: string | null = typeof out?.hint === "string" ? out.hint : null;
  checks.push({ name: "model_returned_hint", passed: !!text });
  const digits = (text ?? "").match(/\d+/g)?.map(Number) ?? [];
  checks.push({ name: "answer_not_in_hint", passed: !digits.includes(p.answer) || p.answer === p.a || p.answer === p.b });
  checks.push({ name: "only_problem_numbers", passed: digits.every((d) => d === p.a || d === p.b) });
  checks.push({ name: "under_25_words", passed: !!text && text.split(/\s+/).length <= 25 });
  const useAi = checks.every((c) => c.passed);
  return { hint: useAi ? text! : templateHint(p), provenance: { provider: adapter.name, prompt_version: PROMPTS.hint, fields_sent: adapter.name === "stub" ? [] : ["prompt", "grade", "wrong_attempt"], checks, final_source: useAi ? "ai" : "template" } as Provenance };
}

// Parent note: the model writes one encouraging paragraph about what to do
// next. All numbers are rendered by the UI from computed facts; the note may
// not contain digits at all, so a wrong number can never reach a parent.
export async function parentNote(facts: { weakest_skill: string | null; unlocked: { skill_id: string }[]; rounds: number }, childName: string, adapter: AiAdapter = pickAdapter()) {
  const prompt = [
    `Write two sentences to a parent about their child's math practice this week. Refer to the learner as your child.`,
    facts.weakest_skill ? `The skill that needs the most work is "${facts.weakest_skill}".` : `No skill stood out as weak.`,
    facts.rounds ? `Some practice rounds were completed.` : `No practice rounds are complete yet; do not claim they practiced or had results.`,
    facts.unlocked.length ? `They unlocked a new level.` : `No new levels this week.`,
    `Suggest one concrete thing to try at home. Do not use any digits. No praise inflation. Return JSON only: {"note": "..."}`,
  ].join("\n");
  const checks: Provenance["checks"] = [];
  const out = parseJson(await adapter.complete(prompt, 160));
  const text: string | null = typeof out?.note === "string" ? out.note : null;
  checks.push({ name: "model_returned_note", passed: !!text });
  checks.push({ name: "no_digits", passed: !!text && !/\d/.test(text) });
  checks.push({ name: "under_60_words", passed: !!text && text.split(/\s+/).length <= 60 });
  const useAi = checks.every((c) => c.passed);
  const fallback = !facts.rounds && !facts.weakest_skill
    ? `Your first arithmetic trail is ready. After ${childName} completes a few challenges, this space will show what to practice next.`
    : facts.weakest_skill
    ? `${childName} practiced this week and "${facts.weakest_skill}" is the skill to keep an eye on. Try two quick problems at the dinner table, out loud, and let ${childName} explain the steps.`
    : `${childName} completed math practice this week. Ask ${childName} to teach you one problem out loud and explain the steps.`;
  return { note: useAi ? text! : fallback, provenance: { provider: adapter.name, prompt_version: PROMPTS.parent, fields_sent: adapter.name === "stub" ? [] : ["weakest_skill", "has_unlocks", "has_completed_rounds"], checks, final_source: useAi ? "ai" : "template" } as Provenance };
}

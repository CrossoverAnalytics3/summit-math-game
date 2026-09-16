import { describe, it, expect, beforeEach } from "vitest";
process.env.DB_FILE = ":memory:";
process.env.SUMMIT_ROLLOUT_PCT = "100";
delete process.env.ANTHROPIC_API_KEY;

const { db, seed, reset, setToday } = await import("../src/db.js");
const { generate, inRange, compute, range, SKILLS, MAX_LEVEL } = await import("../src/skills.js");
const { recordAnswer, recordRound, comebackStatus, applyComeback, weeklyFacts, RUN_TO_UNLOCK } = await import("../src/progress.js");
const { storyProblem, hint, parentNote } = await import("../src/ai/story.js");
import type { AiAdapter } from "../src/ai/adapter.js";

seed();
beforeEach(() => reset());
const fake = (text: string): AiAdapter => ({ name: "fake", model: "x", async complete() { return text; } });
const lvl = (s: string) => (db.prepare("SELECT level, run FROM skill_progress WHERE learner_id='L-1' AND skill_id=?").get(s) as any);

describe("generators: every problem is in range and the answer is right", () => {
  for (const s of SKILLS) for (let level = 1; level <= MAX_LEVEL; level += 3) {
    it(`${s.id} level ${level}`, () => {
      for (let seed = 1; seed < 200; seed++) {
        const p = generate(s.id, level, seed);
        expect(inRange(s.id, level, p.a, p.b), JSON.stringify(p)).toBe(true);
        expect(compute(p.op, p.a, p.b)).toBe(p.answer);
        expect(Number.isInteger(p.answer) && p.answer >= 0).toBe(true);
      }
    });
  }
  it("level 1 is small on purpose", () => expect(range("add20", 1).hi).toBeLessThanOrEqual(6));
  it("same seed, same problem", () => expect(generate("mul", 4, 42)).toEqual(generate("mul", 4, 42)));
});

describe("mastery ladder", () => {
  it("3 correct without a hint unlocks the next level; a hint resets the run, not the level", () => {
    recordAnswer("L-1", "add20", true, false); recordAnswer("L-1", "add20", true, false);
    expect(lvl("add20")).toEqual({ level: 1, run: 2 });
    recordAnswer("L-1", "add20", true, true);      // correct but with a hint
    expect(lvl("add20")).toEqual({ level: 1, run: 0 });
    for (let i = 0; i < RUN_TO_UNLOCK; i++) recordAnswer("L-1", "add20", true, false);
    expect(lvl("add20").level).toBe(2);
  });
  it("a wrong answer never drops the level", () => {
    for (let i = 0; i < 3; i++) recordAnswer("L-1", "mul", true, false);
    recordAnswer("L-1", "mul", false, false);
    expect(lvl("mul").level).toBe(2);
  });
  it("caps at MAX_LEVEL", () => {
    for (let i = 0; i < 3 * MAX_LEVEL + 5; i++) recordAnswer("L-1", "div", true, false);
    expect(lvl("div").level).toBe(MAX_LEVEL);
  });
});

describe("comeback after a quiet stretch", () => {
  it("drops one rung, keeps the streak once, never below level 1", () => {
    for (let i = 0; i < 6; i++) recordAnswer("L-1", "add20", true, false);   // level 3
    recordRound("L-1", "add20", 500, 60, true);
    setToday("2026-09-16"); recordRound("L-1", "add20", 500, 60, true);      // streak 2
    setToday("2026-09-23");                                                    // 7 days quiet
    const st = comebackStatus("L-1");
    expect(st.due).toBe(true); expect(st.days_away).toBe(7);
    const r = applyComeback("L-1");
    expect(r.applied).toBe(true); expect(r.streak_kept).toBe(true);
    expect(lvl("add20").level).toBe(2);
    expect(lvl("sub20").level).toBe(1);
    expect((db.prepare("SELECT daily_streak s FROM learners").get() as any).s).toBe(2);
    // second time away: no freeze left, streak resets
    setToday("2026-10-01"); applyComeback("L-1");
    expect((db.prepare("SELECT daily_streak s FROM learners").get() as any).s).toBe(0);
  });
  it("not due after 2 days", () => { recordRound("L-1", "add20", 1, 1, true); setToday("2026-09-17"); expect(comebackStatus("L-1").due).toBe(false); });
});

describe("AI boundary: the model dresses the problem, code owns the math", () => {
  it("uses the story when it keeps the exact numbers", async () => {
    const p = generate("add20", 3, 7);
    const r = await storyProblem("add20", 3, 7, "space", fake(JSON.stringify({ story: `A rocket carried ${p.a} rocks and then ${p.b} more. How many rocks?` })));
    expect(r.provenance.final_source).toBe("ai");
    expect(r.problem.answer).toBe(p.answer);
  });
  it("rejects a story that changes the numbers", async () => {
    const r = await storyProblem("add20", 3, 7, "space", fake(JSON.stringify({ story: "A rocket carried 99 rocks and 98 more." })));
    expect(r.provenance.final_source).toBe("template");
    expect(r.provenance.checks.find((c) => c.name === "story_contains_both_numbers")?.passed).toBe(false);
  });
  it("rejects a story that leaks the answer", async () => {
    const p = generate("mul", 5, 11);
    const r = await storyProblem("mul", 5, 11, "zoo", fake(JSON.stringify({ story: `${p.a} cages with ${p.b} birds each, so ${p.answer} birds.` })));
    expect(r.provenance.final_source).toBe("template");
  });
  it("rejects garbage and a dead provider", async () => {
    expect((await storyProblem("sub20", 2, 3, "x", fake("not json"))).provenance.final_source).toBe("template");
    expect((await storyProblem("sub20", 2, 3, "x", { name: "dead", model: "x", async complete() { return null; } })).provenance.final_source).toBe("template");
  });
  it("a hint may never contain the answer", async () => {
    const p = generate("mul", 6, 5);
    const bad = await hint(p, null, fake(JSON.stringify({ hint: `The answer is ${p.answer}.` })));
    expect(bad.provenance.final_source).toBe("template");
    expect(bad.hint).not.toContain(String(p.answer));
    const good = await hint(p, null, fake(JSON.stringify({ hint: `Skip-count by ${p.b}.` })));
    expect(good.provenance.final_source).toBe("ai");
  });
  it("a parent note may never contain digits", async () => {
    const facts = { weakest_skill: "Times tables", unlocked: [], rounds: 3 };
    const bad = await parentNote(facts, "Sam", fake(JSON.stringify({ note: "Sam got 9 of 10 right." })));
    expect(bad.provenance.final_source).toBe("template");
    expect(/\d/.test(bad.note)).toBe(false);
  });
  it("the model never receives the child's name or age for stories and hints", async () => {
    let seen = "";
    const spy: AiAdapter = { name: "spy", model: "x", async complete(pr) { seen += pr; return null; } };
    await storyProblem("add20", 1, 1, "farm", spy);
    await hint(generate("add20", 1, 1), null, spy);
    expect(seen).not.toMatch(/Sam|age 8|L-1/);
  });
});

describe("parent facts come from events only", () => {
  it("counts attempts, correct, hints, unlocks", () => {
    recordAnswer("L-1", "mul", true, false); recordAnswer("L-1", "mul", false, false); recordAnswer("L-1", "mul", true, true);
    const f = weeklyFacts("L-1");
    const m = f.by_skill.find((s) => s.skill_id === "mul")!;
    expect(m).toMatchObject({ attempts: 3, correct: 2, hints: 1 });
    expect(f.weakest_skill).toBe("Times tables");
  });
});

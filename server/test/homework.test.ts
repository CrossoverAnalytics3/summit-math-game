import { describe, it, expect, beforeEach } from "vitest";
process.env.DB_FILE = ":memory:";
process.env.SUMMIT_ROLLOUT_PCT = "100";
delete process.env.ANTHROPIC_API_KEY;
const { db, seed, reset } = await import("../src/db.js");
const { startHomework, answerHomework, generateHomework } = await import("../src/homework.js");
const { startRound, clampRules, generateRoundProblems, submitAnswer, finishRound, beginHint } = await import("../src/rounds.js");
const { buildHomework, applySlip, correct, assessHomework, showWork } = await import("../../shared/homework.js");
const { SKILLS, generate } = await import("../src/skills.js");
const { recordAnswer } = await import("../src/progress.js");

seed();
beforeEach(() => reset());
const lvl = (s: string) => (db.prepare("SELECT level, run FROM skill_progress WHERE learner_id='L-1' AND skill_id=?").get(s) as any);

describe("Fix Pip's homework: exactly one believable slip, numbers from the generators", () => {
  for (const s of SKILLS) it(`${s.id}: every seeded set has one wrong problem and the key matches`, () => {
    let built = 0;
    for (let sd = 1; sd < 60; sd++) {
      const base = generateRoundProblems(s.id, 4, sd, null, 3).map((p) => ({ a: p.a, b: p.b, op: p.op, prompt: p.prompt }));
      let out; try { out = buildHomework("h", s.id, 4, sd, base); } catch { continue; }
      built++;
      const wrong = out.set.problems.filter((p) => p.pip_answer !== correct(p.op, p.a, p.b));
      expect(wrong.length).toBe(1);
      expect(wrong[0].index).toBe(out.key.wrong_index);
      expect(out.key.correct_answer).toBe(correct(wrong[0].op, wrong[0].a, wrong[0].b));
      expect(out.set.problems.every((p) => p.pip_answer >= 0)).toBe(true);
      expect(out.set.reasons.length).toBe(4);
      expect(out.set.reasons.some((r) => r.id === out.key.slip)).toBe(true);
      expect(out.set.reasons.at(-1)!.id).toBe("none");
      expect(JSON.stringify(out.set)).not.toMatch(/wrong_index|correct_answer/);
    }
    expect(built).toBeGreaterThan(20);
  });
  it("slips are only applied where they make sense", () => {
    expect(applySlip("add", 23, 45, "forgot_carry")).toBeNull();   // no carry needed
    expect(applySlip("add", 27, 45, "forgot_carry")).toBe(62);      // 72 minus the dropped ten
    expect(applySlip("sub", 45, 23, "small_from_big")).toBeNull();
    expect(applySlip("sub", 42, 27, "small_from_big")).toBe(25);    // 2-7 flipped to 7-2, tens 4-2
    expect(applySlip("mul", 6, 4, "skip_short")).toBe(18);
    expect(applySlip("div", 12, 3, "group_short")).toBe(3);
    expect(applySlip("place", 47, 10, "swapped_places")).toBe(7);
  });
  it("assesses spot, explain, fix separately", () => {
    const key = { wrong_index: 1, slip: "forgot_carry" as const, correct_answer: 72 };
    expect(assessHomework(key, 1, "forgot_carry", 72).all).toBe(true);
    expect(assessHomework(key, 1, "off_by_one", 72)).toMatchObject({ spotted: true, explained: false, fixed: true, all: false });
    expect(assessHomework(key, 0, "forgot_carry", 62)).toMatchObject({ spotted: false, fixed: false });
  });
  it("server: key and seed stay private; supported checks do not alter trail mastery; replay is safe", () => {
    recordAnswer("L-1", "add100", true, false);
    recordAnswer("L-1", "add100", true, false);
    const set = startHomework("L-1", "add100");
    expect((set as any).key).toBeUndefined();
    expect(set).not.toHaveProperty("seed");
    const started = db.prepare("SELECT payload FROM events WHERE name='homework_started'").get() as { payload: string };
    expect(JSON.parse(started.payload)).not.toHaveProperty("slip");
    const row = db.prepare("SELECT key_json FROM homework_sets WHERE id=?").get(set.id) as any;
    const key = JSON.parse(row.key_json);
    const r1 = answerHomework("L-1", set.id, key.wrong_index, key.slip, key.correct_answer);
    expect(r1.all).toBe(true);
    expect(lvl("add100")).toEqual({ level: 1, run: 2 });
    const r2 = answerHomework("L-1", set.id, 0, "none", 0);   // replay returns the original
    expect(r2.all).toBe(true);
    expect(lvl("add100")).toEqual({ level: 1, run: 2 });
  });
  it("a requested slip takes priority across the page when one problem supports it", () => {
    const base = [
      { a: 23, b: 45, op: "add" as const, prompt: "23 + 45" },
      { a: 27, b: 45, op: "add" as const, prompt: "27 + 45" },
      { a: 12, b: 34, op: "add" as const, prompt: "12 + 34" },
    ];
    for (let seed = 1; seed <= 30; seed++) {
      expect(buildHomework("h", "add100", 5, seed, base, ["forgot_carry", "off_by_one"]).key)
        .toMatchObject({ wrong_index: 1, slip: "forgot_carry" });
    }
  });

  it("does not credit fixing or explaining the wrong card by coincidence", () => {
    const key = { wrong_index: 1, slip: "forgot_carry" as const, correct_answer: 72 };
    expect(assessHomework(key, 0, "forgot_carry", 72))
      .toMatchObject({ spotted: false, explained: false, fixed: false, all: false });
  });

  it("keeps the child's exact response and completion time with the checked result", () => {
    const set = startHomework("L-1", "add20");
    const result = answerHomework("L-1", set.id, 2, "none", 99);
    expect(result.response).toEqual({ spotted_index: 2, reason: "none", fixed_answer: 99 });
    expect(Number.isInteger(result.completed_at)).toBe(true);
    expect(answerHomework("L-1", set.id, 1, "off_by_one", 4)).toEqual(result);
    expect(lvl("add20")).toEqual({ level: 1, run: 0 });
    expect(db.prepare("SELECT COUNT(*) n FROM events WHERE name='homework_result'").get()).toEqual({ n: 1 });
    expect(db.prepare("SELECT COUNT(*) n FROM events WHERE name='answer'").get()).toEqual({ n: 0 });
  });

  it("preserves an independent trail run after a missed worksheet", () => {
    recordAnswer("L-1", "add100", true, false);
    const set = startHomework("L-1", "add100");
    const result = answerHomework("L-1", set.id, 0, "none", 999);
    expect(result.fixed).toBe(false);
    expect(lvl("add100")).toEqual({ level: 1, run: 1 });
  });

  it("rejects another learner without mutating the worksheet", () => {
    const set = startHomework("L-1", "add20");
    expect(() => answerHomework("another", set.id, 0, "none", 2)).toThrow("not found");
    expect(db.prepare("SELECT result FROM homework_sets WHERE id=?").get(set.id)).toEqual({ result: null });
  });

  it("reproduces the same page after other pages without mutating the distractor bank", () => {
    const base = generateRoundProblems("place", 4, 10, null, 3);
    const original = buildHomework("h", "place", 4, 100, base);
    for (let seed = 1; seed <= 20; seed++) buildHomework("h", "place", 4, seed, base);
    expect(buildHomework("h", "place", 4, 100, base)).toEqual(original);
  });

  it("retries a place-value page whose tens and ones are equal on every card", () => {
    const base = generateRoundProblems("place", 1, 70, null, 3);
    expect(base.map(p => p.a)).toEqual([66, 77, 33]);
    expect(() => buildHomework("h", "place", 1, 70, base)).toThrow("no believable slip");
    const { set, key } = generateHomework("place", 1, 70);
    expect(set.problems.filter(p => p.pip_answer !== correct(p.op, p.a, p.b))).toHaveLength(1);
    expect(key.slip).toBe("swapped_places");
  });

  it("can plant a visible counting slip even when all subtraction answers are zero", () => {
    const base = [2, 3, 4].map(a => ({ a, b: a, op: "sub" as const, prompt: `${a} − ${a}` }));
    const { set, key } = buildHomework("h", "sub20", 1, 42, base);
    expect(key.correct_answer).toBe(0);
    expect(set.problems[key.wrong_index].pip_answer).toBe(1);
    expect(set.problems[key.wrong_index].steps[0]).toMatch(/1, 1$/);
  });

  it("shows all place-value columns and keeps the final counting slip visible in bounded work", () => {
    expect(showWork("place", 482, 10, 8, null)[0]).toBe("482 has 4 hundreds, 8 tens and 2 ones");
    const counting = showWork("sub", 100, 90, 11, "off_by_one")[0];
    expect(counting.length).toBeLessThan(100);
    expect(counting).toContain("…");
    expect(counting).toMatch(/13, 12, 11, 11$/);
    expect(showWork("mul", 6, 4, 25, "off_by_one")[0]).toBe("Skip-count by 6: 6, 12, 18, 25");
  });

  it("builds a valid three-card page at every skill and level over 2,100 seeded samples", () => {
    for (const s of SKILLS) for (let level = 1; level <= 10; level++) for (let seed = 1; seed <= 30; seed++) {
      const { set, key } = generateHomework(s.id, level, seed);
      const wrong = set.problems.filter(p => p.pip_answer !== correct(p.op, p.a, p.b));
      expect(wrong).toHaveLength(1);
      expect(wrong[0].index).toBe(key.wrong_index);
      expect(new Set(set.problems.map(p => p.prompt)).size).toBe(3);
      expect(new Set(set.reasons.map(r => r.id)).size).toBe(4);
      expect(set.problems.every(p => p.steps.every(step => step.length < 150))).toBe(true);
    }
  });
});

describe("Your rules: the child sets them, the server clamps them", () => {
  it("clamps to the allowed set", () => {
    expect(clampRules(undefined).chosen_by).toBeUndefined();
    expect(clampRules({ hearts: 1, timer: false, difficulty: "harder", avoid_digit: 5 })).toMatchObject({ hearts: 1, bonus_seconds: 0, bonus_points: 0, level_shift: 1, avoid_digit: 5, chosen_by: "child" });
    expect(clampRules({ hearts: 7 as any, avoid_digit: 42 })).toMatchObject({ hearts: 3, avoid_digit: null });
  });
  it("no fives tonight: neither questions nor their correct answers contain a 5", () => {
    const r = startRound("L-1", "mul", { avoid_digit: 5 });
    expect(r.problems.every((p: any) => !p.prompt.includes("5") && !String(correct(p.op, p.a, p.b)).includes("5"))).toBe(true);
  });
  it("timer off means no bonus window; one heart ends after one miss", () => {
    const r = startRound("L-1", "add20", { timer: false, hearts: 1 });
    expect(r.bonus_deadline_at).toBeNull();
    expect(r.hearts_total).toBe(1);
    expect(submitAnswer("L-1", r.problems[0].id, -1)).toMatchObject({ hearts_remaining: 0, round_ended: true });
    expect(finishRound("L-1", r.round_id)).toMatchObject({ bonus_points: 0, ended_reason: "hearts" });
  });
  it("a completed untimed trail never receives a speed bonus", () => {
    const r = startRound("L-1", "add20", { timer: false });
    for (const p of r.problems) submitAnswer("L-1", p.id, correct(p.op, p.a, p.b));
    expect(finishRound("L-1", r.round_id)).toMatchObject({ bonus_deadline_at: null, bonus_points: 0, score: 700 });
  });
  it("easier stays practice at the first-level floor, including a hinted or missed answer", () => {
    recordAnswer("L-1", "add20", true, false);
    const r = startRound("L-1", "add20", { difficulty: "easier" });
    expect(r).toMatchObject({ level: 1, practice_only: true });
    for (const p of r.problems.slice(0, 3)) submitAnswer("L-1", p.id, correct(p.op, p.a, p.b));
    expect(lvl("add20")).toEqual({ level: 1, run: 1 });
    beginHint("L-1", r.problems[3].id);
    submitAnswer("L-1", r.problems[3].id, correct(r.problems[3].op, r.problems[3].a, r.problems[3].b));
    submitAnswer("L-1", r.problems[4].id, -1);
    expect(lvl("add20")).toEqual({ level: 1, run: 1 });
    const events = db.prepare("SELECT payload FROM events WHERE name='answer'").all() as { payload: string }[];
    expect(events.slice(1).every(e => JSON.parse(e.payload).practice_only === true)).toBe(true);
  });
  it("honors all picker digit rules in questions and answers over 6,300 seeded rounds", () => {
    for (const s of SKILLS) for (let level = 1; level <= 10; level++) for (const digit of [5, 7, 9]) for (let seed = 1; seed <= 30; seed++) {
      const problems = generateRoundProblems(s.id, level, seed, digit);
      expect(problems).toHaveLength(7);
      expect(new Set(problems.map(p => p.prompt)).size).toBe(7);
      expect(problems.every(p => !p.prompt.includes(String(digit)) && !String(p.answer).includes(String(digit)))).toBe(true);
    }
  });
  it("explains an infeasible digit rule instead of silently breaking it", () => {
    expect(() => generateRoundProblems("mul", 1, 42, 2)).toThrow("Choose another digit or difficulty");
  });
  it("playing easier never moves mastery; playing harder can", () => {
    for (let i = 0; i < 6; i++) recordAnswer("L-1", "add20", true, false);   // level 3
    const easy = startRound("L-1", "add20", { difficulty: "easier" });
    expect(easy.level).toBe(2);
    recordAnswer("L-1", "add20", true, false, easy.level);
    expect(lvl("add20")).toEqual({ level: 3, run: 0 });
    const hard = startRound("L-1", "add20", { difficulty: "harder" });
    expect(hard.level).toBe(4);
    for (let i = 0; i < 3; i++) recordAnswer("L-1", "add20", true, false, hard.level);
    expect(lvl("add20").level).toBe(4);
  });
});

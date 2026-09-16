import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
process.env.DB_FILE = ":memory:";
const { db, reset, upgradeRoundSchema } = await import("../src/db.js");
const { startRound, saveRound, submitAnswer, getRound, getProblem, finishRound, beginHint, cacheHint, generateRoundProblems } = await import("../src/rounds.js");
const { compute, generate } = await import("../src/skills.js");

let now: number;
const learner = "L-1";
const initialTime = 1_800_000_000_000;
beforeEach(() => {
  reset();
  now = initialTime;
  vi.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());
const answerFor = (p: { op: string; a: number; b: number }) => compute(p.op as Parameters<typeof compute>[0], p.a, p.b);
const answerEvents = () => (db.prepare("SELECT COUNT(*) n FROM events WHERE name='answer'").get() as { n: number }).n;
const finishedEvents = () => (db.prepare("SELECT COUNT(*) n FROM events WHERE name='round_finished'").get() as { n: number }).n;

describe("authoritative hearts and round recovery", () => {
  it("consumes exactly one heart per first incorrect assessment, never for help or replay", () => {
    const round = startRound(learner, "mul");
    const [a, b, c] = round.problems;
    expect(round).toMatchObject({ hearts_total: 3, hearts_remaining: 3, bonus_deadline_at: initialTime + 120_000, server_now: initialTime });
    const correct = submitAnswer(learner, a.id, answerFor(a));
    expect(correct).toMatchObject({ correct: true, hearts_remaining: 3, score: 100 });
    expect(submitAnswer(learner, a.id, -1)).toEqual(correct);
    beginHint(learner, b.id);
    cacheHint(b.id, { text: "Count the groups." });
    expect(beginHint(learner, b.id).cached).toEqual({ text: "Count the groups." });
    expect(getRound(learner, round.round_id).hearts_remaining).toBe(3);
    expect(submitAnswer(learner, b.id, answerFor(b))).toMatchObject({ used_hint: true, correct: true, score: 160, hearts_remaining: 3 });
    const wrong = submitAnswer(learner, c.id, -1);
    expect(wrong).toMatchObject({ correct: false, hearts_remaining: 2, answered: 3, score: 160 });
    expect(submitAnswer(learner, c.id, answerFor(c))).toEqual(wrong);
    expect(() => submitAnswer(learner, round.problems[3].id, NaN)).toThrow("whole number");
    expect(getRound(learner, round.round_id).hearts_remaining).toBe(2);
    expect(answerEvents()).toBe(3);
  });

  it("ends on the third incorrect answer while preserving earned levels, score, and history", () => {
    const round = startRound(learner, "add20");
    for (const p of round.problems.slice(0, 3)) {
      now += 1_000;
      submitAnswer(learner, p.id, answerFor(p));
    }
    let last;
    for (const p of round.problems.slice(3, 6)) {
      now += 1_000;
      last = submitAnswer(learner, p.id, -1);
    }
    expect(last).toMatchObject({ hearts_remaining: 0, round_ended: true, ended_reason: "hearts", answered: 6, total: 7, score: 300, bonus_points: 0, level: 2 });
    const remaining = round.problems[6];
    expect(() => submitAnswer(learner, remaining.id, answerFor(remaining))).toThrow("trail has ended");
    expect(() => beginHint(learner, remaining.id)).toThrow("trail has ended");
    expect(getProblem(learner, remaining.id)).toMatchObject({ result: null, used_hint: 0 });
    expect(submitAnswer(learner, round.problems[5].id, 100)).toEqual(last);
    const result = finishRound(learner, round.round_id);
    expect(result).toMatchObject({ score: 300, base_score: 300, bonus_points: 0, answered: 6, total: 7, correct: 3, seconds: 6, level: 2, won: false, ended_reason: "hearts" });
    now += 300_000;
    expect(finishRound(learner, round.round_id)).toEqual(result);
    expect(getRound(learner, round.round_id).result).toEqual(result);
    expect(db.prepare("SELECT level,high_score,wins,seconds FROM skill_progress WHERE skill_id='add20'").get()).toEqual({ level: 2, high_score: 300, wins: 0, seconds: 6 });
    expect(answerEvents()).toBe(6);
    expect(finishedEvents()).toBe(1);
    const fresh = startRound(learner, "add20");
    expect(fresh).toMatchObject({ level: 2, hearts_remaining: 3, score: 0 });
    expect(getRound(learner, round.round_id).result).toEqual(result);
  });

  it("does not award the bonus when the third mistake is the seventh answer", () => {
    const round = startRound(learner, "mul");
    round.problems.forEach((p, index) => submitAnswer(learner, p.id, index < 4 ? answerFor(p) : -1));
    expect(finishRound(learner, round.round_id)).toMatchObject({ ended_reason: "hearts", answered: 7, correct: 4, score: 400, bonus_points: 0, won: false });
  });

  it("exposes current progress and unassessed hint state without leaking new solutions", () => {
    const round = startRound(learner, "add20");
    beginHint(learner, round.problems[3].id);
    for (const p of round.problems.slice(0, 3)) submitAnswer(learner, p.id, answerFor(p));
    const restored = getRound(learner, round.round_id);
    expect(restored).toMatchObject({ level: 1, current_level: 2, run: 0, answered: 3, hearts_remaining: 3 });
    expect(restored.hinted_problem_ids).toEqual([round.problems[3].id]);
    expect(restored.assessments.map((a) => a.problem_id)).toEqual(round.problems.slice(0, 3).map((p) => p.id));
    for (const p of restored.problems) expect(p).not.toHaveProperty("answer");
    expect(() => getRound("another-learner", round.round_id)).toThrow("not found");
    expect(() => submitAnswer("another-learner", round.problems[3].id, 1)).toThrow("not found");
  });
});

describe("server clock and the optional speed bonus", () => {
  it.each([[119_999, 50], [120_000, 0], [120_001, 0]])("assesses the exact deadline at %i milliseconds", (elapsed, bonus) => {
    const round = startRound(learner, "mul");
    for (const p of round.problems.slice(0, 6)) submitAnswer(learner, p.id, answerFor(p));
    now = initialTime + elapsed;
    const last = round.problems[6];
    const assessed = submitAnswer(learner, last.id, answerFor(last));
    expect(assessed).toMatchObject({ round_ended: true, ended_reason: "completed", bonus_points: bonus, score: 700 + bonus });
    now += 300_000;
    const result = finishRound(learner, round.round_id);
    expect(result).toMatchObject({ bonus_points: bonus, score: 700 + bonus, won: true, answered: 7, total: 7 });
    expect(submitAnswer(learner, last.id, -1)).toEqual(assessed);
    expect(finishRound(learner, round.round_id)).toEqual(result);
    expect(finishedEvents()).toBe(1);
  });

  it("keeps answers and hints available after expiry without awarding a bonus", () => {
    const round = startRound(learner, "mul");
    now += 900_000;
    expect(getRound(learner, round.round_id)).toMatchObject({ round_ended: false, hearts_remaining: 3, bonus_points: 0 });
    expect(() => finishRound(learner, round.round_id)).toThrow("Finish each challenge");
    beginHint(learner, round.problems[0].id);
    for (const p of round.problems) submitAnswer(learner, p.id, answerFor(p));
    expect(finishRound(learner, round.round_id)).toMatchObject({ score: 660, bonus_points: 0, correct: 7, won: true, seconds: 900, hearts_remaining: 3 });
  });

  it("awards one completion bonus with two wrong answers or hinted correct work", () => {
    const round = startRound(learner, "mul");
    beginHint(learner, round.problems[0].id);
    round.problems.forEach((p, index) => submitAnswer(learner, p.id, index === 2 || index === 4 ? -1 : answerFor(p)));
    const result = finishRound(learner, round.round_id);
    expect(result).toMatchObject({ base_score: 460, bonus_points: 50, score: 510, correct: 5, hearts_remaining: 1, won: true });
    expect(finishRound(learner, round.round_id)).toEqual(result);
    expect(db.prepare("SELECT high_score,wins FROM skill_progress WHERE skill_id='mul'").get()).toEqual({ high_score: 510, wins: 1 });
  });
});

describe("story and saved-round compatibility", () => {
  it.each([true, false])("keeps a story untimed and heart-free (correct=%s)", (correct) => {
    const p = generate("mul", 1, 42);
    const story = saveRound(learner, "mul", 1, [p]);
    expect(story).toMatchObject({ hearts_total: null, hearts_remaining: null, bonus_seconds: null, bonus_deadline_at: null });
    now += 500_000;
    const answer = submitAnswer(learner, story.problems[0].id, correct ? p.answer : -1);
    expect(answer).toMatchObject({ correct, hearts_remaining: null, round_ended: true, ended_reason: "completed", bonus_points: 0 });
    expect(finishRound(learner, story.round_id)).toMatchObject({ total: 1, answered: 1, score: correct ? 100 : 0, bonus_points: 0, hearts_remaining: null, won: correct });
  });

  it("keeps old seven-problem rounds open after three wrong answers", () => {
    const old = saveRound(learner, "add20", 1, generateRoundProblems("add20", 1, 42));
    for (const p of old.problems.slice(0, 3)) submitAnswer(learner, p.id, -1);
    expect(getRound(learner, old.round_id)).toMatchObject({ answered: 3, round_ended: false, hearts_remaining: null, bonus_deadline_at: null });
    for (const p of old.problems.slice(3)) submitAnswer(learner, p.id, answerFor(p));
    expect(finishRound(learner, old.round_id)).toMatchObject({ total: 7, answered: 7, score: 400, bonus_points: 0, hearts_remaining: null });
  });

  it("adds nullable columns to the old schema without changing saved work", () => {
    const old = startRound(learner, "mul");
    db.exec("ALTER TABLE rounds DROP COLUMN rules; ALTER TABLE rounds DROP COLUMN ended_at;");
    upgradeRoundSchema();
    upgradeRoundSchema();
    const restored = getRound(learner, old.round_id);
    expect(restored.problems).toEqual(old.problems);
    expect(restored).toMatchObject({ level: 1, hearts_remaining: null, bonus_deadline_at: null, answered: 0 });
    expect(db.prepare("SELECT started_at FROM rounds WHERE id=?").get(old.round_id)).toEqual({ started_at: initialTime });
    expect(startRound(learner, "mul").hearts_remaining).toBe(3);
  });

  it("replays an old completed result without adding a bonus or new progress", () => {
    const old = saveRound(learner, "mul", 1, generateRoundProblems("mul", 1, 42));
    for (const p of old.problems) submitAnswer(learner, p.id, answerFor(p));
    const original = { ok: true, round_id: old.round_id, score: 700, correct: 7, total: 7, won: true, seconds: 25 };
    db.prepare("UPDATE rounds SET result=? WHERE id=?").run(JSON.stringify(original), old.round_id);
    expect(finishRound(learner, old.round_id)).toEqual(original);
    expect(getRound(learner, old.round_id).result).toEqual(original);
    expect(finishedEvents()).toBe(0);
  });
});

import { randomInt, randomUUID } from "node:crypto";
import { db } from "./db.js";
import { generate, rng, skill, type Problem } from "./skills.js";
import { progress, recordAnswer, recordRound } from "./progress.js";
import { logEvent } from "./events.js";

interface StoredProblem { id: string; round_id: string; learner_id: string; problem: string; used_hint: number; result: string | null; hint_response: string | null }
interface TrailRules { hearts: number; bonus_seconds: number; bonus_points: number; level_shift?: -1 | 0 | 1; avoid_digit?: number | null; chosen_by?: "default" | "child" }
// The rules a child may set. Everything else stays fixed. The server clamps; the UI only suggests.
export interface KidRules { hearts?: 1 | 3; timer?: boolean; difficulty?: "easier" | "same" | "harder"; avoid_digit?: number | null }
export function clampRules(kid: KidRules | undefined): Readonly<TrailRules> {
  if (!kid) return TRAIL_RULES;
  const hearts = kid.hearts === 1 ? 1 : 3;
  const timer = kid.timer !== false;
  const shift: -1 | 0 | 1 = kid.difficulty === "easier" ? -1 : kid.difficulty === "harder" ? 1 : 0;
  const digit = Number.isInteger(kid.avoid_digit) && kid.avoid_digit! >= 0 && kid.avoid_digit! <= 9 ? kid.avoid_digit! : null;
  return Object.freeze({ hearts, bonus_seconds: timer ? 120 : 0, bonus_points: timer ? 50 : 0, level_shift: shift, avoid_digit: digit, chosen_by: "child" as const });
}
interface StoredRound { id: string; learner_id: string; skill_id: string; level: number; started_at: number; result: string | null; rules: string | null; ended_at: number | null }
interface Assessment { correct: boolean; used_hint: boolean }
export const TRAIL_RULES: Readonly<TrailRules> = Object.freeze({ hearts: 3, bonus_seconds: 120, bonus_points: 50 });
export const failure = (message: string, status = 400) => Object.assign(new Error(message), { status });

export function currentLevel(learnerId: string, skillId: string) {
  if (!skillId || !progress(learnerId).some((p) => p.skill_id === skillId)) throw failure("Choose a known skill");
  skill(skillId);
  return progress(learnerId).find((p) => p.skill_id === skillId)!.level;
}

function storedRound(learnerId: string, roundId: string): StoredRound {
  const row = db.prepare("SELECT * FROM rounds WHERE id=? AND learner_id=?").get(roundId, learnerId) as StoredRound | undefined;
  if (!row) throw failure("This expedition was not found", 404);
  return row;
}
function storedProblems(roundId: string): StoredProblem[] {
  return db.prepare("SELECT * FROM problems WHERE round_id=? ORDER BY position").all(roundId) as unknown as StoredProblem[];
}

function roundState(row: StoredRound, now: number) {
  const problems = storedProblems(row.id);
  const answers = problems.filter((p) => p.result).map((p) => JSON.parse(p.result!) as Assessment);
  const rules = row.rules ? JSON.parse(row.rules) as TrailRules : null;
  const correct = answers.filter((a) => a.correct).length;
  const hearts = rules ? Math.max(0, rules.hearts - (answers.length - correct)) : null;
  const allAnswered = problems.length > 0 && answers.length === problems.length;
  const endedReason = rules && hearts === 0 ? "hearts" : allAnswered ? "completed" : null;
  const deadline = rules && rules.bonus_seconds > 0 ? row.started_at + rules.bonus_seconds * 1000 : null;
  // Use terminal assessment time, never the later/replayed Finish request.
  const bonus = endedReason === "completed" && rules && deadline !== null && row.ended_at !== null && row.ended_at < deadline ? rules.bonus_points : 0;
  const base = answers.reduce((sum, answer) => sum + (answer.correct ? answer.used_hint ? 60 : 100 : 0), 0);
  return {
    hearts_total: rules?.hearts ?? null, hearts_remaining: hearts,
    bonus_seconds: rules?.bonus_seconds ?? null, bonus_deadline_at: deadline, server_now: now,
    answered: answers.length, total: problems.length, correct,
    base_score: base, bonus_points: bonus, score: base + bonus,
    round_ended: endedReason !== null, ended_reason: endedReason,
    practice_only: rules?.level_shift === -1,
  };
}

export function getRound(learnerId: string, roundId: string) {
  const row = storedRound(learnerId, roundId);
  const problems = storedProblems(roundId);
  const current = progress(learnerId).find((p) => p.skill_id === row.skill_id)!;
  return {
    round_id: roundId, level: row.level, current_level: current.level, run: current.run,
    problems: problems.map((row) => {
      const { answer, ...safe } = JSON.parse(row.problem) as Problem;
      return { id: row.id, ...safe };
    }),
    ...roundState(row, Date.now()),
    hinted_problem_ids: problems.filter((p) => p.used_hint === 1).map((p) => p.id),
    assessments: problems.filter((p) => p.result).map((p) => JSON.parse(p.result!)),
    result: row.result ? JSON.parse(row.result) : null,
  };
}

export function saveRound(learnerId: string, skillId: string, level: number,
                          problems: (Problem & { story?: string })[], rules: Readonly<TrailRules> | null = null) {
  const roundId = randomUUID();
  db.transaction(() => {
    db.prepare("INSERT INTO rounds(id,learner_id,skill_id,level,started_at,rules) VALUES(?,?,?,?,?,?)")
      .run(roundId, learnerId, skillId, level, Date.now(), rules ? JSON.stringify(rules) : null);
    problems.forEach((p, position) => {
      db.prepare("INSERT INTO problems(id,round_id,learner_id,position,problem) VALUES(?,?,?,?,?)")
        .run(randomUUID(), roundId, learnerId, position, JSON.stringify(p));
    });
  })();
  logEvent("round_started", { learner_id: learnerId, payload: { round_id: roundId, skill_id: skillId, level, problems: problems.length, rules } });
  return getRound(learnerId, roundId);
}

export function generateRoundProblems(skillId: string, level: number, seed: number, avoidDigit: number | null = null, count = 7): Problem[] {
  const random = rng(seed);
  const unique = new Map<string, Problem>();
  // Bound selection for deterministic, distinct prompts at the requested level.
  for (let attempt = 0; attempt < 512 && unique.size < count; attempt++) {
    const p = generate(skillId, level, Math.floor(random() * 2 ** 32));
    if (avoidDigit !== null && (p.prompt.includes(String(avoidDigit)) || String(p.answer).includes(String(avoidDigit)))) continue;   // the child's "no fives tonight" rule includes the correct answer
    unique.set(p.prompt, p);
  }
  if (unique.size < count) {
    if (avoidDigit !== null) throw failure("There aren't enough different questions with that digit rule at this level. Choose another digit or difficulty.");
    throw failure("This trail could not prepare enough different challenges. Please try again.", 503);
  }
  return [...unique.values()];
}
export function startRound(learnerId: string, skillId: string, kid?: KidRules) {
  const rules = clampRules(kid);
  // Played level may shift by one at the child's request. Mastery level never moves here:
  // recordAnswer only counts a run when the assessed level is at or above the current level.
  const level = Math.max(1, Math.min(10, currentLevel(learnerId, skillId) + (rules.level_shift ?? 0)));
  return saveRound(learnerId, skillId, level, generateRoundProblems(skillId, level, randomInt(1, 2 ** 31), rules.avoid_digit ?? null), rules);
}
export function getProblem(learnerId: string, problemId: string): StoredProblem {
  const row = db.prepare("SELECT * FROM problems WHERE id=? AND learner_id=?").get(problemId, learnerId) as StoredProblem | undefined;
  if (!row) throw failure("This problem was not found. Start a new expedition.", 404);
  return row;
}
function requireOpenRound(row: StoredRound, now: number) {
  if (row.result || roundState(row, now).round_ended) throw failure("This trail has ended. Collect your results or start a new trail.", 409);
}

export const submitAnswer = db.transaction((learnerId: string, problemId: string, submitted: number) => {
  if (!Number.isFinite(submitted) || !Number.isInteger(submitted)) throw failure("Enter a whole number");
  const row = getProblem(learnerId, problemId);
  // Replays return the original snapshot, even after exhaustion or completion.
  // GET /round/:id supplies current counters without mutating that assessment.
  if (row.result) return JSON.parse(row.result);
  const now = Date.now();
  const round = storedRound(learnerId, row.round_id);
  requireOpenRound(round, now);
  const p = JSON.parse(row.problem) as Problem;
  const correct = submitted === p.answer;
  const usedHint = row.used_hint === 1;
  const practiceOnly = round.rules !== null && (JSON.parse(round.rules) as TrailRules).level_shift === -1;
  const current = progress(learnerId).find((s) => s.skill_id === p.skill_id)!;
  // Easier mode remains practice even at the level-1 floor. It does not add to
  // or erase the independent run the learner has already earned.
  const answerProgress = practiceOnly
    ? { level: current.level, run: current.run, unlocked: false }
    : recordAnswer(learnerId, p.skill_id, correct, usedHint, p.level);
  if (practiceOnly) logEvent("answer", { learner_id: learnerId, payload: { skill_id: p.skill_id, correct, used_hint: usedHint, level: answerProgress.level, assessed_level: p.level, unlocked: false, practice_only: true } });
  const assessment = {
    problem_id: problemId, correct, expected_answer: p.answer, used_hint: usedHint,
    ...answerProgress,
  };
  db.prepare("UPDATE problems SET result=? WHERE id=?").run(JSON.stringify(assessment), problemId);
  if (roundState(round, now).round_ended) {
    db.prepare("UPDATE rounds SET ended_at=? WHERE id=? AND ended_at IS NULL").run(now, round.id);
    round.ended_at = now;
  }
  // Per-answer boolean correct deliberately overrides the round's correct count.
  const result = { ...roundState(round, now), ...assessment };
  db.prepare("UPDATE problems SET result=? WHERE id=?").run(JSON.stringify(result), problemId);
  return result;
});

export const beginHint = db.transaction((learnerId: string, problemId: string) => {
  const row = getProblem(learnerId, problemId);
  if (row.result) throw failure("This problem has already been answered", 409);
  requireOpenRound(storedRound(learnerId, row.round_id), Date.now());
  // Persist before awaiting AI so a simultaneous answer cannot bypass hint use.
  db.prepare("UPDATE problems SET used_hint=1 WHERE id=?").run(problemId);
  return { problem: JSON.parse(row.problem) as Problem, cached: row.hint_response ? JSON.parse(row.hint_response) : null };
});
export function cacheHint(problemId: string, response: unknown) {
  db.prepare("UPDATE problems SET hint_response=? WHERE id=?").run(JSON.stringify(response), problemId);
}

export const finishRound = db.transaction((learnerId: string, roundId: string) => {
  const row = storedRound(learnerId, roundId);
  if (row.result) return JSON.parse(row.result);
  const now = Date.now();
  const state = roundState(row, now);
  if (!state.round_ended) throw failure("Finish each challenge before collecting your expedition results", 409);
  const seconds = Math.max(0, Math.min(3600, Math.round(((row.ended_at ?? now) - row.started_at) / 1000)));
  const won = state.ended_reason === "completed" && state.correct >= Math.ceil(state.total * 0.7);
  const result = { ok: true, round_id: roundId, ...state, won, seconds, level: currentLevel(learnerId, row.skill_id) };
  recordRound(learnerId, row.skill_id, state.score, seconds, won);
  db.prepare("UPDATE rounds SET result=?, ended_at=COALESCE(ended_at,?) WHERE id=?").run(JSON.stringify(result), now, roundId);
  return result;
});

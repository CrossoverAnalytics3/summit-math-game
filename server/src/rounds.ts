import { randomInt, randomUUID } from "node:crypto";
import { db } from "./db.js";
import { generate, rng, skill, type Problem } from "./skills.js";
import { progress, recordAnswer, recordRound } from "./progress.js";
import { logEvent } from "./events.js";

interface StoredProblem { id: string; round_id: string; learner_id: string; problem: string; used_hint: number; result: string | null; hint_response: string | null }
interface StoredRound { id: string; learner_id: string; skill_id: string; level: number; started_at: number; result: string | null }
export const failure = (message: string, status = 400) => Object.assign(new Error(message), { status });

export function currentLevel(learnerId: string, skillId: string) {
  if (!skillId || !progress(learnerId).some((p) => p.skill_id === skillId)) throw failure("Choose a known skill");
  skill(skillId);
  return progress(learnerId).find((p) => p.skill_id === skillId)!.level;
}

export function saveRound(learnerId: string, skillId: string, level: number, problems: (Problem & { story?: string })[]) {
  const roundId = randomUUID();
  const safeProblems = db.transaction(() => {
    db.prepare("INSERT INTO rounds(id,learner_id,skill_id,level,started_at) VALUES(?,?,?,?,?)").run(roundId, learnerId, skillId, level, Date.now());
    return problems.map((p, position) => {
      const id = randomUUID();
      db.prepare("INSERT INTO problems(id,round_id,learner_id,position,problem) VALUES(?,?,?,?,?)").run(id, roundId, learnerId, position, JSON.stringify(p));
      const { answer, ...safe } = p;
      return { id, ...safe };
    });
  })();
  logEvent("round_started", { learner_id: learnerId, payload: { round_id: roundId, skill_id: skillId, level, problems: problems.length } });
  return { round_id: roundId, level, problems: safeProblems };
}

export function generateRoundProblems(skillId: string, level: number, seed: number): Problem[] {
  const random = rng(seed);
  const unique = new Map<string, Problem>();
  // One seed reproduces the selection. Bound retries so a future skill with
  // too small a pool fails clearly instead of looping or repeating a prompt.
  for (let attempt = 0; attempt < 512 && unique.size < 7; attempt++) {
    const p = generate(skillId, level, Math.floor(random() * 2 ** 32));
    unique.set(p.prompt, p);
  }
  if (unique.size < 7) throw failure("This trail could not prepare enough different challenges. Please try again.", 503);
  return [...unique.values()];
}

export function startRound(learnerId: string, skillId: string) {
  const level = currentLevel(learnerId, skillId);
  return saveRound(learnerId, skillId, level, generateRoundProblems(skillId, level, randomInt(1, 2 ** 31)));
}

export function getProblem(learnerId: string, problemId: string): StoredProblem {
  const row = db.prepare("SELECT * FROM problems WHERE id=? AND learner_id=?").get(problemId, learnerId) as StoredProblem | undefined;
  if (!row) throw failure("This problem was not found. Start a new expedition.", 404);
  return row;
}

export const submitAnswer = db.transaction((learnerId: string, problemId: string, submitted: number) => {
  if (!Number.isFinite(submitted) || !Number.isInteger(submitted)) throw failure("Enter a whole number");
  const row = getProblem(learnerId, problemId);
  // Replayed requests receive the exact original assessment without logging or
  // awarding progress again, even when the replay changes the submitted answer.
  if (row.result) return JSON.parse(row.result);
  const p = JSON.parse(row.problem) as Problem;
  const correct = submitted === p.answer;
  const result = {
    problem_id: problemId, correct, expected_answer: p.answer, used_hint: row.used_hint === 1,
    ...recordAnswer(learnerId, p.skill_id, correct, row.used_hint === 1, p.level),
  };
  db.prepare("UPDATE problems SET result=? WHERE id=?").run(JSON.stringify(result), problemId);
  return result;
});

export function beginHint(learnerId: string, problemId: string) {
  const row = getProblem(learnerId, problemId);
  if (row.result) throw failure("This problem has already been answered", 409);
  // Set before awaiting a provider so a simultaneous answer cannot bypass it.
  db.prepare("UPDATE problems SET used_hint=1 WHERE id=?").run(problemId);
  return { problem: JSON.parse(row.problem) as Problem, cached: row.hint_response ? JSON.parse(row.hint_response) : null };
}

export function cacheHint(problemId: string, response: unknown) {
  db.prepare("UPDATE problems SET hint_response=? WHERE id=?").run(JSON.stringify(response), problemId);
}

export const finishRound = db.transaction((learnerId: string, roundId: string) => {
  const row = db.prepare("SELECT * FROM rounds WHERE id=? AND learner_id=?").get(roundId, learnerId) as StoredRound | undefined;
  if (!row) throw failure("This expedition was not found", 404);
  if (row.result) return JSON.parse(row.result);
  const results = db.prepare("SELECT result FROM problems WHERE round_id=? ORDER BY position").all(roundId) as { result: string | null }[];
  if (!results.length || results.some((p) => !p.result)) throw failure("Finish each challenge before collecting your expedition results", 409);
  const answers = results.map((p) => JSON.parse(p.result!));
  const correct = answers.filter((a) => a.correct).length;
  const score = answers.reduce((n, a) => n + (a.correct ? a.used_hint ? 60 : 100 : 0), 0);
  const seconds = Math.max(0, Math.min(3600, Math.round((Date.now() - row.started_at) / 1000)));
  const won = correct >= Math.ceil(answers.length * 0.7);
  const result = { ok: true, round_id: roundId, score, correct, total: answers.length, won, seconds };
  recordRound(learnerId, row.skill_id, score, seconds, won);
  db.prepare("UPDATE rounds SET result=? WHERE id=?").run(JSON.stringify(result), roundId);
  return result;
});

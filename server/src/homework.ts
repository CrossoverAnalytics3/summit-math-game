import { randomInt, randomUUID } from "node:crypto";
import { db } from "./db.js";
import { generateRoundProblems, currentLevel, failure } from "./rounds.js";
import { buildHomework, assessHomework, SLIPS_FOR, type HomeworkKey, type HomeworkSet, type Slip } from "../../shared/homework.js";
import { progress } from "./progress.js";
import { logEvent } from "./events.js";
import { skill } from "./skills.js";

interface Row { id: string; learner_id: string; skill_id: string; level: number; set_json: string; key_json: string; result: string | null }

// Pip gets new problems from the trail generators, not the child's exact
// worksheet or a diagnosis extracted from session notes. A caller may request
// an authored slip; it is used when it fits the generated numbers.
export function generateHomework(skillId: string, level: number, seed: number, preferredSlip?: Slip) {
  const op = skill(skillId).op;
  const prefs = preferredSlip && SLIPS_FOR[op].includes(preferredSlip) ? [preferredSlip, ...SLIPS_FOR[op].filter((s) => s !== preferredSlip)] : SLIPS_FOR[op];
  for (let attempt = 0; attempt < 32; attempt++) {
    const pageSeed = (seed + attempt) >>> 0;
    const base = generateRoundProblems(skillId, level, pageSeed, null, 3);
    try {
      return buildHomework(randomUUID(), skillId, level, pageSeed, base, prefs);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "no believable slip for these problems") throw error;
    }
  }
  throw failure("Pip couldn't prepare this worksheet. Please try another page.", 503);
}

export function startHomework(learnerId: string, skillId: string, preferredSlip?: Slip) {
  const level = currentLevel(learnerId, skillId);
  const seed = randomInt(1, 2 ** 31);
  const { set, key } = generateHomework(skillId, level, seed, preferredSlip);
  db.prepare("INSERT INTO homework_sets(id,learner_id,skill_id,level,set_json,key_json,created_at) VALUES(?,?,?,?,?,?,?)")
    .run(set.id, learnerId, skillId, level, JSON.stringify(set), JSON.stringify(key), Date.now());
  // The event inspector is public in this local demo. Do not reveal the
  // selected misconception until the learner has submitted the worksheet.
  logEvent("homework_started", { learner_id: learnerId, payload: { set_id: set.id, skill_id: skillId, level } });
  return set;   // the key never leaves the server
}

export const answerHomework = db.transaction((learnerId: string, setId: string, spotted: number, reason: Slip | "none", fixed: number) => {
  const row = db.prepare("SELECT * FROM homework_sets WHERE id=? AND learner_id=?").get(setId, learnerId) as Row | undefined;
  if (!row) throw failure("That worksheet was not found", 404);
  if (row.result) return JSON.parse(row.result);          // replay-safe
  const key = JSON.parse(row.key_json) as HomeworkKey;
  const set = JSON.parse(row.set_json) as HomeworkSet;
  const r = assessHomework(key, spotted, reason, fixed);
  // Visible worked steps scaffold this task. Keep its three checks as their
  // own evidence rather than advancing (or resetting) independent trail runs.
  const current = progress(learnerId).find((p) => p.skill_id === row.skill_id)!;
  const result = { ...r, current_level: current.level, run: current.run, unlocked: false,
    set_id: setId, skill_id: row.skill_id, level: row.level, wrong_prompt: set.problems[key.wrong_index].prompt,
    response: { spotted_index: spotted, reason, fixed_answer: fixed }, completed_at: Date.now(),
  };
  db.prepare("UPDATE homework_sets SET result=? WHERE id=?").run(JSON.stringify(result), setId);
  logEvent("homework_result", { learner_id: learnerId, payload: { set_id: setId, skill_id: row.skill_id, spotted: r.spotted, explained: r.explained, fixed: r.fixed, slip: key.slip } });
  return result;
});

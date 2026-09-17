import { db, today, daysBetween } from "./db.js";
import { logEvent } from "./events.js";
import { MAX_LEVEL, SKILLS } from "./skills.js";

// Mastery ladder: 3 correct in a row with no hint at the current level
// unlocks the next one. A wrong answer or a hint resets the run, never the level.
export const RUN_TO_UNLOCK = 3;
export const COMEBACK_AFTER_DAYS = 5;

export interface Progress { skill_id: string; level: number; run: number; high_score: number; wins: number; seconds: number }

export function progress(learnerId: string): Progress[] {
  return db.prepare("SELECT skill_id, level, run, high_score, wins, seconds FROM skill_progress WHERE learner_id=? ").all(learnerId) as unknown as Progress[];
}

export function recordAnswer(learnerId: string, skillId: string, correct: boolean, usedHint: boolean, assessedLevel?: number) {
  const p = db.prepare("SELECT level, run FROM skill_progress WHERE learner_id=? AND skill_id=?").get(learnerId, skillId) as { level: number; run: number };
  let { level, run } = p;
  let unlocked = false;
  if (correct && !usedHint) {
    // Finishing easy problems from an older round is not evidence of mastery
    // at the new level. A new round assesses the newly unlocked difficulty.
    if (assessedLevel === undefined || assessedLevel >= level) {
      run = Math.min(RUN_TO_UNLOCK, run + 1);
      if (run >= RUN_TO_UNLOCK && level < MAX_LEVEL) { level += 1; run = 0; unlocked = true; }
    }
  } else run = 0;
  db.prepare("UPDATE skill_progress SET level=?, run=? WHERE learner_id=? AND skill_id=?").run(level, run, learnerId, skillId);
  logEvent("answer", { learner_id: learnerId, payload: { skill_id: skillId, correct, used_hint: usedHint, level, assessed_level: assessedLevel ?? level, unlocked } });
  if (unlocked) logEvent("level_unlocked", { learner_id: learnerId, payload: { skill_id: skillId, level } });
  return { level, run, unlocked };
}

export function recordRound(learnerId: string, skillId: string, score: number, seconds: number, won: boolean) {
  db.prepare("UPDATE skill_progress SET high_score=MAX(high_score,?), wins=wins+?, seconds=seconds+? WHERE learner_id=? AND skill_id=?")
    .run(score, won ? 1 : 0, seconds, learnerId, skillId);
  touchStreak(learnerId);
  logEvent("round_finished", { learner_id: learnerId, payload: { skill_id: skillId, score, seconds, won } });
}

function touchStreak(learnerId: string) {
  const l = db.prepare("SELECT daily_streak, last_played_on FROM learners WHERE id=?").get(learnerId) as { daily_streak: number; last_played_on: string | null };
  const t = today();
  if (l.last_played_on === t) return;
  const gap = l.last_played_on ? daysBetween(l.last_played_on, t) : null;
  const streak = gap === 1 ? l.daily_streak + 1 : gap === null ? 1 : l.daily_streak > 0 && gap <= COMEBACK_AFTER_DAYS ? l.daily_streak + 1 : 1;
  db.prepare("UPDATE learners SET daily_streak=?, last_played_on=? WHERE id=?").run(streak, t, learnerId);
}

// Comeback: after a quiet stretch, drop one rung on every skill above level 1,
// spend the streak freeze so the daily streak survives once, keep all history.
export function comebackStatus(learnerId: string) {
  const l = db.prepare("SELECT last_played_on, daily_streak, streak_freeze FROM learners WHERE id=?").get(learnerId) as { last_played_on: string | null; daily_streak: number; streak_freeze: number };
  const gap = l.last_played_on ? daysBetween(l.last_played_on, today()) : 0;
  return { due: gap >= COMEBACK_AFTER_DAYS, days_away: gap, daily_streak: l.daily_streak, freeze_available: l.streak_freeze === 1 };
}
export function applyComeback(learnerId: string) {
  const st = comebackStatus(learnerId);
  if (!st.due) return { applied: false, streak_kept: false, ...st };
  db.prepare("UPDATE skill_progress SET level=MAX(1, level-1), run=0 WHERE learner_id=?").run(learnerId);
  if (st.freeze_available) db.prepare("UPDATE learners SET streak_freeze=0 WHERE id=?").run(learnerId);
  else db.prepare("UPDATE learners SET daily_streak=0 WHERE id=?").run(learnerId);
  db.prepare("UPDATE learners SET last_played_on=? WHERE id=?").run(today(), learnerId);
  logEvent("comeback_applied", { learner_id: learnerId, payload: { days_away: st.days_away, streak_kept: st.freeze_available } });
  return { applied: true, ...st, streak_kept: st.freeze_available };
}

// Parent summary numbers: computed from events only. The model never sees or writes these.
export function weeklyFacts(learnerId: string) {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const rows = db.prepare("SELECT name, payload FROM events WHERE learner_id=? AND ts>=? ").all(learnerId, since) as { name: string; payload: string }[];
  const answers = rows.filter((r) => r.name === "answer").map((r) => JSON.parse(r.payload));
  const bySkill: Record<string, { attempts: number; correct: number; hints: number }> = {};
  for (const a of answers) {
    const s = (bySkill[a.skill_id] ??= { attempts: 0, correct: 0, hints: 0 });
    s.attempts++; if (a.correct) s.correct++; if (a.used_hint) s.hints++;
  }
  const unlocked = rows.filter((r) => r.name === "level_unlocked").map((r) => JSON.parse(r.payload));
  const rounds = rows.filter((r) => r.name === "round_finished").length;
  // Fix Pip's homework: three separate facts, never folded into a score.
  const hw = rows.filter((r) => r.name === "homework_result").map((r) => JSON.parse(r.payload));
  const homework = { pages: hw.length, spotted: hw.filter((h) => h.spotted).length, explained: hw.filter((h) => h.explained).length, fixed: hw.filter((h) => h.fixed).length };
  const prog = progress(learnerId);
  const weakest = Object.entries(bySkill).sort((x, y) => (x[1].correct / x[1].attempts) - (y[1].correct / y[1].attempts))[0]?.[0] ?? null;
  return {
    rounds, homework, unlocked, by_skill: Object.entries(bySkill).map(([id, v]) => ({ skill_id: id, name: SKILLS.find((s) => s.id === id)?.name, ...v })),
    weakest_skill: weakest ? SKILLS.find((s) => s.id === weakest)?.name ?? null : null,
    levels: prog.map((p) => ({ skill_id: p.skill_id, name: SKILLS.find((s) => s.id === p.skill_id)?.name, level: p.level })),
  };
}

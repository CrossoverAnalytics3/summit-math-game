import "./env.js";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS } from "./skills.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// createRequire also supports test runners whose older builtin list predates SQLite.
const { DatabaseSync }: typeof import("node:sqlite") = createRequire(
  import.meta.url,
)("node:sqlite");
const sqlite = new DatabaseSync(
  process.env.DB_FILE ?? path.join(here, "..", "summit.db"),
);
// The bundled Node SQLite driver avoids platform-specific native addon builds.
// All authoritative assessment writes commit together or roll back together.
function transaction<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
) {
  return (...args: Args): Result => {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const result = fn(...args);
      sqlite.exec("COMMIT");
      return result;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  };
}
export const db = Object.assign(sqlite, { transaction });
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY, display_name TEXT NOT NULL, age INTEGER NOT NULL,
  guardian_consent_ai INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0, last_played_on TEXT, streak_freeze INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS skill_progress (
  learner_id TEXT NOT NULL, skill_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1, run INTEGER NOT NULL DEFAULT 0,   -- run = consecutive correct with no hint at this level
  high_score INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (learner_id, skill_id)
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, ts TEXT NOT NULL, name TEXT NOT NULL, learner_id TEXT, case_id TEXT, payload TEXT
);
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, skill_id TEXT NOT NULL,
  level INTEGER NOT NULL, started_at INTEGER NOT NULL, result TEXT,
  rules TEXT, ended_at INTEGER
);
CREATE TABLE IF NOT EXISTS teaching_journals (
  learner_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teaching_runs (
  learner_id TEXT NOT NULL, id TEXT NOT NULL, position INTEGER NOT NULL, record TEXT NOT NULL,
  PRIMARY KEY (learner_id, id)
);
CREATE TABLE IF NOT EXISTS teaching_interpretations (
  learner_id TEXT NOT NULL, id TEXT NOT NULL, position INTEGER NOT NULL, record TEXT NOT NULL,
  PRIMARY KEY (learner_id, id)
);
CREATE TABLE IF NOT EXISTS homework_sets (
  id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, skill_id TEXT NOT NULL, level INTEGER NOT NULL,
  set_json TEXT NOT NULL, key_json TEXT NOT NULL, result TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY, round_id TEXT NOT NULL, learner_id TEXT NOT NULL,
  position INTEGER NOT NULL, problem TEXT NOT NULL, used_hint INTEGER NOT NULL DEFAULT 0,
  result TEXT, hint_response TEXT
);
`);

// Preserve existing rounds' original untimed rules instead of retroactively
// applying hearts or a bonus deadline to already-saved work.
export function upgradeRoundSchema() {
  const columns = new Set(
    (db.prepare("PRAGMA table_info(rounds)").all() as { name: string }[]).map(
      (column) => column.name,
    ),
  );
  if (!columns.has("rules"))
    db.exec("ALTER TABLE rounds ADD COLUMN rules TEXT");
  if (!columns.has("ended_at"))
    db.exec("ALTER TABLE rounds ADD COLUMN ended_at INTEGER");
}
upgradeRoundSchema();

export function today(): string {
  const r = db.prepare("SELECT value FROM settings WHERE key='today'").get() as
    | { value: string }
    | undefined;
  return r?.value ?? new Date().toISOString().slice(0, 10);
}
export function setToday(d: string) {
  db.prepare(
    "INSERT INTO settings(key,value) VALUES('today',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  ).run(d);
}
export function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function seed() {
  if ((db.prepare("SELECT COUNT(*) n FROM learners").get() as any).n) return;
  setToday("2026-09-15");
  db.prepare(
    "INSERT INTO learners(id,display_name,age,guardian_consent_ai) VALUES('L-1','Sam',8,0)",
  ).run();
  const ins = db.prepare(
    "INSERT INTO skill_progress(learner_id,skill_id,level) VALUES('L-1',?,1)",
  );
  for (const s of SKILLS) ins.run(s.id);
}
export function reset() {
  db.exec(
    "DELETE FROM teaching_interpretations; DELETE FROM teaching_runs; DELETE FROM teaching_journals; DELETE FROM homework_sets; DELETE FROM problems; DELETE FROM rounds; DELETE FROM events; DELETE FROM skill_progress; DELETE FROM learners; DELETE FROM settings;",
  );
  seed();
}

import { randomUUID } from "node:crypto";
import { db } from "./db.js";

// Append-only. Returns false when the id was already seen, which is how
// "the same event arrives twice" produces one record instead of two.
export function logEvent(
  name: string,
  opts: { learner_id?: string; case_id?: string; payload?: unknown; id?: string } = {}
): { id: string; duplicate: boolean } {
  const id = opts.id ?? randomUUID();
  const res = db
    .prepare("INSERT OR IGNORE INTO events(id,ts,name,learner_id,case_id,payload) VALUES(?,?,?,?,?,?)")
    .run(id, new Date().toISOString(), name, opts.learner_id ?? null, opts.case_id ?? null,
      opts.payload === undefined ? null : JSON.stringify(opts.payload));
  return { id, duplicate: res.changes === 0 };
}

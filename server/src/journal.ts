import { db } from "./db.js";
import { createEvidenceSummary } from "../../shared/expedition.js";
import {
  parseTeachingJournal,
  type Journal,
  type JournalSnapshot,
} from "../../shared/journal.js";

type JournalRow = { revision: number; state: string };
type RecordRow = { record: string };
const badRequest = (message: string) =>
  Object.assign(new Error(message), { status: 400 });

/** Durable records for the same L-1 demo learner used by the arithmetic API. */
export function readTeachingJournal(learnerId: string): JournalSnapshot {
  const row = db
    .prepare("SELECT revision,state FROM teaching_journals WHERE learner_id=?")
    .get(learnerId) as JournalRow | undefined;
  if (!row) return { revision: 0, journal: null };
  const runs = (
    db
      .prepare(
        "SELECT record FROM teaching_runs WHERE learner_id=? ORDER BY position",
      )
      .all(learnerId) as RecordRow[]
  ).map((row) => JSON.parse(row.record));
  const receipts = (
    db
      .prepare(
        "SELECT record FROM teaching_interpretations WHERE learner_id=? ORDER BY position",
      )
      .all(learnerId) as RecordRow[]
  ).map((row) => JSON.parse(row.record));
  const journal = parseTeachingJournal({
    ...JSON.parse(row.state),
    runs,
    receipts,
  });
  if (!journal)
    throw new Error(
      "Stored teaching records need repair; refusing to discard evidence.",
    );
  return { revision: row.revision, journal };
}

/** Stored observations are append-only; only explicit correction context can be added. */
function preserveEvidence(previous: Journal, next: Journal) {
  if (
    previous.runs.some((run, index) => next.runs[index]?.id !== run.id) ||
    previous.receipts.some(
      (receipt, index) => next.receipts[index]?.id !== receipt.id,
    )
  ) {
    throw badRequest(
      "Saved evidence must retain its original order. Add new attempts after existing records.",
    );
  }
  for (const before of previous.runs) {
    const after = next.runs.find((run) => run.id === before.id);
    if (!after)
      throw badRequest(
        "Saved teaching runs cannot be removed. Start a new expedition to add a fresh attempt.",
      );
    for (const key of [
      "route",
      "stage",
      "plan",
      "prediction",
      "supports",
      "date",
    ] as const) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        throw badRequest(
          "The instruction and observations of a saved run cannot be rewritten.",
        );
    }
    if (
      before.systemIssue &&
      (!after.systemIssue || after.systemIssueNote !== before.systemIssueNote)
    ) {
      throw badRequest(
        "A recorded system issue cannot be removed or silently rewritten.",
      );
    }
  }
  for (const before of previous.receipts) {
    const after = next.receipts.find((receipt) => receipt.id === before.id);
    if (!after)
      throw badRequest(
        "Saved interpretations cannot be removed; withdraw or correct them instead.",
      );
    for (const key of ["runIds", "text"] as const) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        throw badRequest(
          "The original evidence and wording of an interpretation must be preserved.",
        );
    }
    if (
      before.nextQuestion.text !== after.nextQuestion.text ||
      JSON.stringify(before.nextQuestion.dependsOn) !==
        JSON.stringify(after.nextQuestion.dependsOn)
    ) {
      throw badRequest(
        "A dependent question cannot be replaced or given different sources.",
      );
    }
    if (
      before.nextQuestion.status === "withdrawn" &&
      after.nextQuestion.status !== "withdrawn"
    )
      throw badRequest("A withdrawn question cannot be reactivated.");
    if (
      before.correction &&
      JSON.stringify(before.correction) !== JSON.stringify(after.correction)
    )
      throw badRequest(
        "A saved correction must remain attached to its interpretation.",
      );
    if (
      (before.status === "corrected" || before.status === "withdrawn") &&
      after.status !== before.status
    )
      throw badRequest(
        "A corrected or withdrawn interpretation cannot be reactivated.",
      );
    if (
      before.status === "insufficient" &&
      (after.status === "proposed" || after.status === "confirmed")
    )
      throw badRequest(
        "An insufficient interpretation cannot be promoted; add a new interpretation with new evidence.",
      );
    if (before.status === "confirmed" && after.status === "proposed")
      throw badRequest("A confirmation cannot be silently reset.");
  }
}

export function saveTeachingJournal(
  learnerId: string,
  value: unknown,
): { snapshot: JournalSnapshot; conflict: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw badRequest("Send a journal and its revision.");
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).some((key) => key !== "revision" && key !== "journal") ||
    typeof input.revision !== "number" ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 0
  )
    throw badRequest("A valid journal revision is required.");
  const journal = parseTeachingJournal(input.journal);
  if (!journal)
    throw badRequest(
      "That teaching journal contains invalid or missing evidence.",
    );
  return db.transaction(() => {
    const snapshot = readTeachingJournal(learnerId);
    // A lost response may be retried with its old revision. Do not duplicate its records.
    if (
      snapshot.journal &&
      JSON.stringify(snapshot.journal) === JSON.stringify(journal)
    )
      return { snapshot, conflict: false };
    if (input.revision !== snapshot.revision)
      return { snapshot, conflict: true };
    if (snapshot.journal) preserveEvidence(snapshot.journal, journal);
    const revision = snapshot.revision + 1;
    const { runs, receipts, ...state } = journal;
    db.prepare(
      `INSERT INTO teaching_journals(learner_id,revision,state) VALUES(?,?,?)
      ON CONFLICT(learner_id) DO UPDATE SET revision=excluded.revision,state=excluded.state`,
    ).run(learnerId, revision, JSON.stringify(state));
    const saveRun =
      db.prepare(`INSERT INTO teaching_runs(learner_id,id,position,record) VALUES(?,?,?,?)
      ON CONFLICT(learner_id,id) DO UPDATE SET record=excluded.record`);
    runs.forEach((run, position) =>
      saveRun.run(learnerId, run.id, position, JSON.stringify(run)),
    );
    const saveReceipt =
      db.prepare(`INSERT INTO teaching_interpretations(learner_id,id,position,record) VALUES(?,?,?,?)
      ON CONFLICT(learner_id,id) DO UPDATE SET record=excluded.record`);
    receipts.forEach((receipt, position) =>
      saveReceipt.run(learnerId, receipt.id, position, JSON.stringify(receipt)),
    );
    return { snapshot: { revision, journal }, conflict: false };
  })();
}

export function readTeachingRun(learnerId: string, id: string) {
  return (
    readTeachingJournal(learnerId).journal?.runs.find((run) => run.id === id) ??
    null
  );
}

export function readTeachingBrief(learnerId: string) {
  const { revision, journal } = readTeachingJournal(learnerId);
  const runs = journal?.runs ?? [];
  return {
    revision,
    summary: createEvidenceSummary(runs),
    runs,
    receipts: journal?.receipts ?? [],
  };
}

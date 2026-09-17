import {
  createRun,
  isTeachingPlan,
  reconcileInterpretations,
  selectCurrentRun,
  type Interpretation,
  type Route,
  type RunRecord,
  type Stage,
  type TeachingPlan,
} from "./expedition.js";

/** A local demo workspace, not an authenticated learner account. */
export interface Coach {
  source: "ai" | "authored";
  title: string;
  question: string;
  narrative: string;
  evidenceIds: string[];
  generation?: { question: string; narrative: string };
}
export interface Journal {
  version: 1;
  route: Route | null;
  stage: Stage;
  plan: TeachingPlan;
  planConfirmed: boolean;
  prediction: string;
  supports: string[];
  currentRunId: string | null;
  runs: RunRecord[];
  receipts: Interpretation[];
  notes: Record<string, string>;
  completed: boolean;
  coaches: Record<string, Coach>;
  expeditionId?: string;
  lastPlayedAt?: string;
  returnDismissedAt?: string;
}
export interface JournalSnapshot {
  revision: number;
  journal: Journal | null;
}
export const MAX_TEACHING_RUNS = 200;
export const EMPTY_JOURNAL: Journal = {
  version: 1,
  route: null,
  stage: "first",
  plan: { kind: "rounds" },
  planConfirmed: false,
  prediction: "",
  supports: [],
  currentRunId: null,
  runs: [],
  receipts: [],
  notes: {},
  completed: false,
  coaches: {},
};

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max;
const id = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[A-Za-z0-9_-]{1,100}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
const date = (value: unknown): value is string =>
  text(value, 40) &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));
const route = (value: unknown): value is Route =>
  value === "ridge" || value === "meadow";
const stage = (value: unknown): value is Stage =>
  ["first", "changed", "transfer"].includes(String(value));
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
const ids = (value: unknown, max: number): value is string[] =>
  Array.isArray(value) &&
  value.length <= max &&
  value.every(id) &&
  new Set(value).size === value.length;
const supports = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 2 &&
  value.every((support) => support === "picture" || support === "coach") &&
  new Set(value).size === value.length;
function plan(value: unknown): value is TeachingPlan {
  return (
    isTeachingPlan(value) &&
    keys(
      value as unknown as Record<string, unknown>,
      value.kind === "rounds"
        ? ["kind"]
        : value.kind === "fixed"
          ? ["kind", "amount"]
          : ["kind", "n", "d"],
    )
  );
}

/**
 * Strict, bounded storage contract shared by browser restoration and API writes.
 * Context/result and completion are rebuilt from executable inputs. Interpretations
 * remain editable hypotheses; their evidence floor and withdrawn dependencies are
 * enforced independently of anything a client sends.
 */
export function parseTeachingJournal(value: unknown): Journal | null {
  if (
    !record(value) ||
    !keys(value, [
      "version",
      "route",
      "stage",
      "plan",
      "planConfirmed",
      "prediction",
      "supports",
      "currentRunId",
      "runs",
      "receipts",
      "notes",
      "completed",
      "coaches",
      "expeditionId",
      "lastPlayedAt",
      "returnDismissedAt",
    ]) ||
    value.version !== 1 ||
    !(value.route === null || route(value.route)) ||
    !stage(value.stage) ||
    !plan(value.plan) ||
    typeof value.planConfirmed !== "boolean" ||
    !text(value.prediction, 500) ||
    !supports(value.supports) ||
    !(value.currentRunId === null || id(value.currentRunId)) ||
    !Array.isArray(value.runs) ||
    value.runs.length > MAX_TEACHING_RUNS ||
    !Array.isArray(value.receipts) ||
    value.receipts.length > MAX_TEACHING_RUNS ||
    !record(value.notes) ||
    Object.keys(value.notes).length > MAX_TEACHING_RUNS ||
    typeof value.completed !== "boolean" ||
    !record(value.coaches) ||
    Object.keys(value.coaches).length > MAX_TEACHING_RUNS ||
    (value.expeditionId !== undefined && !id(value.expeditionId)) ||
    (value.lastPlayedAt !== undefined && !date(value.lastPlayedAt)) ||
    (value.returnDismissedAt !== undefined && !date(value.returnDismissedAt))
  )
    return null;
  const runs: RunRecord[] = [];
  const runIds = new Set<string>();
  for (const input of value.runs) {
    if (
      !record(input) ||
      !keys(input, [
        "id",
        "route",
        "stage",
        "context",
        "plan",
        "prediction",
        "supports",
        "date",
        "result",
        "systemIssue",
        "systemIssueNote",
      ]) ||
      !id(input.id) ||
      runIds.has(input.id) ||
      !route(input.route) ||
      !stage(input.stage) ||
      !plan(input.plan) ||
      !text(input.prediction, 500) ||
      !supports(input.supports) ||
      !date(input.date) ||
      typeof input.systemIssue !== "boolean" ||
      (input.systemIssueNote !== undefined &&
        (!text(input.systemIssueNote, 1000) ||
          !input.systemIssueNote.trim())) ||
      (input.systemIssue && !input.systemIssueNote) ||
      (!input.systemIssue && input.systemIssueNote !== undefined)
    )
      return null;
    const rebuilt = createRun({
      id: input.id,
      route: input.route,
      stage: input.stage,
      plan: input.plan,
      prediction: input.prediction,
      supports: input.supports,
      date: input.date,
    });
    runs.push(
      input.systemIssue
        ? {
            ...rebuilt,
            systemIssue: true,
            systemIssueNote: input.systemIssueNote as string,
          }
        : rebuilt,
    );
    runIds.add(input.id);
  }
  const receipts: Interpretation[] = [];
  const receiptIds = new Set<string>();
  for (const input of value.receipts) {
    if (
      !record(input) ||
      !keys(input, [
        "id",
        "runIds",
        "text",
        "status",
        "correction",
        "nextQuestion",
      ]) ||
      !id(input.id) ||
      receiptIds.has(input.id) ||
      !ids(input.runIds, MAX_TEACHING_RUNS) ||
      !input.runIds.length ||
      input.runIds.some((key) => !runIds.has(key)) ||
      !text(input.text, 1000) ||
      !input.text.trim() ||
      ![
        "proposed",
        "confirmed",
        "corrected",
        "withdrawn",
        "insufficient",
      ].includes(String(input.status)) ||
      !record(input.nextQuestion) ||
      !keys(input.nextQuestion, ["text", "status", "dependsOn"]) ||
      !text(input.nextQuestion.text, 1000) ||
      !input.nextQuestion.text.trim() ||
      !["active", "withdrawn"].includes(String(input.nextQuestion.status)) ||
      !ids(input.nextQuestion.dependsOn, MAX_TEACHING_RUNS) ||
      !input.nextQuestion.dependsOn.length ||
      !input.nextQuestion.dependsOn.includes(input.id)
    )
      return null;
    if (
      input.correction !== undefined &&
      (!record(input.correction) ||
        !keys(input.correction, ["kind", "note", "runId"]) ||
        !["context", "system"].includes(String(input.correction.kind)) ||
        !text(input.correction.note, 1000) ||
        !input.correction.note.trim() ||
        (input.correction.runId !== undefined &&
          (!id(input.correction.runId) ||
            !input.runIds.includes(input.correction.runId))))
    )
      return null;
    if ((input.status === "corrected") !== (input.correction !== undefined))
      return null;
    receipts.push({
      id: input.id,
      runIds: input.runIds,
      text: input.text,
      status: input.status as Interpretation["status"],
      ...(input.correction
        ? {
            correction:
              input.correction as unknown as Interpretation["correction"],
          }
        : {}),
      nextQuestion: {
        text: input.nextQuestion.text,
        status: input.nextQuestion.status as "active" | "withdrawn",
        dependsOn: input.nextQuestion.dependsOn,
      },
    });
    receiptIds.add(input.id);
  }
  if (
    receipts.some((receipt) =>
      receipt.nextQuestion.dependsOn.some((key) => !receiptIds.has(key)),
    )
  )
    return null;
  // A system correction records context alongside the exact replay; it never edits its instruction.
  for (const receipt of receipts.filter(
    (receipt) => receipt.correction?.kind === "system",
  )) {
    const affected = receipt.correction?.runId
      ? [receipt.correction.runId]
      : receipt.runIds;
    if (
      affected.some((key) => !runs.find((run) => run.id === key)?.systemIssue)
    )
      return null;
  }
  if (
    runs.some(
      (run) =>
        run.systemIssue &&
        !receipts.some(
          (receipt) =>
            receipt.correction?.kind === "system" &&
            receipt.correction.note.trim() === run.systemIssueNote &&
            (receipt.correction.runId
              ? receipt.correction.runId === run.id
              : receipt.runIds.includes(run.id)),
        ),
    )
  )
    return null;
  const restored = reconcileInterpretations(receipts, runs);
  const unavailableIds = new Set(
    restored
      .filter(
        (receipt) =>
          receipt.status === "corrected" ||
          receipt.status === "withdrawn" ||
          (receipt.status !== "insufficient" &&
            receipt.nextQuestion.status === "withdrawn"),
      )
      .flatMap((receipt) => receipt.runIds),
  );
  for (const run of runs) if (run.systemIssue) unavailableIds.add(run.id);
  const notes: Record<string, string> = {};
  for (const [key, note] of Object.entries(value.notes)) {
    if (!runIds.has(key) || !text(note, 500)) return null;
    notes[key] = note;
  }
  const coaches: Record<string, Coach> = {};
  for (const [key, input] of Object.entries(value.coaches)) {
    if (
      !runIds.has(key) ||
      !record(input) ||
      !keys(input, [
        "source",
        "title",
        "question",
        "narrative",
        "evidenceIds",
        "generation",
      ]) ||
      !["ai", "authored"].includes(String(input.source)) ||
      !text(input.title, 200) ||
      !text(input.question, 500) ||
      !text(input.narrative, 1000) ||
      !ids(input.evidenceIds, MAX_TEACHING_RUNS) ||
      !input.evidenceIds.includes(key) ||
      input.evidenceIds.some((ref) => !runIds.has(ref))
    )
      return null;
    if (
      input.generation !== undefined &&
      (!record(input.generation) ||
        !keys(input.generation, ["question", "narrative"]) ||
        !["ai-selected", "authored"].includes(
          String(input.generation.question),
        ) ||
        !["ai-selected", "authored"].includes(
          String(input.generation.narrative),
        ))
    )
      return null;
    if (
      unavailableIds.has(key) ||
      input.evidenceIds.some((ref) => unavailableIds.has(ref))
    )
      continue;
    coaches[key] = {
      source: input.source as Coach["source"],
      title: input.title,
      question: input.question,
      narrative: input.narrative,
      evidenceIds: input.evidenceIds,
      ...(input.generation
        ? { generation: input.generation as Coach["generation"] }
        : {}),
    };
  }
  const currentRun = selectCurrentRun(
    runs,
    value.currentRunId,
    value.route,
    value.stage,
  );
  if (value.currentRunId !== null && !currentRun) return null;
  return {
    version: 1,
    route: value.route,
    stage: value.stage,
    plan: { ...value.plan },
    planConfirmed: value.planConfirmed,
    prediction: value.prediction,
    supports: value.supports,
    currentRunId: value.currentRunId,
    runs,
    receipts: restored,
    notes,
    completed:
      (value.completed &&
        currentRun?.stage === "transfer" &&
        currentRun.result.complete &&
        !currentRun.systemIssue) ||
      false,
    coaches,
    ...(value.expeditionId !== undefined
      ? { expeditionId: value.expeditionId }
      : {}),
    ...(value.lastPlayedAt !== undefined
      ? { lastPlayedAt: value.lastPlayedAt }
      : {}),
    ...(value.returnDismissedAt !== undefined
      ? { returnDismissedAt: value.returnDismissedAt }
      : {}),
  };
}

/** The child teaches an executable rule. The engine never invents a mistake. */
export type Route = "ridge" | "meadow";
export type Stage = "first" | "changed" | "transfer";
export type TeachingPlan =
  | { kind: "fixed"; amount: number }
  | { kind: "rounds" }
  | { kind: "fraction"; n: number; d: number };

export interface Context {
  route: Route;
  stage: Stage;
  total: number;
  party: number;
  title: string;
  description: string;
  location: string;
  companions: string[];
  change: string | null;
}

export interface TeachingStep {
  personIndex: number;
  amount: number;
  /** Berries in the shared basket before and after this action. */
  before: number;
  after: number;
  text: string;
}

export interface TeachingResult {
  shares: number[];
  remaining: number;
  complete: boolean;
  /** Equal amounts, including zero. Completion also requires positive shares. */
  fair: boolean;
  steps: TeachingStep[];
  message: string;
  error?: string;
}

export interface RunRecord {
  id: string;
  route: Route;
  stage: Stage;
  context: Context;
  plan: TeachingPlan;
  /** The child's prediction. This is never treated as a mastery score. */
  prediction: string;
  supports: string[];
  date: string;
  result: TeachingResult;
  systemIssue: boolean;
  systemIssueNote?: string;
}

export interface Interpretation {
  id: string;
  runIds: string[];
  text: string;
  status: "insufficient" | "proposed" | "confirmed" | "corrected" | "withdrawn";
  correction?: { kind: "context" | "system"; note: string; runId?: string };
  nextQuestion: {
    text: string;
    status: "active" | "withdrawn";
    dependsOn: string[];
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integerBetween = (
  value: unknown,
  min: number,
  max: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;
const isRoute = (value: unknown): value is Route =>
  value === "ridge" || value === "meadow";
const isStage = (value: unknown): value is Stage =>
  value === "first" || value === "changed" || value === "transfer";

export function isTeachingPlan(value: unknown): value is TeachingPlan {
  if (!isRecord(value)) return false;
  if (value.kind === "rounds") return true;
  if (value.kind === "fixed") return integerBetween(value.amount, 1, 30);
  if (value.kind === "fraction")
    return integerBetween(value.n, 1, 12) && integerBetween(value.d, 1, 12);
  return false;
}

function copyPlan(plan: TeachingPlan): TeachingPlan {
  if (plan.kind === "rounds") return { kind: "rounds" };
  if (plan.kind === "fixed") return { kind: "fixed", amount: plan.amount };
  return { kind: "fraction", n: plan.n, d: plan.d };
}

export function contextFor(route: Route, stage: Stage): Context {
  if (!isRoute(route) || !isStage(stage))
    throw new Error("Choose a known route and expedition stage.");
  if (stage === "transfer")
    return {
      route,
      stage,
      total: 8,
      party: 4,
      title: "A picnic at the summit",
      description:
        "Eight berries. Four friends. Teach Pip to share every berry equally.",
      location: "The summit",
      companions: ["Pip", "Moss", "Wren", "Lumi"],
      change:
        "A new basket has eight berries. Try your teaching with four friends.",
    };
  if (stage === "changed" && route === "ridge")
    return {
      route,
      stage,
      total: 9,
      party: 3,
      title: "The ridge picnic",
      description:
        "There are nine berries left to pack for three friends. Can your teaching adapt?",
      location: "Beacon Ridge",
      companions: ["Pip", "Moss", "Wren"],
      change:
        "The basket changes from twelve berries to nine. The same three friends need equal packs.",
    };
  if (stage === "changed")
    return {
      route,
      stage,
      total: 12,
      party: 4,
      title: "One more friend",
      description:
        "Lumi joins the picnic. Share the same twelve berries among four friends.",
      location: "Meadow Camp",
      companions: ["Pip", "Moss", "Wren", "Lumi"],
      change:
        "Lumi joins the group. Twelve berries now need to serve four friends.",
    };
  return {
    route,
    stage,
    total: 12,
    party: 3,
    title:
      route === "ridge" ? "Pack for Beacon Ridge" : "A basket for Meadow Camp",
    description:
      "Teach Pip how to share twelve berries equally among three friends.",
    location: route === "ridge" ? "Beacon Ridge" : "Meadow Camp",
    companions: ["Pip", "Moss", "Wren"],
    change: null,
  };
}

export function planLabel(plan: TeachingPlan): string {
  if (!isTeachingPlan(plan)) return "An instruction Pip cannot run yet";
  if (plan.kind === "rounds")
    return "Give one berry to each friend. Repeat while there is enough for everyone.";
  if (plan.kind === "fixed")
    return `Give ${plan.amount} ${plan.amount === 1 ? "berry" : "berries"} to each friend.`;
  return `Give each friend ${plan.n}/${plan.d} of the starting basket.`;
}

export function simulateTeaching(
  plan: TeachingPlan,
  total: number,
  party: number,
): TeachingResult {
  if (
    !integerBetween(total, 1, 60) ||
    !integerBetween(party, 2, 6) ||
    !isTeachingPlan(plan)
  ) {
    return {
      shares: integerBetween(party, 2, 6) ? Array(party).fill(0) : [],
      remaining: integerBetween(total, 1, 60) ? total : 0,
      complete: false,
      fair: false,
      steps: [],
      message:
        "Pip needs a whole basket of 1–60 berries, 2–6 friends, and a valid instruction.",
      error: "invalid-input",
    };
  }
  const shares: number[] = Array(party).fill(0);
  const steps: TeachingStep[] = [];
  let remaining = total;
  const give = (personIndex: number, amount: number) => {
    const before = remaining;
    remaining -= amount;
    shares[personIndex] += amount;
    steps.push({
      personIndex,
      amount,
      before,
      after: remaining,
      text: `Friend ${personIndex + 1} receives ${amount} ${amount === 1 ? "berry" : "berries"}. ${remaining} remain in the basket.`,
    });
  };
  if (plan.kind === "rounds") {
    // Do not start a round we cannot finish: the accepted instruction explicitly says so.
    while (remaining >= party)
      for (let person = 0; person < party; person++) give(person, 1);
  } else {
    const amount =
      plan.kind === "fixed" ? plan.amount : (total * plan.n) / plan.d;
    if (!Number.isInteger(amount))
      return {
        shares,
        remaining,
        complete: false,
        fair: true,
        steps,
        message: `That fraction asks Pip to split a berry. This picnic uses whole berries, so Pip pauses before sharing. Try another instruction.`,
        error: "fractional-berry",
      };
    for (let person = 0; person < party; person++) {
      // Executing a different, partial share would silently change the child's rule.
      if (remaining < amount) break;
      give(person, amount);
    }
  }
  const fair = shares.every((share) => share === shares[0]);
  const complete =
    fair && remaining === 0 && shares.every((share) => share > 0);
  const message = complete
    ? `Every friend has ${shares[0]} ${shares[0] === 1 ? "berry" : "berries"}, and the basket is empty. Your teaching worked here.`
    : fair && remaining > 0
      ? `The friends have equal shares, but ${remaining} ${remaining === 1 ? "berry is" : "berries are"} still in the basket. What could you change?`
      : "Pip followed the instruction until the basket could not provide the next whole share. The friends have different amounts. What would you change?";
  return { shares, remaining, complete, fair, steps, message };
}

/** Freeze observed records; corrections add context without rewriting the executed run. */
function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export function createRun(input: {
  id: string;
  route: Route;
  stage: Stage;
  plan: TeachingPlan;
  prediction: string;
  supports: string[];
  date?: string;
}): RunRecord {
  if (!input.id.trim() || input.id.length > 100 || !isTeachingPlan(input.plan))
    throw new Error("A run needs an id and a valid teaching plan.");
  const context = contextFor(input.route, input.stage);
  const plan = copyPlan(input.plan);
  return freezeDeep({
    id: input.id,
    route: input.route,
    stage: input.stage,
    context,
    plan,
    prediction: input.prediction.slice(0, 500),
    supports: [
      ...new Set(input.supports.map((support) => support.slice(0, 100))),
    ].slice(0, 20),
    date: input.date ?? new Date().toISOString(),
    result: simulateTeaching(plan, context.total, context.party),
    systemIssue: false,
  });
}

export function createInterpretation(input: {
  id: string;
  runIds: string[];
  text: string;
  nextQuestion: string;
  runs: readonly RunRecord[];
}): Interpretation {
  if (
    !input.id.trim() ||
    !input.runIds.length ||
    input.runIds.some((id) => !id.trim())
  )
    throw new Error("An interpretation must reference an observed run.");
  const runIds = [...new Set(input.runIds)];
  const observedIds = new Set(input.runs.map((run) => run.id));
  if (runIds.some((id) => !observedIds.has(id)))
    throw new Error(
      "An interpretation cannot reference a missing observation.",
    );
  const issueIds = new Set(
    input.runs.filter((run) => run.systemIssue).map((run) => run.id),
  );
  const sufficient = runIds.filter((id) => !issueIds.has(id)).length >= 2;
  const affected = runIds.some((id) => issueIds.has(id));
  return {
    id: input.id,
    runIds,
    text: input.text,
    status: sufficient ? (affected ? "withdrawn" : "proposed") : "insufficient",
    nextQuestion: {
      text: input.nextQuestion,
      status: sufficient && !affected ? "active" : "withdrawn",
      dependsOn: [input.id],
    },
  };
}

export function confirmInterpretation(receipt: Interpretation): Interpretation {
  // A corrected or withdrawn receipt cannot silently become active again.
  if (receipt.status !== "proposed") return receipt;
  return { ...receipt, status: "confirmed" };
}

export function withdrawInterpretation(
  receipt: Interpretation,
): Interpretation {
  return {
    ...receipt,
    status: "withdrawn",
    nextQuestion: { ...receipt.nextQuestion, status: "withdrawn" },
  };
}

export function correctInterpretation(
  receipt: Interpretation,
  correction: { kind: "context" | "system"; note: string; runId?: string },
  runs: readonly RunRecord[],
): { interpretation: Interpretation; runs: RunRecord[] } {
  if (!correction.note.trim())
    throw new Error("Add a note so the correction remains understandable.");
  if (
    correction.runId !== undefined &&
    (!receipt.runIds.includes(correction.runId) ||
      !runs.some((run) => run.id === correction.runId))
  )
    throw new Error(
      "A correction must refer to an observation in this interpretation.",
    );
  const interpretation: Interpretation = {
    ...receipt,
    status: "corrected",
    correction: { ...correction, note: correction.note.trim().slice(0, 1000) },
    nextQuestion: { ...receipt.nextQuestion, status: "withdrawn" },
  };
  return {
    interpretation,
    runs: runs.map((run) =>
      correction.kind === "system" &&
      (correction.runId
        ? run.id === correction.runId
        : receipt.runIds.includes(run.id))
        ? freezeDeep({
            ...run,
            systemIssue: true,
            systemIssueNote: interpretation.correction!.note,
          })
        : run,
    ),
  };
}

/** Invalidate every question that depends on an interpretation the family corrected. */
export function invalidateDependentQuestions(
  receipts: readonly Interpretation[],
  correctedId: string,
): Interpretation[] {
  const invalidIds = new Set([correctedId]);
  // Walk the dependency graph, including indirect questions, without mutating history.
  let changed = true;
  while (changed) {
    changed = false;
    for (const receipt of receipts)
      if (
        !invalidIds.has(receipt.id) &&
        receipt.nextQuestion.dependsOn.some((id) => invalidIds.has(id))
      ) {
        invalidIds.add(receipt.id);
        changed = true;
      }
  }
  return receipts.map((receipt) =>
    invalidIds.has(receipt.id)
      ? {
          ...receipt,
          nextQuestion: { ...receipt.nextQuestion, status: "withdrawn" },
        }
      : receipt,
  );
}

/** Recheck live evidence after restore or correction. More observations never revive an old claim. */
export function reconcileInterpretations(
  receipts: readonly Interpretation[],
  runs: readonly RunRecord[],
): Interpretation[] {
  const observedIds = new Set(runs.map((run) => run.id));
  const issueIds = new Set(
    runs.filter((run) => run.systemIssue).map((run) => run.id),
  );
  const receiptIds = new Set(receipts.map((receipt) => receipt.id));
  let checked = receipts.map((receipt) => {
    const runIds = [...new Set(receipt.runIds)];
    const missing = runIds.some((id) => !observedIds.has(id));
    const affected = runIds.some((id) => issueIds.has(id));
    const eligibleCount = runIds.filter(
      (id) => observedIds.has(id) && !issueIds.has(id),
    ).length;
    let status = receipt.status;
    if (status === "proposed" || status === "confirmed") {
      if (missing || affected) status = "withdrawn";
      else if (eligibleCount < 2) status = "insufficient";
    }
    const inactive =
      status === "insufficient" ||
      status === "corrected" ||
      status === "withdrawn" ||
      missing ||
      affected ||
      eligibleCount < 2 ||
      receipt.nextQuestion.dependsOn.some((id) => !receiptIds.has(id));
    return {
      ...receipt,
      runIds,
      status,
      nextQuestion: {
        ...receipt.nextQuestion,
        status: inactive ? ("withdrawn" as const) : receipt.nextQuestion.status,
      },
    };
  });
  for (const receipt of checked)
    if (receipt.nextQuestion.status === "withdrawn")
      checked = invalidateDependentQuestions(checked, receipt.id);
  return checked;
}

export function createEvidenceSummary(runs: readonly RunRecord[]) {
  const eligible = runs.filter((run) => !run.systemIssue);
  return {
    recordedRuns: runs.length,
    eligibleRuns: eligible.length,
    systemIssues: runs.length - eligible.length,
    completedRuns: eligible.filter((run) => run.result.complete).length,
    runsWithSupport: eligible.filter((run) => run.supports.length > 0).length,
    runsWithoutSupport: eligible.filter((run) => run.supports.length === 0)
      .length,
    predictionsRecorded: eligible.filter((run) => run.prediction.trim() !== "")
      .length,
    transferRuns: eligible.filter((run) => run.stage === "transfer").length,
    completedTransferRuns: eligible.filter(
      (run) => run.stage === "transfer" && run.result.complete,
    ).length,
    unsupportedCompletedTransferRuns: eligible.filter(
      (run) =>
        run.stage === "transfer" &&
        run.result.complete &&
        run.supports.length === 0,
    ).length,
    statement:
      "These counts describe the recorded attempts. They do not establish lasting mastery, a learning style, or a personality trait.",
  };
}

/** A historical match never implicitly becomes the active attempt of a new climb. */
export function selectCurrentRun(
  runs: readonly RunRecord[],
  currentRunId: string | null,
  route: Route | null,
  stage: Stage,
): RunRecord | null {
  if (!currentRunId || !route) return null;
  return (
    runs.find(
      (run) =>
        run.id === currentRunId && run.route === route && run.stage === stage,
    ) ?? null
  );
}

/** Rebuild stored observations from executable inputs, never trust stored result claims. */
export function validateRunRecords(value: unknown): RunRecord[] | null {
  if (!Array.isArray(value) || value.length > 200) return null;
  const ids = new Set<string>();
  const records: RunRecord[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      item.id.length > 100 ||
      ids.has(item.id) ||
      !isRoute(item.route) ||
      !isStage(item.stage) ||
      !isTeachingPlan(item.plan) ||
      typeof item.prediction !== "string" ||
      item.prediction.length > 500 ||
      !Array.isArray(item.supports) ||
      item.supports.length > 20 ||
      item.supports.some((s) => typeof s !== "string" || s.length > 100) ||
      typeof item.date !== "string" ||
      !Number.isFinite(Date.parse(item.date)) ||
      typeof item.systemIssue !== "boolean" ||
      (item.systemIssue &&
        (typeof item.systemIssueNote !== "string" ||
          !item.systemIssueNote.trim() ||
          item.systemIssueNote.length > 1000))
    )
      return null;
    ids.add(item.id);
    const run = createRun({
      id: item.id,
      route: item.route,
      stage: item.stage,
      plan: item.plan,
      prediction: item.prediction,
      supports: item.supports as string[],
      date: item.date,
    });
    records.push(
      item.systemIssue
        ? freezeDeep({
            ...run,
            systemIssue: true,
            systemIssueNote: item.systemIssueNote as string,
          })
        : run,
    );
  }
  return records;
}

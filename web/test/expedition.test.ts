import test from "node:test";
import assert from "node:assert/strict";
import {
  contextFor,
  isTeachingPlan,
  planLabel,
  simulateTeaching,
  createRun,
  createInterpretation,
  correctInterpretation,
  confirmInterpretation,
  withdrawInterpretation,
  invalidateDependentQuestions,
  createEvidenceSummary,
  validateRunRecords,
  selectCurrentRun,
  reconcileInterpretations,
} from "../../shared/expedition.ts";
import type { TeachingPlan, RunRecord } from "../../shared/expedition.ts";

const run = (
  id = "run-1",
  overrides: Partial<Parameters<typeof createRun>[0]> = {},
) =>
  createRun({
    id,
    route: "ridge",
    stage: "first",
    plan: { kind: "fixed", amount: 4 },
    prediction: "4",
    supports: [],
    date: "2026-09-16T12:00:00.000Z",
    ...overrides,
  });

test("the two routes change different quantities and converge on a common transfer", () => {
  for (const route of ["ridge", "meadow"] as const) {
    const initial = contextFor(route, "first");
    assert.deepEqual([initial.total, initial.party], [12, 3]);
    const transfer = contextFor(route, "transfer");
    assert.deepEqual([transfer.total, transfer.party], [8, 4]);
  }
  assert.deepEqual(
    [
      contextFor("ridge", "changed").total,
      contextFor("ridge", "changed").party,
    ],
    [9, 3],
  );
  assert.deepEqual(
    [
      contextFor("meadow", "changed").total,
      contextFor("meadow", "changed").party,
    ],
    [12, 4],
  );
});

test("context copies cannot rewrite a future scene", () => {
  const scene = contextFor("meadow", "changed");
  scene.companions.pop();
  scene.total = 100;
  assert.equal(contextFor("meadow", "changed").companions.length, 4);
  assert.equal(contextFor("meadow", "changed").total, 12);
});

test("fixed teaching succeeds on the first try without an invented failure", () => {
  const result = simulateTeaching({ kind: "fixed", amount: 4 }, 12, 3);
  assert.equal(result.complete, true);
  assert.deepEqual(result.shares, [4, 4, 4]);
  assert.deepEqual(
    result.steps.map((step) => [
      step.personIndex,
      step.amount,
      step.before,
      step.after,
    ]),
    [
      [0, 4, 12, 8],
      [1, 4, 8, 4],
      [2, 4, 4, 0],
    ],
  );
});

test("too-small fixed shares leave berries instead of silently changing teaching", () => {
  const result = simulateTeaching({ kind: "fixed", amount: 3 }, 12, 3);
  assert.deepEqual(result.shares, [3, 3, 3]);
  assert.equal(result.remaining, 3);
  assert.equal(result.fair, true);
  assert.equal(result.complete, false);
});

test("an unaffordable share stops execution without creating a partial share", () => {
  const result = simulateTeaching({ kind: "fixed", amount: 5 }, 12, 3);
  assert.deepEqual(result.shares, [5, 5, 0]);
  assert.equal(result.remaining, 2);
  assert.equal(result.steps.length, 2);
  assert.equal(result.fair, false);
  assert.equal(result.complete, false);
});

test("a changed basket reveals the consequence of keeping a fixed rule", () => {
  const plan: TeachingPlan = { kind: "fixed", amount: 4 };
  assert.equal(simulateTeaching(plan, 12, 3).complete, true);
  const result = simulateTeaching(plan, 9, 3);
  assert.deepEqual(result.shares, [4, 4, 0]);
  assert.equal(result.remaining, 1);
  assert.equal(result.complete, false);
});

test("a new companion changes what the same fixed rule produces", () => {
  const result = simulateTeaching({ kind: "fixed", amount: 4 }, 12, 4);
  assert.deepEqual(result.shares, [4, 4, 4, 0]);
  assert.equal(result.remaining, 0);
  assert.equal(result.complete, false);
});

test("rounds execute each individual distribution and transfer without forced revision", () => {
  for (const [total, party] of [
    [12, 3],
    [9, 3],
    [12, 4],
    [8, 4],
  ]) {
    const result = simulateTeaching({ kind: "rounds" }, total, party);
    assert.equal(result.complete, true);
    assert.equal(result.steps.length, total);
    assert.ok(result.steps.every((step) => step.amount === 1));
    assert.ok(result.shares.every((share) => share === total / party));
  }
});

test("rounds never begin a round that cannot finish", () => {
  const result = simulateTeaching({ kind: "rounds" }, 10, 3);
  assert.deepEqual(result.shares, [3, 3, 3]);
  assert.equal(result.remaining, 1);
  assert.equal(result.complete, false);
  assert.equal(result.fair, true);
});

test("fractions refer to the starting basket, not the diminishing remainder", () => {
  const result = simulateTeaching({ kind: "fraction", n: 1, d: 3 }, 12, 3);
  assert.deepEqual(result.shares, [4, 4, 4]);
  assert.equal(result.complete, true);
  assert.equal(
    simulateTeaching({ kind: "fraction", n: 2, d: 6 }, 12, 3).complete,
    true,
  );
});

test("fraction teaching generalizes to a smaller basket with the same party", () => {
  const result = simulateTeaching({ kind: "fraction", n: 1, d: 3 }, 9, 3);
  assert.deepEqual(result.shares, [3, 3, 3]);
  assert.equal(result.complete, true);
});

test("fraction teaching still requires adapting to a new party", () => {
  const result = simulateTeaching({ kind: "fraction", n: 1, d: 3 }, 12, 4);
  assert.deepEqual(result.shares, [4, 4, 4, 0]);
  assert.equal(result.complete, false);
  assert.equal(
    simulateTeaching({ kind: "fraction", n: 1, d: 4 }, 12, 4).complete,
    true,
  );
});

test("fractional berries pause execution before giving any pieces", () => {
  const result = simulateTeaching({ kind: "fraction", n: 1, d: 5 }, 12, 3);
  assert.equal(result.error, "fractional-berry");
  assert.deepEqual(result.shares, [0, 0, 0]);
  assert.equal(result.steps.length, 0);
  assert.equal(result.remaining, 12);
  assert.equal(result.complete, false);
});

test("overlarge fractions cannot fabricate berries", () => {
  const result = simulateTeaching({ kind: "fraction", n: 2, d: 1 }, 12, 3);
  assert.deepEqual(result.shares, [0, 0, 0]);
  assert.equal(result.remaining, 12);
  assert.equal(result.complete, false);
});

test("invalid and unbounded inputs are rejected with bounded results", () => {
  for (const plan of [
    null,
    { kind: "fixed", amount: -1 },
    { kind: "fixed", amount: 1.5 },
    { kind: "fixed", amount: Infinity },
    { kind: "fraction", n: 1, d: 0 },
    { kind: "fraction", n: 13, d: 1 },
    { kind: "unknown" },
  ]) {
    assert.equal(isTeachingPlan(plan), false);
    assert.equal(
      simulateTeaching(plan as TeachingPlan, 12, 3).error,
      "invalid-input",
    );
  }
  for (const [total, party] of [
    [0, 3],
    [61, 3],
    [NaN, 3],
    [12, 0],
    [12, Infinity],
    [12, 1000000],
  ]) {
    const result = simulateTeaching({ kind: "rounds" }, total, party);
    assert.equal(result.error, "invalid-input");
    assert.equal(result.complete, false);
    assert.ok(result.shares.length <= 6);
  }
});

test("all bounded instructions conserve berries and traces reproduce outcomes", () => {
  const plans: TeachingPlan[] = [{ kind: "rounds" }];
  for (let amount = 1; amount <= 30; amount++)
    plans.push({ kind: "fixed", amount });
  for (let n = 1; n <= 12; n++)
    for (let d = 1; d <= 12; d++) plans.push({ kind: "fraction", n, d });
  let combinations = 0;
  for (let total = 1; total <= 60; total++)
    for (let party = 2; party <= 6; party++)
      for (const plan of plans) {
        const result = simulateTeaching(plan, total, party);
        combinations++;
        assert.equal(
          result.remaining + result.shares.reduce((sum, n) => sum + n, 0),
          total,
        );
        assert.ok(result.shares.every((n) => Number.isInteger(n) && n >= 0));
        assert.ok(result.steps.length <= 60);
        const reconstructed = Array(party).fill(0);
        let basket = total;
        for (const step of result.steps) {
          assert.equal(step.before, basket);
          assert.equal(step.after, basket - step.amount);
          assert.ok(step.personIndex >= 0 && step.personIndex < party);
          reconstructed[step.personIndex] += step.amount;
          basket = step.after;
        }
        assert.deepEqual(reconstructed, result.shares);
        assert.equal(
          result.complete,
          result.remaining === 0 &&
            result.shares.every((n) => n > 0 && n === result.shares[0]),
        );
      }
  assert.equal(combinations, 52500);
});

test("plan descriptions expose the precise rounds and fraction semantics", () => {
  assert.match(
    planLabel({ kind: "rounds" }),
    /while there is enough for everyone/,
  );
  assert.match(planLabel({ kind: "fraction", n: 1, d: 3 }), /starting basket/);
});

test("simulation and run recording leave caller-owned inputs unchanged", () => {
  const plan: TeachingPlan = { kind: "fixed", amount: 4 };
  const supports = ["Picture"];
  const record = run("one", { plan, supports });
  assert.deepEqual(plan, { kind: "fixed", amount: 4 });
  plan.amount = 2;
  supports.push("Hint");
  assert.deepEqual(record.plan, { kind: "fixed", amount: 4 });
  assert.deepEqual(record.supports, ["Picture"]);
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.result.steps), true);
  assert.throws(() => {
    record.result.shares[0] = 100;
  }, TypeError);
});

test("an interpretation begins as a proposal linked to the evidence", () => {
  const ids = ["run-1", "run-2"];
  const receipt = createInterpretation({
    id: "thought-1",
    runIds: ids,
    runs: [run(), run("run-2")],
    text: "Maybe the child adapted a fixed rule.",
    nextQuestion: "What changed?",
  });
  ids.push("not-a-real-run");
  assert.deepEqual(receipt.runIds, ["run-1", "run-2"]);
  assert.equal(receipt.status, "proposed");
  assert.deepEqual(receipt.nextQuestion.dependsOn, ["thought-1"]);
  assert.throws(() =>
    createInterpretation({
      id: "x",
      runIds: [],
      runs: [],
      text: "Unsupported",
      nextQuestion: "?",
    }),
  );
});

test("a family correction preserves observations and withdraws the dependent question", () => {
  const observed = run();
  const original = JSON.stringify(observed);
  const receipt = createInterpretation({
    id: "thought-1",
    runIds: [observed.id, "run-2"],
    runs: [observed, run("run-2")],
    text: "The learner guessed.",
    nextQuestion: "Why guess?",
  });
  const corrected = correctInterpretation(
    receipt,
    { kind: "context", note: "I counted in my head." },
    [observed],
  );
  assert.equal(corrected.interpretation.status, "corrected");
  assert.equal(corrected.interpretation.nextQuestion.status, "withdrawn");
  assert.equal(
    corrected.interpretation.correction?.note,
    "I counted in my head.",
  );
  assert.equal(JSON.stringify(corrected.runs[0]), original);
  assert.equal(receipt.status, "proposed");
  assert.equal(receipt.nextQuestion.status, "active");
});

test("a system misunderstanding is excluded from learner performance counts", () => {
  const badRun = run("bad", {
    plan: { kind: "fixed", amount: 5 },
    supports: ["Hint"],
  });
  const goodRun = run("good");
  const receipt = createInterpretation({
    id: "thought-1",
    runIds: ["bad"],
    runs: [badRun, goodRun],
    text: "The child chose five.",
    nextQuestion: "Try four?",
  });
  const corrected = correctInterpretation(
    receipt,
    { kind: "system", note: "Pip misunderstood my instruction." },
    [badRun, goodRun],
  );
  assert.equal(corrected.runs[0].systemIssue, true);
  assert.equal(corrected.runs[1].systemIssue, false);
  assert.deepEqual(corrected.runs[0].result, badRun.result);
  const summary = createEvidenceSummary(corrected.runs);
  assert.equal(summary.recordedRuns, 2);
  assert.equal(summary.eligibleRuns, 1);
  assert.equal(summary.completedRuns, 1);
  assert.equal(summary.runsWithSupport, 0);
  assert.equal(summary.systemIssues, 1);
});

test("corrections require usable context and cannot be silently reconfirmed", () => {
  const receipt = createInterpretation({
    id: "idea",
    runIds: ["run-1", "run-2"],
    runs: [run(), run("run-2")],
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  assert.throws(() =>
    correctInterpretation(receipt, { kind: "context", note: "   " }, [run()]),
  );
  const corrected = correctInterpretation(
    receipt,
    { kind: "context", note: "I meant something else." },
    [run()],
  ).interpretation;
  assert.equal(confirmInterpretation(corrected).status, "corrected");
  assert.equal(
    confirmInterpretation(withdrawInterpretation(receipt)).status,
    "withdrawn",
  );
  assert.equal(confirmInterpretation(receipt).status, "confirmed");
});

test("cross-linked questions are invalidated without deleting other observations", () => {
  const observations = ["a", "b", "c"].map((id) => run(id));
  const first = createInterpretation({
    id: "first",
    runIds: ["a", "b"],
    runs: observations,
    text: "One",
    nextQuestion: "Question one",
  });
  const second = createInterpretation({
    id: "second",
    runIds: ["a", "b"],
    runs: observations,
    text: "Two",
    nextQuestion: "Question two",
  });
  second.nextQuestion.dependsOn.push("first");
  const unrelated = createInterpretation({
    id: "third",
    runIds: ["b", "c"],
    runs: observations,
    text: "Three",
    nextQuestion: "Question three",
  });
  const updated = invalidateDependentQuestions(
    [first, second, unrelated],
    "first",
  );
  assert.deepEqual(
    updated.map((item) => item.nextQuestion.status),
    ["withdrawn", "withdrawn", "active"],
  );
  assert.equal(second.nextQuestion.status, "active");
});

test("session evidence keeps support, transfer, predictions, and outcomes distinct", () => {
  const summary = createEvidenceSummary([
    run("first"),
    run("supported", {
      stage: "transfer",
      plan: { kind: "rounds" },
      supports: ["Opened a picture"],
    }),
    run("independent", {
      stage: "transfer",
      plan: { kind: "fraction", n: 1, d: 4 },
      prediction: "",
    }),
  ]);
  assert.equal(summary.completedRuns, 3);
  assert.equal(summary.predictionsRecorded, 2);
  assert.equal(summary.runsWithSupport, 1);
  assert.equal(summary.completedTransferRuns, 2);
  assert.equal(summary.unsupportedCompletedTransferRuns, 1);
  assert.match(summary.statement, /do not establish lasting mastery/);
});

test("stored observations are reconstructed instead of accepting forged results", () => {
  const stored = JSON.parse(JSON.stringify([run()]));
  stored[0].result.shares = [99, 99, 99];
  stored[0].result.complete = false;
  stored[0].context.total = 999;
  const restored = validateRunRecords(stored)!;
  assert.deepEqual(restored[0].result.shares, [4, 4, 4]);
  assert.equal(restored[0].result.complete, true);
  assert.equal(restored[0].context.total, 12);
});

test("stored system corrections survive restoration", () => {
  const receipt = createInterpretation({
    id: "idea",
    runIds: ["run-1"],
    runs: [run()],
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  const corrected = correctInterpretation(
    receipt,
    { kind: "system", note: "Wrong accepted instruction." },
    [run()],
  );
  const restored = validateRunRecords(
    JSON.parse(JSON.stringify(corrected.runs)),
  )!;
  assert.equal(restored[0].systemIssue, true);
  assert.equal(createEvidenceSummary(restored).eligibleRuns, 0);
});

test("invalid, duplicated, oversized, or ambiguous stored records are rejected", () => {
  assert.equal(validateRunRecords({ runs: [] }), null);
  assert.equal(validateRunRecords(Array(201).fill(run())), null);
  assert.equal(validateRunRecords([run(), run()]), null);
  for (const replacement of [
    { route: "ocean" },
    { stage: "hidden" },
    { date: "yesterday-ish" },
    { supports: [42] },
    { prediction: false },
    { plan: { kind: "fixed", amount: 0 } },
    { systemIssue: true },
    { systemIssue: true, systemIssueNote: "" },
  ])
    assert.equal(validateRunRecords([{ ...run(), ...replacement }]), null);
  assert.deepEqual(validateRunRecords([]), []);
});

test("a new expedition does not resurrect a historical result on the same route and stage", () => {
  const past = run("previous-expedition");
  assert.equal(selectCurrentRun([past], null, "ridge", "first"), null);
  assert.equal(selectCurrentRun([past], null, null, "first"), null);
});

test("only the explicit current attempt resumes after restoring the journal", () => {
  const records = validateRunRecords(
    JSON.parse(JSON.stringify([run("one"), run("two")])),
  );
  const current = selectCurrentRun(records!, "one", "ridge", "first");
  assert.equal(current?.id, "one");
  assert.equal(current?.result.steps.length, 3);
  assert.equal(selectCurrentRun(records!, "one", "meadow", "first"), null);
  assert.equal(selectCurrentRun(records!, "one", "ridge", "changed"), null);
  assert.equal(selectCurrentRun(records!, "missing", "ridge", "first"), null);
});

test("current system issues remain inspectable without falling back to an older success", () => {
  const old = run("old-success");
  const current = run("current");
  const receipt = createInterpretation({
    id: "correction",
    runIds: ["current"],
    runs: [current],
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  const { runs } = correctInterpretation(
    receipt,
    { kind: "system", note: "The interface selected the wrong instruction." },
    [old, current],
  );
  const selected = selectCurrentRun(runs, "current", "ridge", "first");
  assert.equal(selected?.id, "current");
  assert.equal(selected?.systemIssue, true);
});

test("one observation is insufficient and cannot be confirmed or promoted by later observations", () => {
  const first = run("one");
  const receipt = createInterpretation({
    id: "idea",
    runIds: [first.id],
    runs: [first],
    text: "A possible explanation.",
    nextQuestion: "Why?",
  });
  assert.equal(receipt.status, "insufficient");
  assert.equal(receipt.nextQuestion.status, "withdrawn");
  assert.equal(confirmInterpretation(receipt).status, "insufficient");
  assert.equal(
    reconcileInterpretations([receipt], [first, run("later")])[0].status,
    "insufficient",
  );
});

test("repeated references or source records cannot manufacture a second observed event", () => {
  const first = run("one");
  const receipt = createInterpretation({
    id: "idea",
    runIds: ["one", "one"],
    runs: [first, first],
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  assert.deepEqual(receipt.runIds, ["one"]);
  assert.equal(receipt.status, "insufficient");
  assert.equal(receipt.nextQuestion.status, "withdrawn");
});

test("an unknown evidence reference is rejected even when two valid observations exist", () => {
  assert.throws(
    () =>
      createInterpretation({
        id: "idea",
        runIds: ["one", "two", "missing"],
        runs: [run("one"), run("two")],
        text: "Maybe.",
        nextQuestion: "Why?",
      }),
    /missing observation/,
  );
});

test("a system issue does not meet the evidence floor or support an active question", () => {
  const issue = {
    ...run("issue"),
    systemIssue: true,
    systemIssueNote: "Wrong instruction accepted.",
  };
  const observations = [run("one"), run("two"), issue];
  const insufficient = createInterpretation({
    id: "one",
    runIds: ["one", "issue"],
    runs: observations,
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  assert.equal(insufficient.status, "insufficient");
  assert.equal(insufficient.nextQuestion.status, "withdrawn");
  const contaminated = createInterpretation({
    id: "two",
    runIds: ["one", "two", "issue"],
    runs: observations,
    text: "Maybe.",
    nextQuestion: "Why?",
  });
  assert.equal(contaminated.status, "withdrawn");
  assert.equal(contaminated.nextQuestion.status, "withdrawn");
});

test("restoring old one-event claims lowers them to insufficient without rewriting their text", () => {
  const observations = [run("one"), run("two")];
  const modern = createInterpretation({
    id: "idea",
    runIds: ["one", "two"],
    runs: observations,
    text: "Historical claim.",
    nextQuestion: "Historical follow-up?",
  });
  const old = { ...modern, status: "confirmed" as const, runIds: ["one"] };
  const restored = reconcileInterpretations([old], observations)[0];
  assert.equal(restored.status, "insufficient");
  assert.equal(restored.text, old.text);
  assert.equal(restored.nextQuestion.status, "withdrawn");
  const missing = reconcileInterpretations([modern], [observations[0]])[0];
  assert.equal(missing.status, "withdrawn");
  assert.equal(missing.nextQuestion.status, "withdrawn");
});

test("a targeted system correction excludes only that event and withdraws shared and indirect questions", () => {
  const observations = [run("one"), run("two"), run("three")];
  const make = (id: string, runIds: string[]) =>
    createInterpretation({
      id,
      runIds,
      runs: observations,
      text: "Maybe.",
      nextQuestion: "Why?",
    });
  const first = make("first", ["one", "two"]);
  const shared = make("shared", ["two", "three"]);
  const indirect = make("indirect", ["one", "three"]);
  indirect.nextQuestion.dependsOn.push(shared.id);
  const unaffected = make("unaffected", ["one", "three"]);
  const correction = correctInterpretation(
    first,
    { kind: "system", runId: "two", note: "Pip accepted the wrong control." },
    observations,
  );
  assert.deepEqual(
    correction.runs.map((r) => r.systemIssue),
    [false, true, false],
  );
  assert.deepEqual(correction.runs[1].result, observations[1].result);
  const reconciled = reconcileInterpretations(
    [correction.interpretation, shared, indirect, unaffected],
    correction.runs,
  );
  assert.deepEqual(
    reconciled.map((r) => r.nextQuestion.status),
    ["withdrawn", "withdrawn", "withdrawn", "active"],
  );
  assert.equal(reconciled[0].status, "corrected");
  assert.equal(reconciled[0].correction?.runId, "two");
  assert.throws(
    () =>
      correctInterpretation(
        first,
        { kind: "system", runId: "three", note: "Unrelated." },
        observations,
      ),
    /observation in this interpretation/,
  );
});

test("context correction propagates through multiple dependent questions while preserving observed results", () => {
  const observations = [run("one"), run("two")];
  const make = (id: string) =>
    createInterpretation({
      id,
      runIds: ["one", "two"],
      runs: observations,
      text: "Maybe.",
      nextQuestion: "Why?",
    });
  const first = make("first"),
    second = make("second"),
    third = make("third");
  second.nextQuestion.dependsOn.push(first.id);
  third.nextQuestion.dependsOn.push(second.id);
  const correction = correctInterpretation(
    first,
    { kind: "context", runId: "two", note: "I counted in my head." },
    observations,
  );
  const revised = reconcileInterpretations(
    [third, second, correction.interpretation],
    correction.runs,
  );
  assert.ok(
    revised.every((receipt) => receipt.nextQuestion.status === "withdrawn"),
  );
  assert.deepEqual(correction.runs, observations);
});

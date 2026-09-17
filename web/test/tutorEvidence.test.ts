import test from "node:test";
import assert from "node:assert/strict";
import {
  createRun,
  createInterpretation,
  correctInterpretation,
} from "../../shared/expedition.ts";
import type { RunRecord } from "../../shared/expedition.ts";
import { buildTutorBrief } from "../src/tutorEvidence.ts";

const run = (
  id: string,
  overrides: Partial<Parameters<typeof createRun>[0]> = {},
) =>
  createRun({
    id,
    route: "meadow",
    stage: "first",
    plan: { kind: "fixed", amount: 4 },
    prediction: "4",
    supports: [],
    date: "2026-09-16T12:00:00.000Z",
    ...overrides,
  });
const texts = (rows: ReturnType<typeof buildTutorBrief>, key: string) =>
  rows
    .find((row) => row.key === key)!
    .lines.map((line) => line.text)
    .join(" ");
const receipt = (
  runs: RunRecord[],
  question = "What changed between these attempts?",
) =>
  createInterpretation({
    id: "idea",
    runs,
    runIds: runs.map((run) => run.id),
    text: "A tentative interpretation.",
    nextQuestion: question,
  });

test("an empty tutor brief asks for observations instead of inventing a learner profile", () => {
  const rows = buildTutorBrief([], []);
  assert.equal(rows.length, 4);
  assert.match(texts(rows, "demonstrated"), /No eligible teaching/);
  assert.match(texts(rows, "uncertain"), /Two eligible observations/);
  assert.ok(
    rows.every((row) => row.lines.every((line) => line.runIds.length === 0)),
  );
});

test("one recorded success remains an observation and does not open an interpretation-based question", () => {
  const runs = [run("one")];
  const rows = buildTutorBrief(runs, [receipt(runs)]);
  assert.match(texts(rows, "demonstrated"), /1 of 1 eligible attempt/);
  assert.match(texts(rows, "uncertain"), /Another is needed/);
  assert.match(
    texts(rows, "next"),
    /No interpretation-based question is active yet/,
  );
  assert.doesNotMatch(texts(rows, "next"), /What changed between/);
});

test("transfer success and support are separate evidence with inspectable run references", () => {
  const runs = [
    run("first"),
    run("supported-transfer", {
      stage: "transfer",
      plan: { kind: "rounds" },
      supports: ["picture", "coach"],
    }),
  ];
  const rows = buildTutorBrief(runs, [receipt(runs)]);
  assert.match(
    texts(rows, "demonstrated"),
    /8 berries shared among 4 friends, with recorded support/,
  );
  assert.match(texts(rows, "demonstrated"), /not proof of mastery/);
  assert.match(
    texts(rows, "support"),
    /1 attempt had recorded support: picture, coach/,
  );
  assert.match(
    texts(rows, "support"),
    /1 attempt had no recorded picture or coach/,
  );
  assert.deepEqual(rows.find((row) => row.key === "next")!.lines[0].runIds, [
    "first",
    "supported-transfer",
  ]);
  assert.equal(texts(rows, "next"), "What changed between these attempts?");
});

test("different fixed instructions are never presented as a generalized teaching rule", () => {
  const runs = [
    run("first"),
    run("transfer", { stage: "transfer", plan: { kind: "fixed", amount: 2 } }),
  ];
  const rows = buildTutorBrief(runs, []);
  assert.match(texts(rows, "demonstrated"), /local transfer observation/);
  assert.doesNotMatch(
    texts(rows, "demonstrated"),
    /same teaching|generalized|general rule|mastered/,
  );
});

test("system issues remain inspectable but disappear from learning and support counts", () => {
  const runs = [
    run("one"),
    run("issue", {
      stage: "transfer",
      plan: { kind: "rounds" },
      supports: ["coach"],
    }),
  ];
  const proposed = receipt(runs);
  const corrected = correctInterpretation(
    proposed,
    {
      kind: "system",
      runId: "issue",
      note: "Pip misunderstood my instruction.",
    },
    runs,
  );
  const rows = buildTutorBrief(corrected.runs, [corrected.interpretation]);
  assert.match(texts(rows, "demonstrated"), /1 of 1/);
  assert.doesNotMatch(texts(rows, "demonstrated"), /Summit check/);
  assert.match(texts(rows, "uncertain"), /1 system issue is excluded/);
  assert.match(texts(rows, "uncertain"), /Pip misunderstood my instruction/);
  assert.doesNotMatch(texts(rows, "support"), /had recorded support/);
  assert.doesNotMatch(texts(rows, "next"), /What changed between/);
  assert.ok(
    rows
      .find((row) => row.key === "uncertain")!
      .lines.some((line) => line.runIds.includes("issue")),
  );
});

test("a context correction withdraws a dependent question without deleting observed performance", () => {
  const runs = [run("one"), run("two")];
  const corrected = correctInterpretation(
    receipt(runs),
    { kind: "context", runId: "two", note: "I counted in my head." },
    runs,
  );
  const rows = buildTutorBrief(corrected.runs, [corrected.interpretation]);
  assert.match(texts(rows, "demonstrated"), /2 of 2/);
  assert.match(texts(rows, "uncertain"), /I counted in my head/);
  assert.match(
    texts(rows, "next"),
    /No interpretation-based question is active/,
  );
});

test("learner notes are attributed as an account rather than an inferred explanation", () => {
  const rows = buildTutorBrief([run("one")], [], {
    one: "I was checking what Pip would do.",
  });
  assert.match(texts(rows, "uncertain"), /Learner's note/);
  assert.match(texts(rows, "uncertain"), /not an inferred explanation/);
  assert.deepEqual(
    rows.find((row) => row.key === "uncertain")!.lines.at(-1)!.runIds,
    ["one"],
  );
});

test("duplicate run input cannot inflate the brief or bypass the interpretation floor", () => {
  const first = run("one");
  const rows = buildTutorBrief([first, first], [receipt([first, first])]);
  assert.match(texts(rows, "demonstrated"), /1 of 1/);
  assert.match(texts(rows, "uncertain"), /One eligible observation/);
  assert.match(
    texts(rows, "next"),
    /No interpretation-based question is active yet/,
  );
});

test("a still-active receipt cannot leak a question through a corrected dependency", () => {
  const runs = [run("one"), run("two")];
  const original = receipt(runs);
  const corrected = correctInterpretation(
    original,
    { kind: "context", note: "Not what I meant." },
    runs,
  ).interpretation;
  const dependent = {
    ...receipt(runs, "A dependent question?"),
    id: "second",
    nextQuestion: {
      text: "A dependent question?",
      status: "active" as const,
      dependsOn: ["idea", "second"],
    },
  };
  const rows = buildTutorBrief(runs, [corrected, dependent]);
  assert.doesNotMatch(texts(rows, "next"), /A dependent question/);
});

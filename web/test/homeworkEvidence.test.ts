import test from "node:test";
import assert from "node:assert/strict";
import {
  homeworkFacts,
  fetchHomeworkEvidence,
} from "../src/homeworkEvidenceModel.ts";
import type { HomeworkEvidence } from "../../shared/homeworkEvidence.ts";

const worksheet = (
  id: string,
  outcomes = { spotted: true, explained: false, fixed: true },
): HomeworkEvidence => ({
  id,
  skill_id: "add20",
  skill_name: "Add within 20",
  level: 1,
  created_at: 1,
  completed_at: 2,
  problems: [],
  reasons: [],
  response: { spotted_index: 0, reason: "none", fixed_answer: 5 },
  result: {
    ...outcomes,
    wrong_index: 0,
    slip: "off_by_one",
    correct_answer: 5,
  },
});

test("worksheet facts keep finding, naming, and fixing distinct with source references", () => {
  const records = [
    worksheet("new"),
    worksheet("old", { spotted: true, explained: true, fixed: false }),
  ];
  const facts = homeworkFacts(records);
  assert.deepEqual(
    facts.map((fact) => fact.count),
    [2, 1, 1],
  );
  assert.deepEqual(
    facts.map((fact) => fact.worksheetIds),
    [["new", "old"], ["old"], ["new"]],
  );
  assert.ok(facts.every((fact) => fact.total === 2));
  assert.doesNotMatch(
    facts.map((fact) => fact.text).join(" "),
    /mastered|independent|learning style/i,
  );
});

test("zero successes remain linked to the completed observations, not an empty claim", () => {
  const facts = homeworkFacts([
    worksheet("one", { spotted: false, explained: false, fixed: false }),
  ]);
  for (const fact of facts) {
    assert.equal(fact.count, 0);
    assert.deepEqual(fact.worksheetIds, ["one"]);
  }
});

test("duplicate worksheet IDs cannot inflate evidence and an empty journal invents none", () => {
  const record = worksheet("one");
  assert.ok(homeworkFacts([record, record]).every((fact) => fact.total === 1));
  assert.ok(
    homeworkFacts([]).every(
      (fact) => fact.total === 0 && fact.worksheetIds.length === 0,
    ),
  );
});

test("a reload requests fresh server evidence with a cancellable request", async (context) => {
  const controller = new AbortController();
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (url: string, options: RequestInit) => {
      calls++;
      assert.equal(url, "/api/homework/evidence");
      assert.equal(options.cache, "no-store");
      assert.equal(options.signal, controller.signal);
      return new Response(
        JSON.stringify({
          worksheets: [worksheet(`saved-${calls}`)],
          total: 1,
          limit: 100,
        }),
      );
    },
  );
  assert.equal(
    (await fetchHomeworkEvidence(controller.signal)).worksheets[0].id,
    "saved-1",
  );
  assert.equal(
    (await fetchHomeworkEvidence(controller.signal)).worksheets[0].id,
    "saved-2",
  );
});

test("a failed or malformed response is an error, never an empty success", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("offline", { status: 503 }),
  );
  await assert.rejects(
    fetchHomeworkEvidence(new AbortController().signal),
    /could not be loaded/,
  );
  context.mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify({ error: "bad payload" })),
  );
  await assert.rejects(
    fetchHomeworkEvidence(new AbortController().signal),
    /could not be read/,
  );
});

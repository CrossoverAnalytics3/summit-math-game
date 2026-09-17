import test from "node:test";
import assert from "node:assert/strict";
import { createRun } from "../../shared/expedition.ts";
import { routeProgress, comebackDue } from "../src/progressModel.ts";
const run = (stage: "first" | "changed" | "transfer") =>
  createRun({
    id: stage,
    route: "meadow",
    stage,
    plan: { kind: "rounds" },
    prediction: "not-sure",
    supports: [],
  });
test("route rewards require observed success at all three stages", () => {
  assert.equal(routeProgress([run("transfer")])[1].complete, false);
  assert.equal(
    routeProgress([run("first"), run("changed"), run("transfer")])[1].complete,
    true,
  );
});
test("a system-issue correction withdraws progression evidence", () => {
  const records = [
    run("first"),
    run("changed"),
    {
      ...run("transfer"),
      systemIssue: true,
      systemIssueNote: "Wrong intended method",
    },
  ];
  assert.equal(routeProgress(records)[1].complete, false);
});
test("five-day comeback preserves work and can be acknowledged", () => {
  const date = "2026-09-01T12:00:00Z";
  const b = {
    route: "meadow" as const,
    completed: false,
    lastPlayedAt: date,
    runs: [],
  };
  assert.equal(comebackDue(b, Date.parse(date) + 5 * 86400000 - 1), false);
  assert.equal(comebackDue(b, Date.parse(date) + 5 * 86400000), true);
  assert.equal(
    comebackDue(
      { ...b, returnDismissedAt: "2026-09-06T12:00:00Z" },
      Date.parse(date) + 6 * 86400000,
    ),
    false,
  );
  assert.equal(
    comebackDue({ ...b, completed: true }, Date.parse(date) + 6 * 86400000),
    false,
  );
});

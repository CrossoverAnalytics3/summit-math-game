import test from "node:test";
import assert from "node:assert/strict";
import {
  createGuidanceBudget,
  createIdleGuidance,
  type GuidanceBudget,
} from "../src/guidance.ts";

function scenario(
  budget: GuidanceBudget = createGuidanceBudget(),
  isEligible?: () => boolean,
) {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, { at: number; callback: () => void }>();
  const seen: Array<{ at: number; shown: boolean }> = [];
  const control = createIdleGuidance(
    (shown) => seen.push({ at: now, shown }),
    {
      setTimeout(callback, delay) {
        const id = nextId++;
        pending.set(id, { at: now + delay, callback });
        return id;
      },
      clearTimeout(id) {
        pending.delete(id as number);
      },
    },
    { budget, isEligible },
  );
  function advance(ms: number) {
    const end = now + ms;
    for (;;) {
      const due = [...pending.entries()]
        .filter(([, job]) => job.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      pending.delete(due[0]);
      due[1].callback();
    }
    now = end;
  }
  control.setEnabled(true);
  control.setEligible(true);
  return { control, advance, seen, pending, budget };
}

test("navigation guidance waits a full ten seconds and does not repeatedly interrupt", () => {
  const s = scenario();
  s.advance(9_999);
  assert.deepEqual(s.seen, []);
  s.advance(1);
  assert.deepEqual(s.seen, [{ at: 10_000, shown: true }]);
  s.advance(60_000);
  assert.equal(s.seen.length, 1);
});

test("interaction resets quiet time, then the second hint waits thirty seconds", () => {
  const s = scenario();
  s.advance(8_000);
  s.control.activity();
  s.advance(9_999);
  assert.equal(s.seen.length, 0);
  s.advance(1);
  assert.deepEqual(s.seen, [{ at: 18_000, shown: true }]);
  s.control.activity();
  assert.deepEqual(s.seen.at(-1), { at: 18_000, shown: false });
  s.advance(29_999);
  assert.equal(s.seen.length, 2);
  s.advance(1);
  assert.deepEqual(s.seen.at(-1), { at: 48_000, shown: true });
  assert.equal(s.budget.hintsShown, 2);
  s.control.activity();
  s.advance(300_000);
  assert.equal(s.seen.length, 4);
  assert.equal(s.pending.size, 0);
});

test("a new screen or action never inherits the previous screen's remaining timer", () => {
  const s = scenario();
  s.advance(9_000);
  s.control.resetContext();
  s.advance(9_999);
  assert.deepEqual(s.seen, []);
  s.advance(1);
  assert.deepEqual(s.seen, [{ at: 19_000, shown: true }]);
});

test("context and action changes reset quiet time without replenishing the hint budget", () => {
  const s = scenario();
  s.advance(10_000);
  s.control.resetContext();
  s.advance(20_000);
  s.control.resetContext();
  s.advance(29_999);
  assert.equal(s.seen.length, 2);
  s.advance(1);
  assert.deepEqual(s.seen.at(-1), { at: 60_000, shown: true });
  s.control.resetContext();
  s.control.setEnabled(false);
  s.control.setEnabled(true);
  s.advance(300_000);
  assert.equal(s.seen.length, 4);
  assert.equal(s.budget.hintsShown, 2);
  assert.equal(s.pending.size, 0);
});

for (const [name, setter] of [
  ["hidden tab", "setVisible"],
  ["disabled guidance or playback", "setEnabled"],
  ["modal, missing, hidden, or disabled control", "setEligible"],
] as const) {
  test(`${name} suppresses hints and returning gives another full quiet period`, () => {
    const s = scenario();
    s.advance(10_000);
    s.control[setter](false);
    assert.deepEqual(s.seen.at(-1), { at: 10_000, shown: false });
    s.advance(60_000);
    assert.equal(s.seen.length, 2);
    s.control[setter](true);
    s.advance(29_999);
    assert.equal(s.seen.length, 2);
    s.advance(1);
    assert.deepEqual(s.seen.at(-1), { at: 100_000, shown: true });
  });
}

test("a dialog opened before the first deadline does not consume a hint", () => {
  const s = scenario();
  s.advance(9_999);
  s.control.setEligible(false);
  s.advance(60_000);
  assert.equal(s.budget.hintsShown, 0);
  s.control.setEligible(true);
  s.advance(9_999);
  assert.deepEqual(s.seen, []);
  s.advance(1);
  assert.deepEqual(s.seen.at(-1), { at: 79_999, shown: true });
});

test("availability is checked again at the deadline before spending a hint", () => {
  let available = false;
  const s = scenario(createGuidanceBudget(), () => available);
  s.advance(10_000);
  assert.deepEqual(s.seen, []);
  assert.equal(s.budget.hintsShown, 0);
  available = true;
  s.control.setEligible(true);
  s.advance(10_000);
  assert.deepEqual(s.seen, [{ at: 20_000, shown: true }]);
});

test("remounting a controller retains the same activity budget", () => {
  const budget = createGuidanceBudget();
  const first = scenario(budget);
  first.advance(10_000);
  first.control.dispose();
  const second = scenario(budget);
  second.advance(29_999);
  assert.deepEqual(second.seen, []);
  second.advance(1);
  assert.deepEqual(second.seen, [{ at: 30_000, shown: true }]);
  second.control.dispose();
  const third = scenario(budget);
  third.advance(300_000);
  assert.deepEqual(third.seen, []);
  assert.equal(third.pending.size, 0);
});

test("a new activity gets its own two hints without resetting the previous activity", () => {
  const first = scenario();
  first.advance(10_000);
  first.control.activity();
  first.advance(30_000);
  first.control.dispose();
  const nextActivity = scenario();
  nextActivity.advance(10_000);
  assert.deepEqual(nextActivity.seen, [{ at: 10_000, shown: true }]);
  assert.equal(first.budget.hintsShown, 2);
  assert.equal(nextActivity.budget.hintsShown, 1);
});

test("unmount cancels the pending hint permanently", () => {
  const s = scenario();
  s.advance(9_999);
  s.control.dispose();
  s.control.activity();
  s.advance(90_000);
  assert.deepEqual(s.seen, []);
  assert.equal(s.pending.size, 0);
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHECKS, LEVELS, equivalent, getHint, isTowerCorrect, summary } from "../src/fractions.ts";
import type { EvidenceRecord, Fraction } from "../src/fractions.ts";

describe("fraction validation", () => {
  it("compares integer ratios without rounding", () => {
    assert.equal(equivalent({ n: 1, d: 2 }, { n: 6, d: 12 }), true);
    assert.equal(equivalent({ n: 2, d: 3 }, { n: 3, d: 4 }), false);
    assert.equal(equivalent({ n: 0, d: 2 }, { n: 0, d: 12 }), true);
    const large = Number.MAX_SAFE_INTEGER;
    assert.equal(equivalent({ n: large, d: large - 1 }, { n: large - 1, d: large - 2 }), false);
    assert.equal(equivalent({ n: large, d: large }, { n: 1, d: 1 }), true);
  });

  it("rejects zero, negative, non-integer, and non-finite denominators", () => {
    for (const d of [0, -2, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(equivalent({ n: 1, d }, { n: 1, d: 2 }), false);
      assert.equal(equivalent({ n: 1, d: 2 }, { n: 1, d }), false);
    }
    for (const n of [0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(equivalent({ n, d: 2 }, { n: 1, d: 2 }), false);
    }
  });
});

describe("authored learning content", () => {
  it("contains exactly three complete unsolved towers with one correct choice per ring", () => {
    assert.equal(LEVELS.length, 3);
    assert.equal(new Set(LEVELS.map((level) => level.id)).size, LEVELS.length);
    for (const level of LEVELS) {
      assert.equal(level.choices.length, 3);
      for (const row of level.choices) {
        assert.equal(row.length, 4);
        assert.equal(row.filter((choice) => equivalent(choice, level.target)).length, 1);
        assert.equal(equivalent(row[0], level.target), false);
      }
      assert.equal(isTowerCorrect(level, [0, 0, 0]), false);
      const solution = level.choices.map((row) => row.findIndex((choice) => equivalent(choice, level.target)));
      assert.equal(isTowerCorrect(level, solution), true);
      assert.equal(isTowerCorrect(level, solution.slice(0, 2)), false);
      assert.equal(isTowerCorrect(level, [...solution, 0]), false);
      for (const invalid of [-1, 4, 0.5, NaN]) {
        assert.equal(isTowerCorrect(level, [invalid, solution[1], solution[2]]), false);
      }
    }
  });

  it("uses positive proper fractions with denominators no greater than twelve", () => {
    const fractions: Fraction[] = [
      ...LEVELS.flatMap((level) => [level.target, ...level.choices.flat()]),
      ...CHECKS.flatMap((check) => [check.target, ...check.choices]),
    ];
    for (const fraction of fractions) {
      assert.ok(Number.isInteger(fraction.n) && fraction.n > 0);
      assert.ok(Number.isInteger(fraction.d) && fraction.d <= 12);
      assert.ok(fraction.n < fraction.d);
    }
  });

  it("uses fresh choices for two independently answerable transfer checks", () => {
    assert.equal(CHECKS.length, 2);
    const shown = new Set(LEVELS.flatMap((level) => level.choices.flat().map((f) => `${f.n}/${f.d}`)));
    for (const check of CHECKS) {
      assert.equal(check.choices.length, 4);
      assert.equal(check.choices.filter((choice) => equivalent(choice, check.target)).length, 1);
      assert.equal(equivalent(check.choices[check.correctIndex], check.target), true);
      assert.ok(check.explanation.length > 20);
      for (const choice of check.choices) assert.equal(shown.has(`${choice.n}/${choice.d}`), false);
    }
  });

  it("hints address the first mismatch without revealing a fraction answer", () => {
    const level = LEVELS[0];
    const solution = level.choices.map((row) => row.findIndex((choice) => equivalent(choice, level.target)));
    const first = getHint(level, [0, 0, 0]);
    const second = getHint(level, [solution[0], 0, 0]);
    const third = getHint(level, [solution[0], solution[1], 0]);
    assert.match(first, /fraction ring/);
    assert.match(second, /shaded ring/);
    assert.match(third, /number-line ring/);
    for (const hint of [first, second, third]) assert.doesNotMatch(hint, /\d+\s*\/\s*\d+/);
    assert.match(getHint(level, solution), /All three/);
    assert.match(getHint(level, []), /fraction ring/);
  });
});

describe("evidence summaries", () => {
  const evidence = (overrides: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
    id: "item", kind: "check", correct: true, assisted: false, attempts: 1, ...overrides,
  });

  it("starts empty and counts only independent first-attempt check successes", () => {
    assert.deepEqual(summary([]), { towers: 0, independentChecks: 0, checkCount: 0, supported: 0 });
    assert.deepEqual(summary([
      evidence({ id: "tower", kind: "tower" }),
      evidence({ id: "independent" }),
      evidence({ id: "hinted", assisted: true }),
      evidence({ id: "retried", attempts: 2 }),
      evidence({ id: "wrong", correct: false }),
    ]), { towers: 1, independentChecks: 1, checkCount: 4, supported: 2 });
  });

  it("deduplicates repeated records and never promotes assisted retries to independent work", () => {
    const firstWrong = evidence({ correct: false });
    const retry = evidence({ attempts: 2 });
    const hintedTower = evidence({ id: "climb", kind: "tower", assisted: true, attempts: 2 });
    const independent = evidence({ id: "clean" });
    assert.deepEqual(summary([
      firstWrong, retry, retry, evidence(), hintedTower, hintedTower,
      evidence({ id: "climb", kind: "tower" }), independent, independent,
    ]), { towers: 1, independentChecks: 1, checkCount: 2, supported: 2 });
  });

  it("preserves help evidence and keeps tower and check ids separate", () => {
    assert.deepEqual(summary([
      evidence({ assisted: true }), evidence(), evidence({ kind: "tower" }),
    ]), { towers: 1, independentChecks: 0, checkCount: 1, supported: 1 });
  });

  it("ignores records without a valid positive attempt count or item id", () => {
    assert.deepEqual(summary([
      evidence({ attempts: 0 }), evidence({ attempts: -1 }), evidence({ attempts: NaN }),
      evidence({ attempts: 1.5 }), evidence({ id: "" }),
    ]), { towers: 0, independentChecks: 0, checkCount: 0, supported: 0 });
  });
});

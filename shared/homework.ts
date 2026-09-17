/**
 * Fix Pip's homework. Pip gets a new worksheet at the child's current level
 * with ONE authored mistake. The child finds it, says why, and
 * fixes it. Deterministic from a seed; the engine computes every answer.
 */
export type Op = "add" | "sub" | "mul" | "div" | "place";
export type Slip = "forgot_carry" | "small_from_big" | "skip_short" | "group_short" | "swapped_places" | "off_by_one" | "wrong_operation" | "copied_wrong";

export interface WorkedProblem {
  index: number;
  prompt: string;
  a: number; b: number; op: Op;
  steps: string[];          // Pip's shown work
  pip_answer: number;       // what Pip wrote
}
export interface HomeworkSet {
  id: string; skill_id: string; level: number;
  problems: WorkedProblem[];
  reasons: { id: Slip | "none"; text: string }[];   // 4 choices shown to the child
}
export interface HomeworkKey { wrong_index: number; slip: Slip; correct_answer: number }

export const SLIP_TEXT: Record<Slip, string> = {
  forgot_carry: "Forgot to carry the ten",
  small_from_big: "Took the small digit from the big one",
  skip_short: "Skip-counted one time too few",
  group_short: "Stopped one group too early",
  swapped_places: "Mixed up tens and ones",
  off_by_one: "Counted one too many or too few",
  wrong_operation: "Used the wrong operation",     // distractor only, never planted
  copied_wrong: "Copied a number wrong",            // distractor only, never planted
};
const DISTRACTOR_ONLY: Slip[] = ["wrong_operation", "copied_wrong"];

// What slips are believable for each operation, in preference order.
export const SLIPS_FOR: Record<Op, Slip[]> = {
  add: ["forgot_carry", "off_by_one"],
  sub: ["small_from_big", "off_by_one"],
  mul: ["skip_short", "off_by_one"],
  div: ["group_short", "off_by_one"],
  place: ["swapped_places"],
};

export function correct(op: Op, a: number, b: number): number {
  switch (op) {
    case "add": return a + b; case "sub": return a - b; case "mul": return a * b; case "div": return a / b;
    case "place": return b === 10 ? Math.floor(a / 10) % 10 : a % 10;
  }
}

/** Apply a slip. Returns null when this slip can't happen on these numbers (then try the next one). */
export function applySlip(op: Op, a: number, b: number, slip: Slip): number | null {
  const right = correct(op, a, b);
  switch (slip) {
    case "forgot_carry": return op === "add" && (a % 10) + (b % 10) >= 10 ? right - 10 : null;
    case "small_from_big": {
      if (op !== "sub" || a % 10 >= b % 10) return null;
      const ones = Math.abs((a % 10) - (b % 10));
      const tens = Math.floor(a / 10) - Math.floor(b / 10);
      return tens * 10 + ones;
    }
    case "skip_short": return op === "mul" && b > 1 ? a * (b - 1) : null;
    case "group_short": return op === "div" && right > 1 ? right - 1 : null;
    case "swapped_places": return op === "place" && a >= 10 ? (b === 10 ? a % 10 : Math.floor(a / 10) % 10) : null;
    case "off_by_one": return op !== "place" && right >= 0 ? right + (right === 0 || a % 2 === 0 ? 1 : -1) : null;
    case "wrong_operation": case "copied_wrong": return null;
  }
}

// Keep the location of a counting slip visible without rendering a long wall
// of numbers on the larger trails. The last few counts are always retained.
function shownCount(values: number[]) {
  return values.length <= 10 ? values.join(", ") : [...values.slice(0, 3), "…", ...values.slice(-4)].join(", ");
}

export function showWork(op: Op, a: number, b: number, answer: number, slip: Slip | null): string[] {
  switch (op) {
    case "add": {
      if (slip === "off_by_one") return [`Count on from ${Math.max(a, b)}: ${shownCount(Array.from({ length: Math.min(a, b) }, (_, i) => Math.max(a, b) + i + 1 + (answer - (a + b)) * (i === Math.min(a, b) - 1 ? 1 : 0)))}`, `So ${a} + ${b} = ${answer}`];
      const ones = (a % 10) + (b % 10), carry = ones >= 10;
      return [
        `Ones: ${a % 10} + ${b % 10} = ${ones}${carry ? `, write ${ones % 10}${slip === "forgot_carry" ? "" : ", carry 1"}` : ""}`,
        `Tens: ${Math.floor(a / 10)} + ${Math.floor(b / 10)}${carry && slip !== "forgot_carry" ? " + 1" : ""} = ${Math.floor(answer / 10)}`,
        `So ${a} + ${b} = ${answer}`,
      ];
    }
    case "sub": {
      if (slip === "off_by_one") return [`Count back from ${a}: ${shownCount(Array.from({ length: b }, (_, i) => a - i - 1 + (i === b - 1 ? answer - (a - b) : 0)))}`, `So ${a} − ${b} = ${answer}`];
      const needs = a % 10 < b % 10;
      return [
        needs && slip === "small_from_big"
          ? `Ones: ${b % 10} − ${a % 10} = ${(b % 10) - (a % 10)}`
          : needs ? `Ones: ${a % 10} is smaller than ${b % 10}, so regroup: ${a % 10 + 10} − ${b % 10} = ${a % 10 + 10 - (b % 10)}`
                  : `Ones: ${a % 10} − ${b % 10} = ${(a % 10) - (b % 10)}`,
        `Tens: ${Math.floor(a / 10)}${needs && slip !== "small_from_big" ? " − 1" : ""} − ${Math.floor(b / 10)} = ${Math.floor(answer / 10)}`,
        `So ${a} − ${b} = ${answer}`,
      ];
    }
    case "mul": {
      const times = slip === "skip_short" ? b - 1 : b;
      const seq = shownCount(Array.from({ length: times }, (_, i) => a * (i + 1) + (slip === "off_by_one" && i === times - 1 ? answer - a * b : 0)));
      return [`Skip-count by ${a}: ${seq}`, `That's ${times} ${times === 1 ? "time" : "times"}`, `So ${a} × ${b} = ${answer}`];
    }
    case "div": {
      const groups = answer;
      return [`Make groups of ${b}: ${Array.from({ length: groups }, () => b).join(" + ")}${slip === "group_short" ? ` … basket looks empty` : ""}`, `That's ${groups} groups`, `So ${a} ÷ ${b} = ${answer}`];
    }
    case "place":
      return [`${a} has ${a >= 100 ? `${Math.floor(a / 100)} hundreds, ` : ""}${Math.floor(a / 10) % 10} tens and ${a % 10} ones`, `The ${b === 10 ? "tens" : "ones"} digit is ${answer}`];
  }
}

function lcg(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Build the set from three already-generated problems (numbers come from the
 * skill generators, never from here). Exactly one gets a slip; the others show correct work.
 */
export function buildHomework(
  id: string, skill_id: string, level: number, seed: number,
  base: { a: number; b: number; op: Op; prompt: string }[],
  preferred?: Slip[],
): { set: HomeworkSet; key: HomeworkKey } {
  if (base.length !== 3) throw new Error("homework needs exactly three problems");
  const r = lcg(seed);
  // Try each problem as the wrong one until a believable slip exists.
  const order = shuffled([0, 1, 2], r);
  // Prefer the requested slip across the whole page before falling back.
  for (const slip of preferred ?? SLIPS_FOR[base[0].op]) {
    for (const wi of order) {
      const wrong = applySlip(base[wi].op, base[wi].a, base[wi].b, slip);
      if (wrong === null || wrong < 0 || wrong === correct(base[wi].op, base[wi].a, base[wi].b)) continue;   // a slip that lands on the right answer isn't a slip
      const problems = base.map((p, i) => {
        const ans = i === wi ? wrong : correct(p.op, p.a, p.b);
        return { index: i, prompt: p.prompt, a: p.a, b: p.b, op: p.op, steps: showWork(p.op, p.a, p.b, ans, i === wi ? slip : null), pip_answer: ans };
      });
      const family = SLIPS_FOR[base[wi].op].filter((s) => s !== slip);
      const others = [...family, ...shuffled(DISTRACTOR_ONLY, r)].slice(0, 2);
      const reasons = shuffled([slip, ...others].map((s) => ({ id: s as Slip | "none", text: SLIP_TEXT[s] })), r);
      reasons.push({ id: "none", text: "Pip didn't make a mistake" });
      return { set: { id, skill_id, level, problems, reasons }, key: { wrong_index: wi, slip, correct_answer: correct(base[wi].op, base[wi].a, base[wi].b) } };
    }
  }
  throw new Error("no believable slip for these problems");
}

export function assessHomework(key: HomeworkKey, spotted_index: number, reason: Slip | "none", fixed_answer: number) {
  const spotted = spotted_index === key.wrong_index;
  // The response refers to the selected card. Coincidentally typing the
  // hidden card's answer does not fix or explain that card's mistake.
  const explained = spotted && reason === key.slip;
  const fixed = spotted && fixed_answer === key.correct_answer;
  return { spotted, explained, fixed, all: spotted && explained && fixed, slip: key.slip, correct_answer: key.correct_answer, wrong_index: key.wrong_index };
}

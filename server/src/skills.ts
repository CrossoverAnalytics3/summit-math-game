// The K-5 skill ladder and the deterministic problem generators.
// Every problem the game shows, AI-framed or not, comes from one of these
// generators, so the numbers and the answer are always computed here.

export type Op = "add" | "sub" | "mul" | "div" | "place";
export interface Skill { id: string; name: string; grade: string; op: Op; tip: string }
export interface Problem { skill_id: string; level: number; op: Op; a: number; b: number; answer: number; prompt: string }

export const SKILLS: Skill[] = [
  { id: "add20",  name: "Add within 20",        grade: "K–1", op: "add",   tip: "Start from the bigger number and count up." },
  { id: "sub20",  name: "Take away within 20",  grade: "K–1", op: "sub",   tip: "Think: what do I add to the small number to reach the big one?" },
  { id: "place",  name: "Tens and ones",        grade: "1–2", op: "place", tip: "The left digit counts tens. The right digit counts ones." },
  { id: "add100", name: "Add within 100",       grade: "2",   op: "add",   tip: "Add the tens first, then the ones." },
  { id: "sub100", name: "Take away within 100", grade: "2",   op: "sub",   tip: "Take away the tens first, then the ones." },
  { id: "mul",    name: "Times tables",         grade: "3",   op: "mul",   tip: "Skip-count. 4 × 6 is 6, 12, 18, 24." },
  { id: "div",    name: "Sharing equally",      grade: "3–4", op: "div",   tip: "Ask: how many groups of the small number fit in the big one?" },
];
export const MAX_LEVEL = 10;

export function skill(id: string): Skill {
  const s = SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown skill ${id}`);
  return s;
}

// Number range per level. Level 1 is tiny on purpose (endowed progress:
// a kid should win the first rung fast).
export function range(skillId: string, level: number): { lo: number; hi: number } {
  const L = Math.max(1, Math.min(MAX_LEVEL, level));
  switch (skillId) {
    case "add20": case "sub20": return { lo: 1, hi: Math.min(20, 4 + L * 2) };
    case "place":  return { lo: 10, hi: L < 5 ? 99 : 999 };
    case "add100": case "sub100": return { lo: 1, hi: Math.min(100, 10 + L * 9) };
    case "mul": case "div": return { lo: 2, hi: Math.min(12, 3 + L) };
    default: return { lo: 1, hi: 10 };
  }
}

// Seeded RNG so a round can be reproduced from its seed (useful for bug reports).
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
const pick = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

export function generate(skillId: string, level: number, seed: number): Problem {
  const s = skill(skillId);
  const r = rng(seed);
  const { lo, hi } = range(skillId, level);
  let a = 0, b = 0, answer = 0, prompt = "";
  switch (s.op) {
    case "add": { a = pick(r, lo, hi - lo); b = pick(r, lo, hi - a); answer = a + b; prompt = `${a} + ${b}`; break; }
    case "sub": { a = pick(r, lo + 1, hi); b = pick(r, lo, a); answer = a - b; prompt = `${a} − ${b}`; break; }
    case "mul": { a = pick(r, lo, hi); b = pick(r, lo, hi); answer = a * b; prompt = `${a} × ${b}`; break; }
    case "div": { b = pick(r, lo, hi); answer = pick(r, lo, hi); a = b * answer; prompt = `${a} ÷ ${b}`; break; }
    case "place": { a = pick(r, lo, hi); const tens = r() < 0.5; b = tens ? 10 : 1; answer = tens ? Math.floor(a / 10) % 10 : a % 10; prompt = `${tens ? "Tens" : "Ones"} digit of ${a}`; break; }
  }
  return { skill_id: skillId, level, op: s.op, a, b, answer, prompt };
}

// The check the AI output has to pass: are these the numbers a real problem
// at this skill and level could contain, and is the answer what the code says?
export function inRange(skillId: string, level: number, a: number, b: number): boolean {
  const { lo, hi } = range(skillId, level);
  const s = skill(skillId);
  const ok = (n: number) => Number.isInteger(n) && n >= 0;
  if (!ok(a) || !ok(b)) return false;
  switch (s.op) {
    case "add": return a >= lo && b >= lo && a + b <= hi;
    case "sub": return a <= hi && b <= a && b >= lo;
    case "mul": return a >= lo && a <= hi && b >= lo && b <= hi;
    case "div": return b >= lo && b <= hi && b !== 0 && a % b === 0 && a / b >= lo && a / b <= hi;
    case "place": return a >= lo && a <= hi && (b === 10 || b === 1);
  }
}
export function compute(op: Op, a: number, b: number): number {
  switch (op) {
    case "add": return a + b; case "sub": return a - b; case "mul": return a * b; case "div": return a / b;
    case "place": return b === 10 ? Math.floor(a / 10) % 10 : a % 10;
  }
}

// Offline story templates, one per op, used when no model is configured or
// when the model's output fails validation.
const pl = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export function templateStory(p: Problem, theme = "animals"): string {
  const worlds: Record<string, { explorer: string; item: string; container: string; place: string; friend: string }> = {
    animals: { explorer: "The fox", item: "berry", container: "basket", place: "forest trail", friend: "fox cub" },
    space: { explorer: "The astronaut", item: "moon rock", container: "crate", place: "moon base", friend: "robot" },
    ocean: { explorer: "The diver", item: "shell", container: "bucket", place: "coral reef", friend: "diver" },
    dinosaurs: { explorer: "The dinosaur explorer", item: "fossil", container: "tray", place: "dinosaur valley", friend: "explorer" },
  };
  const w = worlds[theme] ?? worlds.animals;
  const items = (n: number) => `${n} ${w.item === "berry" && n !== 1 ? "berries" : w.item + (n === 1 ? "" : "s")}`;
  switch (p.op) {
    case "add": return `${w.explorer} found ${items(p.a)} at the ${w.place}, then ${p.b} more. How many in all?`;
    case "sub": return `${w.explorer} collected ${items(p.a)} and gave ${p.b} to a friend. How many are left?`;
    case "mul": return `${w.explorer} packed ${pl(p.a, w.container)} with ${items(p.b)} in each. How many in all?`;
    case "div": return `${w.explorer} shares ${items(p.a)} equally among ${pl(p.b, w.friend)}. How many does each get?`;
    case "place": return `At the ${w.place}, ${w.explorer.toLowerCase()} finds a door marked ${p.a}. What is the ${p.b === 10 ? "tens" : "ones"} digit?`;
  }
}
export function templateHint(p: Problem): string {
  switch (p.op) {
    case "add": return `Start at ${Math.max(p.a, p.b)} and count up ${Math.min(p.a, p.b)}.`;
    case "sub": return `Count up from ${p.b} to ${p.a}. How many hops?`;
    case "mul": return `Skip-count by ${p.b}, ${p.a} times.`;
    case "div": return `How many groups of ${p.b} fit inside ${p.a}?`;
    case "place": return `Write ${p.a} with one digit in each column. Which column is ${p.b === 10 ? "tens" : "ones"}?`;
  }
}

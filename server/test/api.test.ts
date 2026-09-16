import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
process.env.DB_FILE = ":memory:";
process.env.SUMMIT_ROLLOUT_PCT = "100";
delete process.env.ANTHROPIC_API_KEY;
const { app } = await import("../src/app.js");
const { db, reset } = await import("../src/db.js");
const { compute, generate, inRange, SKILLS, MAX_LEVEL } = await import("../src/skills.js");
const { anthropicAdapter } = await import("../src/ai/adapter.js");
const { parentNote, storyProblem } = await import("../src/ai/story.js");
const { generateRoundProblems } = await import("../src/rounds.js");
beforeEach(() => { reset(); delete process.env.ANTHROPIC_API_KEY; });
afterEach(() => vi.restoreAllMocks());
// Exercise Express routing, JSON parsing, validation and error handling without
// opening a port, so the contract suite also runs in restricted environments.
function request(method: string, path: string, body?: unknown): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = new IncomingMessage(new Socket());
    req.method = method;
    req.url = path;
    const payload = body === undefined ? "" : JSON.stringify(body);
    if (payload) req.headers = { "content-type": "application/json", "content-length": String(Buffer.byteLength(payload)) };
    const res = new ServerResponse(req);
    res.end = ((chunk: any) => {
      try { resolve({ status: res.statusCode, body: JSON.parse(String(chunk)) }); }
      catch (error) { reject(error); }
      return res;
    }) as typeof res.end;
    app(req, res);
    if (payload) req.push(payload);
    req.push(null);
  });
}
const post = (path: string, body: unknown) => request("POST", path, body);
const answerFor = (p: any) => compute(p.op, p.a, p.b);

describe("server owns the assessment", () => {
  it("does not disclose solutions or seeds before an answer", async () => {
    const r = await post("/api/round", { skill_id: "add20" });
    expect(r.status).toBe(200);
    expect(r.body.problems).toHaveLength(7);
    expect(r.body).not.toHaveProperty("answers");
    expect(r.body).not.toHaveProperty("seed");
    for (const p of r.body.problems) { expect(p.id).toMatch(/^[\da-f-]{36}$/); expect(p).not.toHaveProperty("answer"); }
  });
  it("selects seven distinct prompts reproducibly at every skill and level", () => {
    for (const s of SKILLS) for (let level = 1; level <= MAX_LEVEL; level++) {
      for (const seed of [1, 42, 915, 7919, 78955, 1_000_001, 999_999_999, 2_147_483_646]) {
        const problems = generateRoundProblems(s.id, level, seed);
        expect(problems).toHaveLength(7);
        expect(new Set(problems.map(p => p.prompt)).size, `${s.id}:${level}:${seed}`).toBe(7);
        for (const p of problems) {
          expect(p.level).toBe(level);
          expect(inRange(s.id, level, p.a, p.b)).toBe(true);
        }
      }
    }
    expect(generateRoundProblems("mul", 1, 42)).toEqual(generateRoundProblems("mul", 1, 42));
  });
  it("rejects fabricated correctness, score and hint flags", async () => {
    expect((await post("/api/answer", { skill_id: "add20", correct: true, used_hint: false })).status).toBe(400);
    expect((await post("/api/round/finish", { skill_id: "add20", score: 9000, won: true, seconds: 1 })).status).toBe(400);
    const round = (await post("/api/round", { skill_id: "mul" })).body;
    const p = round.problems[0];
    expect((await post("/api/answer", { problem_id: p.id, answer: answerFor(p), used_hint: false })).status).toBe(400);
    const wrong = await post("/api/answer", { problem_id: p.id, answer: -1 });
    expect(wrong.body.correct).toBe(false);
    expect(wrong.body.expected_answer).toBe(answerFor(p));
  });
  it("replays assessment exactly once, including a changed second answer", async () => {
    const p = (await post("/api/round", { skill_id: "mul" })).body.problems[0];
    const first = await post("/api/answer", { problem_id: p.id, answer: answerFor(p) });
    const repeat = await post("/api/answer", { problem_id: p.id, answer: -1 });
    expect(repeat.body).toEqual(first.body);
    expect((db.prepare("SELECT COUNT(*) n FROM events WHERE name='answer'").get() as any).n).toBe(1);
    expect((db.prepare("SELECT run FROM skill_progress WHERE skill_id='mul'").get() as any).run).toBe(1);
  });
  it("marks hints on the server and excludes hinted answers from independent mastery", async () => {
    const p = (await post("/api/round", { skill_id: "mul" })).body.problems[0];
    expect((await post("/api/hint", { problem_id: p.id })).body.provenance.final_source).toBe("template");
    const assessed = (await post("/api/answer", { problem_id: p.id, answer: answerFor(p) })).body;
    expect(assessed).toMatchObject({ correct: true, used_hint: true, run: 0, unlocked: false });
    expect((await post("/api/hint", { problem_id: p.id })).status).toBe(409);
  });
  it("finishes once from assessed answers and does not promote old difficulty twice", async () => {
    const round = (await post("/api/round", { skill_id: "add20" })).body;
    expect((await post("/api/round/finish", { round_id: round.round_id })).status).toBe(409);
    await post("/api/hint", { problem_id: round.problems[6].id });
    for (const p of round.problems) await post("/api/answer", { problem_id: p.id, answer: answerFor(p) });
    const first = (await post("/api/round/finish", { round_id: round.round_id })).body;
    const repeat = (await post("/api/round/finish", { round_id: round.round_id })).body;
    expect(first).toMatchObject({ score: 660, correct: 7, total: 7, won: true });
    expect(repeat).toEqual(first);
    expect((db.prepare("SELECT level,wins FROM skill_progress WHERE skill_id='add20'").get())).toEqual({ level: 2, wins: 1 });
    expect((db.prepare("SELECT COUNT(*) n FROM events WHERE name='round_finished'").get() as any).n).toBe(1);
  });
  it("handles unknown problems and skills as a useful client error", async () => {
    expect((await post("/api/round", { skill_id: "made-up" })).status).toBe(400);
    expect((await post("/api/answer", { problem_id: "00000000-0000-4000-8000-000000000000", answer: 3 })).status).toBe(404);
    expect((await post("/api/story", { skill_id: "made-up", theme: "space" })).status).toBe(400);
    expect((await request("GET", "/api/unknown")).status).toBe(404);
  });
  it("limits JSON bodies before processing a request", async () => {
    const response = await post("/api/round", { skill_id: "x".repeat(20_000) });
    expect(response.status).toBe(413);
    expect(response.body.error).toBe("request entity too large");
  });
});

describe("privacy and resilient stories", () => {
  it("never invokes live AI on any route before demo guardian consent", async () => {
    process.env.ANTHROPIC_API_KEY = "test-placeholder-never-sent";
    const complete = vi.spyOn(anthropicAdapter, "complete").mockResolvedValue(null);
    const p = (await post("/api/round", { skill_id: "mul" })).body.problems[0];
    const story = await post("/api/story", { skill_id: "mul", theme: "space" });
    const hint = await post("/api/hint", { problem_id: p.id });
    const parent = (await request("GET", "/api/parent")).body;
    for (const result of [story.body, hint.body, parent]) {
      expect(result.provenance.final_source).toBe("template");
      expect(result.provenance.fields_sent).toEqual([]);
    }
    expect(complete).not.toHaveBeenCalled();
    expect(story.body).not.toHaveProperty("answer");
    expect(story.body.problem).not.toHaveProperty("answer");
    expect(story.body.problem.story).toContain("astronaut");
  });
  it("allows consent and revocation, while provider failure still yields playable stories", async () => {
    process.env.ANTHROPIC_API_KEY = "test-placeholder-never-sent";
    const complete = vi.spyOn(anthropicAdapter, "complete").mockResolvedValue(null);
    expect((await post("/api/settings/ai-consent", { enabled: true })).body.ai).toBe("anthropic");
    const story = (await post("/api/story", { skill_id: "sub20", theme: "ocean" })).body;
    expect(complete).toHaveBeenCalledOnce();
    expect(story.provenance.final_source).toBe("template");
    expect(story.problem.story).toContain("diver");
    expect((await post("/api/answer", { problem_id: story.problem.id, answer: answerFor(story.problem) })).body.correct).toBe(true);
    expect((await post("/api/round/finish", { round_id: story.round_id })).body.total).toBe(1);
    await post("/api/settings/ai-consent", { enabled: false });
    await request("GET", "/api/parent");
    expect(complete).toHaveBeenCalledOnce();
  });
  it("omits the learner's name from parent prompts and is truthful before any practice", async () => {
    let seen = "";
    const r = await parentNote({ weakest_skill: null, unlocked: [], rounds: 0 }, "SecretLearnerName", {
      name: "spy", model: "none", async complete(prompt) { seen = prompt; return null; },
    });
    expect(seen).not.toContain("SecretLearnerName");
    expect(r.provenance.fields_sent).not.toContain("child_first_name");
    expect(r.note).toContain("first arithmetic trail");
  });
  it("makes each offline theme visible", async () => {
    for (const [theme, word] of Object.entries({ animals: "fox", space: "astronaut", ocean: "diver", dinosaurs: "dinosaur" })) {
      const r = await storyProblem("add20", 1, 16, theme, { name: "stub", model: "none", async complete() { return null; } });
      expect(r.problem.story).toContain(word);
    }
  });
  it("validates every skill at every level over dispersed seeds, including boundary additions", () => {
    for (const s of SKILLS) for (let level = 1; level <= MAX_LEVEL; level++) {
      for (const seed of [1, 42, 915, 7919, 78955, 1_000_001, 999_999_999, 2_147_483_646]) {
        const p = generate(s.id, level, seed);
        expect(inRange(s.id, level, p.a, p.b), JSON.stringify(p)).toBe(true);
        expect(p.answer).toBe(compute(p.op, p.a, p.b));
      }
    }
  });
});

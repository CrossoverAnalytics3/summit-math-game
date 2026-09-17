import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Journal } from "../../shared/journal.js";
const directory = mkdtempSync(join(tmpdir(), "summit-journal-test-"));
process.env.DB_FILE = join(directory, "teaching.db");
delete process.env.ANTHROPIC_API_KEY;
const { app } = await import("../src/app.js");
const { db, reset } = await import("../src/db.js");
const { createRun, createInterpretation, correctInterpretation } = await import(
  "../../shared/expedition.js"
);
const { EMPTY_JOURNAL } = await import("../../shared/journal.js");
beforeEach(() => reset());
afterAll(() => {
  db.close();
  rmSync(directory, { recursive: true, force: true });
});

function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = new IncomingMessage(new Socket());
    req.method = method;
    req.url = path;
    const payload = body === undefined ? "" : JSON.stringify(body);
    if (payload)
      req.headers = {
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(payload)),
      };
    const res = new ServerResponse(req);
    res.end = ((chunk: unknown) => {
      try {
        resolve({ status: res.statusCode, body: JSON.parse(String(chunk)) });
      } catch (error) {
        reject(error);
      }
      return res;
    }) as typeof res.end;
    app(req, res);
    if (payload) req.push(payload);
    req.push(null);
  });
}
const get = (path = "/api/teaching/journal") => request("GET", path);
const put = (journal: unknown, revision = 0) =>
  request("PUT", "/api/teaching/journal", { revision, journal });
function fixture(): Journal {
  const runs = [
    createRun({
      id: "run-first",
      route: "meadow",
      stage: "first",
      plan: { kind: "fixed", amount: 4 },
      prediction: "4",
      supports: [],
      date: "2026-09-16T12:00:00.000Z",
    }),
    createRun({
      id: "run-changed",
      route: "meadow",
      stage: "changed",
      plan: { kind: "fixed", amount: 4 },
      prediction: "4",
      supports: ["picture"],
      date: "2026-09-16T12:01:00.000Z",
    }),
  ];
  const receipt = createInterpretation({
    id: "receipt-two",
    runIds: runs.map((run) => run.id),
    runs,
    text: "The same instruction had different outcomes in these two situations.",
    nextQuestion: "What changed about the group?",
  });
  return structuredClone({
    ...EMPTY_JOURNAL,
    route: "meadow" as const,
    stage: "changed" as const,
    plan: { kind: "fixed" as const, amount: 4 },
    prediction: "4",
    planConfirmed: true,
    currentRunId: runs[1].id,
    runs,
    receipts: [receipt],
    expeditionId: "climb-1",
    lastPlayedAt: "2026-09-16T12:01:00.000Z",
  });
}

describe("durable teaching evidence", () => {
  it("starts empty and stores separate run, interpretation and current-state rows", async () => {
    expect((await get()).body).toEqual({ revision: 0, journal: null });
    const journal = fixture();
    const saved = await put(journal);
    expect(saved.status).toBe(200);
    expect(saved.body.revision).toBe(1);
    expect((await get()).body).toEqual(saved.body);
    expect(
      (db.prepare("SELECT COUNT(*) n FROM teaching_runs").get() as any).n,
    ).toBe(2);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) n FROM teaching_interpretations")
          .get() as any
      ).n,
    ).toBe(1);
    expect(
      JSON.parse(
        (db.prepare("SELECT state FROM teaching_journals").get() as any).state,
      ),
    ).not.toHaveProperty("runs");
    expect((await get("/api/teaching/runs/run-first")).body.run).toEqual(
      journal.runs[0],
    );
    expect((await get("/api/teaching/runs/unknown")).status).toBe(404);
  });
  it("recomputes result, context and completion instead of accepting tampered claims", async () => {
    const journal = fixture();
    journal.runs[1].result.complete = true;
    journal.runs[1].result.shares = [3, 3, 3, 3];
    journal.runs[1].context.total = 1000;
    journal.completed = true;
    const saved = await put(journal);
    expect(saved.status).toBe(200);
    expect(saved.body.journal.runs[1].result.complete).toBe(false);
    expect(saved.body.journal.runs[1].result.shares).toEqual([4, 4, 4, 0]);
    expect(saved.body.journal.runs[1].context.total).toBe(12);
    expect(saved.body.journal.completed).toBe(false);
  });
  it.each(["run", "dependency", "current", "note", "coach"])(
    "rejects a missing %s reference",
    async (kind) => {
      const journal = fixture();
      if (kind === "run") journal.receipts[0].runIds.push("missing");
      if (kind === "dependency")
        journal.receipts[0].nextQuestion.dependsOn.push("missing");
      if (kind === "current") journal.currentRunId = "missing";
      if (kind === "note")
        journal.notes = { missing: "A note with no observation" };
      if (kind === "coach")
        journal.coaches = {
          missing: {
            source: "authored",
            title: "Look",
            question: "What changed?",
            narrative: "",
            evidenceIds: ["missing"],
          },
        };
      expect((await put(journal)).status).toBe(400);
      expect((await get()).body.revision).toBe(0);
    },
  );
  it("rejects invalid plans, duplicate IDs, invalid statuses and oversized histories", async () => {
    const invalid: any[] = [];
    const badPlan = fixture();
    (badPlan.plan as any).answer = 4;
    invalid.push(badPlan);
    const duplicate = fixture();
    duplicate.runs.push(duplicate.runs[0]);
    invalid.push(duplicate);
    const badStatus = fixture();
    (badStatus.receipts[0] as any).status = "mastered";
    invalid.push(badStatus);
    const tooMany = fixture();
    tooMany.runs = Array(201).fill(tooMany.runs[0]);
    invalid.push(tooMany);
    const badSupport = fixture();
    badSupport.runs[0].supports = ["visual learner"];
    invalid.push(badSupport);
    for (const journal of invalid)
      expect((await put(journal)).status).toBe(400);
  });
  it("returns a canonical conflict without overwriting a newer journal", async () => {
    const journal = fixture();
    await put(journal);
    const newer = structuredClone(journal);
    newer.notes = {
      "run-first": "Child described counting around the circle.",
    };
    const saved = await put(newer, 1);
    const stale = structuredClone(journal);
    stale.prediction = "3";
    const conflict = await put(stale, 1);
    expect(conflict.status).toBe(409);
    expect(conflict.body.revision).toBe(2);
    expect(conflict.body.journal).toEqual(saved.body.journal);
    expect((await get()).body).toEqual(saved.body);
  });
  it("makes identical retries idempotent even after the response revision advanced", async () => {
    const journal = fixture();
    const first = await put(journal);
    expect((await put(journal, 0)).body).toEqual(first.body);
    expect((await put(journal, 1)).body).toEqual(first.body);
    expect(
      (db.prepare("SELECT COUNT(*) n FROM teaching_runs").get() as any).n,
    ).toBe(2);
  });
  it.each([
    "delete",
    "reorder",
    "plan",
    "prediction",
    "support",
    "date",
    "receipt",
    "text",
  ])("protects previously saved evidence from %s changes", async (kind) => {
    const journal = fixture();
    await put(journal);
    if (kind === "delete") {
      journal.runs.pop();
      journal.receipts = [];
      journal.currentRunId = "run-first";
      journal.stage = "first";
    }
    if (kind === "reorder") journal.runs.reverse();
    if (kind === "plan") journal.runs[0].plan = { kind: "rounds" };
    if (kind === "prediction") journal.runs[0].prediction = "3";
    if (kind === "support") journal.runs[0].supports = ["coach"];
    if (kind === "date") journal.runs[0].date = "2026-09-17T12:00:00.000Z";
    if (kind === "receipt") journal.receipts = [];
    if (kind === "text")
      journal.receipts[0].text = "The child has mastered division.";
    expect((await put(journal, 1)).status).toBe(400);
    expect((await get()).body.revision).toBe(1);
  });
  it("allows new runs and notes without modifying an earlier replay", async () => {
    const journal = fixture();
    await put(journal);
    journal.runs.push(
      createRun({
        id: "run-revised",
        route: "meadow",
        stage: "changed",
        plan: { kind: "rounds" },
        prediction: "3",
        supports: [],
        date: "2026-09-16T12:02:00.000Z",
      }),
    );
    journal.currentRunId = "run-revised";
    journal.notes = { "run-first": "This is what I meant." };
    const response = await put(journal, 1);
    expect(response.status).toBe(200);
    expect(response.body.journal.runs).toHaveLength(3);
    expect(response.body.journal.runs[0]).toEqual(fixture().runs[0]);
  });
  it("enforces the two-event floor on a legacy single-run interpretation", async () => {
    const journal = fixture();
    journal.receipts[0].runIds = [journal.runs[0].id];
    journal.receipts[0].status = "confirmed";
    const saved = await put(journal);
    expect(saved.status).toBe(200);
    expect(saved.body.journal.receipts[0].status).toBe("insufficient");
    expect(saved.body.journal.receipts[0].nextQuestion.status).toBe(
      "withdrawn",
    );
  });
  it("stores a targeted system correction, retains replay and withdraws its dependent question", async () => {
    const journal = fixture();
    await put(journal);
    const original = structuredClone(journal.runs[1]);
    const changed = correctInterpretation(
      journal.receipts[0],
      {
        kind: "system",
        runId: "run-changed",
        note: "Pip misunderstood the selected instruction.",
      },
      journal.runs,
    );
    journal.runs = changed.runs;
    journal.receipts = [changed.interpretation];
    const saved = await put(journal, 1);
    expect(saved.status).toBe(200);
    expect(saved.body.journal.runs[0].systemIssue).toBe(false);
    expect(saved.body.journal.runs[1]).toEqual({
      ...original,
      systemIssue: true,
      systemIssueNote: "Pip misunderstood the selected instruction.",
    });
    expect(saved.body.journal.receipts[0].nextQuestion.status).toBe(
      "withdrawn",
    );
    const brief = (await get("/api/teaching/brief")).body;
    expect(brief.summary.systemIssues).toBe(1);
    expect(brief.summary.eligibleRuns).toBe(1);
    expect(brief.summary.runsWithSupport).toBe(0);
    expect(brief.runs).toHaveLength(2);
    expect((await put(fixture(), 2)).status).toBe(400);
  });
  it("withdraws indirect questions and stale coach text when an adult corrects their source", async () => {
    const journal = fixture();
    const dependent = createInterpretation({
      id: "receipt-dependent",
      runIds: journal.runs.map((run) => run.id),
      runs: journal.runs,
      text: "A second hypothesis based on this comparison.",
      nextQuestion: "What else could you try?",
    });
    dependent.nextQuestion.dependsOn.push(journal.receipts[0].id);
    journal.receipts.push(dependent);
    journal.coaches = {
      "run-changed": {
        source: "authored",
        title: "A question",
        question: "What changed?",
        narrative: "Pip tried this rule.",
        evidenceIds: ["run-changed"],
      },
    };
    await put(journal);
    const changed = correctInterpretation(
      journal.receipts[0],
      {
        kind: "context",
        runId: "run-changed",
        note: "This attempt was an intentional experiment.",
      },
      journal.runs,
    );
    journal.receipts[0] = changed.interpretation;
    // Deliberately leave the dependent question active and coach cached in the request.
    const saved = await put(journal, 1);
    expect(saved.status).toBe(200);
    expect(saved.body.journal.receipts[1].nextQuestion.status).toBe(
      "withdrawn",
    );
    expect(saved.body.journal.coaches).toEqual({});
    expect(saved.body.journal.runs.every((run: any) => !run.systemIssue)).toBe(
      true,
    );
    const revived = structuredClone(saved.body.journal);
    revived.receipts[0].status = "confirmed";
    delete revived.receipts[0].correction;
    revived.receipts[0].nextQuestion.status = "active";
    expect((await put(revived, 2)).status).toBe(400);
  });
  it("accepts a bounded full history larger than the normal API body limit", async () => {
    const journal = fixture();
    while (journal.runs.length < 200)
      journal.runs.push(
        createRun({
          id: `run-full-${journal.runs.length}`,
          route: "meadow",
          stage: "first",
          plan: { kind: "rounds" },
          prediction: "4",
          supports: [],
          date: "2026-09-16T12:00:00.000Z",
        }),
      );
    expect(JSON.stringify(journal).length).toBeGreaterThan(16_384);
    const saved = await put(journal);
    expect(saved.status).toBe(200);
    expect(saved.body.journal.runs).toHaveLength(200);
  });
  it("rejects unsupported system issue flags or corrections to an unreferenced run", async () => {
    const journal = fixture();
    journal.runs[0].systemIssue = true;
    journal.runs[0].systemIssueNote = "An unbacked flag";
    expect((await put(journal)).status).toBe(400);
    const corrected = fixture();
    corrected.receipts[0].status = "corrected";
    corrected.receipts[0].correction = {
      kind: "system",
      runId: "missing",
      note: "Wrong run",
    };
    expect((await put(corrected)).status).toBe(400);
  });
  it("bounds input and rejects unknown fields without enlarging arithmetic body limits", async () => {
    const invalid: any = fixture();
    invalid.learnerId = "other-child";
    expect((await put(invalid)).status).toBe(400);
    expect(
      (
        await request("PUT", "/api/teaching/journal", {
          revision: 0,
          journal: fixture(),
          learnerId: "other-child",
        })
      ).status,
    ).toBe(400);
    expect(
      (await request("POST", "/api/round", { skill_id: "x".repeat(20_000) }))
        .status,
    ).toBe(413);
    expect(
      (await put({ ...fixture(), padding: "x".repeat(2_100_000) })).status,
    ).toBe(413);
  });
  it("reopens durable evidence from a new database connection and module instance", async () => {
    const saved = await put(fixture());
    vi.resetModules();
    const reopenedStore = await import("../src/journal.js");
    const reopenedDb = await import("../src/db.js");
    expect(reopenedStore.readTeachingJournal("L-1")).toEqual(saved.body);
    reopenedDb.db.close();
  });
  it("demo reset explicitly clears both journal state and evidence tables", async () => {
    await put(fixture());
    expect((await request("POST", "/api/admin/reset")).status).toBe(200);
    expect((await get()).body).toEqual({ revision: 0, journal: null });
    expect(
      (db.prepare("SELECT COUNT(*) n FROM teaching_runs").get() as any).n,
    ).toBe(0);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) n FROM teaching_interpretations")
          .get() as any
      ).n,
    ).toBe(0);
  });
});

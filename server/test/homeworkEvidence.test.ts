import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
process.env.DB_FILE = ":memory:";
delete process.env.ANTHROPIC_API_KEY;
const { app } = await import("../src/app.js");
const { db, reset } = await import("../src/db.js");
const { startHomework, answerHomework } = await import("../src/homework.js");
const { readHomeworkEvidence } = await import("../src/homeworkEvidence.js");
beforeEach(() => reset());

function complete() {
  const set = startHomework("L-1", "add20");
  const key = JSON.parse(
    (
      db
        .prepare("SELECT key_json FROM homework_sets WHERE id=?")
        .get(set.id) as { key_json: string }
    ).key_json,
  );
  const result = answerHomework(
    "L-1",
    set.id,
    key.wrong_index,
    "none",
    key.correct_answer,
  );
  return { set, key, result };
}
function get(
  path: string,
): Promise<{ status: number; body: any; cache: unknown }> {
  return new Promise((resolve, reject) => {
    const req = new IncomingMessage(new Socket());
    req.method = "GET";
    req.url = path;
    const res = new ServerResponse(req);
    res.end = ((chunk: any) => {
      try {
        resolve({
          status: res.statusCode,
          body: JSON.parse(String(chunk)),
          cache: res.getHeader("Cache-Control"),
        });
      } catch (error) {
        reject(error);
      }
      return res;
    }) as typeof res.end;
    app(req, res);
    req.push(null);
  });
}

describe("completed worksheet evidence", () => {
  it("demo reset clears completed and unfinished worksheet evidence with the journal", () => {
    complete();
    startHomework("L-1", "add20");
    reset();
    expect(readHomeworkEvidence("L-1").total).toBe(0);
    expect(
      (
        db.prepare("SELECT COUNT(*) n FROM homework_sets").get() as {
          n: number;
        }
      ).n,
    ).toBe(0);
  });
  it("never exposes unfinished worksheet keys through the read endpoint", async () => {
    startHomework("L-1", "add20");
    const response = await get("/api/homework/evidence");
    expect(response.status).toBe(200);
    expect(response.cache).toBe("no-store");
    expect(response.body).toEqual({ worksheets: [], total: 0, limit: 100 });
  });
  it("links separate checks to the exact submitted response and shown worksheet", async () => {
    const { set, key } = complete();
    const response = await get("/api/homework/evidence");
    const record = response.body.worksheets[0];
    expect(record.id).toBe(set.id);
    expect(record.problems).toEqual(set.problems);
    expect(record.reasons).toEqual(set.reasons);
    expect(record.response).toEqual({
      spotted_index: key.wrong_index,
      reason: "none",
      fixed_answer: key.correct_answer,
    });
    expect(record.completed_at).toBeTypeOf("number");
    expect(record.result).toMatchObject({
      spotted: true,
      explained: false,
      fixed: true,
    });
    expect(record).not.toHaveProperty("seed");
  });
  it("only reads the requested learner and replay cannot duplicate a record", () => {
    const { set, key } = complete();
    answerHomework(
      "L-1",
      set.id,
      key.wrong_index,
      key.slip,
      key.correct_answer,
    );
    expect(readHomeworkEvidence("other-learner").worksheets).toHaveLength(0);
    const records = readHomeworkEvidence("L-1");
    expect(records.total).toBe(1);
    expect(records.worksheets[0].response?.reason).toBe("none");
  });
  it("keeps earlier saved outcomes but never fabricates missing child selections or completion time", () => {
    const { set, result } = complete();
    const oldResult = { ...result } as Record<string, unknown>;
    delete oldResult.response;
    delete oldResult.completed_at;
    db.prepare("UPDATE homework_sets SET result=? WHERE id=?").run(
      JSON.stringify(oldResult),
      set.id,
    );
    const record = readHomeworkEvidence("L-1").worksheets[0];
    expect(record.response).toBeNull();
    expect(record.completed_at).toBeNull();
    expect(record.result).toMatchObject({
      spotted: true,
      explained: false,
      fixed: true,
    });
  });
  it("bounds the view while reporting the full completed count", () => {
    const { set } = complete();
    const row = db
      .prepare("SELECT * FROM homework_sets WHERE id=?")
      .get(set.id) as any;
    for (let i = 1; i <= 101; i++)
      db.prepare(
        "INSERT INTO homework_sets(id,learner_id,skill_id,level,set_json,key_json,result,created_at) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        `copy-${i}`,
        "L-1",
        row.skill_id,
        row.level,
        row.set_json,
        row.key_json,
        row.result,
        row.created_at + i,
      );
    const page = readHomeworkEvidence("L-1");
    expect(page.total).toBe(102);
    expect(page.worksheets).toHaveLength(100);
    expect(page.worksheets[0].id).toBe("copy-101");
  });
});

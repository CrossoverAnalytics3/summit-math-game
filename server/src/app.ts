import "./env.js";
import express from "express";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { existsSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { db, seed, reset, today, setToday, addDays } from "./db.js";
import { logEvent } from "./events.js";
import { isEnabledFor, rolloutPct } from "./flags.js";
import { SKILLS, MAX_LEVEL } from "./skills.js";
import {
  progress,
  comebackStatus,
  applyComeback,
  weeklyFacts,
  RUN_TO_UNLOCK,
} from "./progress.js";
import { storyProblem, hint, parentNote } from "./ai/story.js";
import { pickAdapter, stubAdapter } from "./ai/adapter.js";
import {
  currentLevel,
  startRound,
  saveRound,
  getRound,
  submitAnswer,
  finishRound,
  beginHint,
  cacheHint,
} from "./rounds.js";
import { startHomework, answerHomework } from "./homework.js";
import { readHomeworkEvidence } from "./homeworkEvidence.js";
import {
  createTeachingBudget,
  teachingCoach,
  teachingRequestSchema,
} from "./teaching.js";
import {
  readTeachingJournal,
  saveTeachingJournal,
  readTeachingRun,
  readTeachingBrief,
} from "./journal.js";

seed();
export const app = express();
// Journals contain bounded replay traces; keep other API body limits small.
app.use("/api/teaching/journal", express.json({ limit: "2mb" }));
app.use(express.json({ limit: "16kb" }));
const L = "L-1"; // Single synthetic learner: never deploy as a multi-user service.
const consent = () =>
  (
    db
      .prepare("SELECT guardian_consent_ai c FROM learners WHERE id=?")
      .get(L) as { c: number }
  ).c === 1;
const permittedAdapter = () => (consent() ? pickAdapter() : stubAdapter);

const ok = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const r = schema.safeParse(body);
  if (!r.success)
    throw Object.assign(
      new Error(r.error.issues.map((i) => i.message).join("; ")),
      { status: 400 },
    );
  return r.data;
};
const asyncRoute =
  (
    fn: (req: express.Request, res: express.Response) => Promise<unknown>,
  ): express.RequestHandler =>
  (req, res, next) => {
    void fn(req, res).catch(next);
  };

app.get("/api/health", (_req, res) =>
  res.json({
    today: today(),
    ai: permittedAdapter().name,
    configured_ai: pickAdapter().name,
    guardian_consent_ai: consent(),
    rollout_pct: rolloutPct(),
    story_missions_enabled: isEnabledFor(L),
  }),
);

// These four routes share the existing synthetic L-1 workspace. They provide
// persistence across browsers connected to this server, not account authentication.
app.get("/api/teaching/journal", (_req, res) =>
  res.json(readTeachingJournal(L)),
);
app.put("/api/teaching/journal", (req, res) => {
  const { snapshot, conflict } = saveTeachingJournal(L, req.body);
  res
    .status(conflict ? 409 : 200)
    .json(
      conflict
        ? {
            error:
              "The saved journal changed in another window. Review its copy before saving again.",
            ...snapshot,
          }
        : snapshot,
    );
});
app.get("/api/teaching/runs/:id", (req, res) => {
  const runId = ok(z.string().regex(/^[A-Za-z0-9_-]{1,100}$/), req.params.id);
  const run = readTeachingRun(L, runId);
  res
    .status(run ? 200 : 404)
    .json(run ? { run } : { error: "That teaching run was not found." });
});
app.get("/api/teaching/brief", (_req, res) => res.json(readTeachingBrief(L)));

const teachingBudget = createTeachingBudget();
app.post(
  "/api/teaching/coach",
  asyncRoute(async (req, res) => {
    const input = ok(teachingRequestSchema, req.body);
    if (!teachingBudget(req.ip ?? "local"))
      return res
        .status(429)
        .json({
          error:
            "Take a moment to try your idea, then ask Pip another question.",
        });
    res.json(await teachingCoach(input, permittedAdapter()));
  }),
);

app.get("/api/home", (_req, res) => {
  const learner = db
    .prepare(
      "SELECT display_name, age, daily_streak, last_played_on, streak_freeze, guardian_consent_ai FROM learners WHERE id=?",
    )
    .get(L);
  const prog = progress(L);
  res.json({
    learner,
    today: today(),
    comeback: comebackStatus(L),
    run_to_unlock: RUN_TO_UNLOCK,
    max_level: MAX_LEVEL,
    guardian_consent_ai: consent(),
    story_missions_enabled: isEnabledFor(L),
    skills: SKILLS.map((s) => ({
      ...s,
      ...(prog.find((p) => p.skill_id === s.id) ?? {
        level: 1,
        run: 0,
        high_score: 0,
        wins: 0,
        seconds: 0,
      }),
    })),
  });
});

app.post("/api/settings/ai-consent", (req, res) => {
  const { enabled } = ok(z.object({ enabled: z.boolean() }).strict(), req.body);
  db.prepare("UPDATE learners SET guardian_consent_ai=? WHERE id=?").run(
    enabled ? 1 : 0,
    L,
  );
  logEvent("guardian_consent_changed", { learner_id: L, payload: { enabled } });
  res.json({ guardian_consent_ai: enabled, ai: permittedAdapter().name });
});
app.post("/api/comeback/apply", (_req, res) => res.json(applyComeback(L)));

app.post("/api/round", (req, res) => {
  const { skill_id, rules } = ok(z.object({
    skill_id: z.string(),
    rules: z.object({
      hearts: z.union([z.literal(1), z.literal(3)]).optional(),
      timer: z.boolean().optional(),
      difficulty: z.enum(["easier", "same", "harder"]).optional(),
      avoid_digit: z.number().int().min(0).max(9).nullable().optional(),
    }).strict().optional(),
  }).strict(), req.body);
  res.json(startRound(L, skill_id, rules));
});

// Fix Pip's homework: Pip did the worksheet and slipped once. Find it, say why, fix it.
app.get("/api/homework/evidence", (_req, res) => {
  res.set("Cache-Control", "no-store").json(readHomeworkEvidence(L));
});
app.post("/api/homework", (req, res) => {
  const { skill_id, slip } = ok(z.object({ skill_id: z.string(), slip: z.enum(["forgot_carry", "small_from_big", "skip_short", "group_short", "swapped_places", "off_by_one"]).optional() }).strict(), req.body);
  res.json(startHomework(L, skill_id, slip));
});
app.post("/api/homework/:id/answer", (req, res) => {
  const b = ok(z.object({ spotted_index: z.number().int().min(0).max(2), reason: z.enum(["forgot_carry", "small_from_big", "skip_short", "group_short", "swapped_places", "off_by_one", "wrong_operation", "copied_wrong", "none"]), fixed_answer: z.number().int().min(0) }).strict(), req.body);
  res.json(answerHomework(L, req.params.id, b.spotted_index, b.reason, b.fixed_answer));
});
app.get("/api/round/:id", (req, res) => {
  const roundId = ok(z.string().uuid(), req.params.id);
  res.json(getRound(L, roundId));
});
app.post("/api/answer", (req, res) => {
  const b = ok(
    z
      .object({
        problem_id: z.string().uuid(),
        answer: z.number().int().finite(),
      })
      .strict(),
    req.body,
  );
  res.json(submitAnswer(L, b.problem_id, b.answer));
});
app.post("/api/round/finish", (req, res) => {
  const b = ok(z.object({ round_id: z.string().uuid() }).strict(), req.body);
  res.json(finishRound(L, b.round_id));
});

app.post(
  "/api/story",
  asyncRoute(async (req, res) => {
    const b = ok(
      z
        .object({
          skill_id: z.string(),
          theme: z
            .enum(["animals", "space", "ocean", "dinosaurs"])
            .default("animals"),
        })
        .strict(),
      req.body,
    );
    if (!isEnabledFor(L))
      return res
        .status(404)
        .json({ error: "Story missions are not enabled for this learner" });
    const level = currentLevel(L, b.skill_id);
    const r = await storyProblem(
      b.skill_id,
      level,
      randomInt(1, 2 ** 31),
      b.theme ?? "animals",
      permittedAdapter(),
    );
    const round = saveRound(L, b.skill_id, level, [r.problem]);
    logEvent("story_generated", {
      learner_id: L,
      payload: {
        skill_id: b.skill_id,
        level,
        source: r.provenance.final_source,
      },
    });
    res.json({
      round_id: round.round_id,
      level,
      problem: round.problems[0],
      provenance: r.provenance,
      hearts_total: null,
      hearts_remaining: null,
      bonus_seconds: null,
      bonus_deadline_at: null,
      server_now: round.server_now,
    });
  }),
);

app.post(
  "/api/hint",
  asyncRoute(async (req, res) => {
    const b = ok(
      z.object({ problem_id: z.string().uuid() }).strict(),
      req.body,
    );
    const { problem, cached } = beginHint(L, b.problem_id);
    if (cached) return res.json(cached);
    const r = await hint(problem, null, permittedAdapter());
    cacheHint(b.problem_id, r);
    logEvent("hint_requested", {
      learner_id: L,
      payload: {
        skill_id: problem.skill_id,
        source: r.provenance.final_source,
      },
    });
    res.json(r);
  }),
);

app.get(
  "/api/parent",
  asyncRoute(async (_req, res) => {
    const facts = weeklyFacts(L);
    const name = (
      db.prepare("SELECT display_name n FROM learners WHERE id=?").get(L) as {
        n: string;
      }
    ).n;
    const note = await parentNote(facts, name, permittedAdapter());
    res.json({ facts, ...note });
  }),
);

app.get("/api/events", (_req, res) =>
  res.json(
    db
      .prepare("SELECT * FROM events ORDER BY ts DESC, rowid DESC LIMIT 100")
      .all(),
  ),
);
app.post("/api/clock/advance", (req, res) => {
  const { days } = ok(
    z.object({ days: z.number().int().min(1).max(30) }).strict(),
    req.body,
  );
  setToday(addDays(today(), days));
  res.json({ today: today() });
});
app.post("/api/admin/reset", (_req, res) => {
  reset();
  res.json({ ok: true });
});

// Unknown API routes always stay JSON, even when the browser build is served.
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "This trail endpoint was not found" }),
);

// Building web/dist makes this same local demo server serve the complete game.
// Development continues to use Vite's proxy and hot reload on port 5174.
const webDist = fileURLToPath(new URL("../../web/dist/", import.meta.url));
const webIndex = fileURLToPath(
  new URL("../../web/dist/index.html", import.meta.url),
);
if (existsSync(webIndex)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (extname(req.path) || !req.accepts("html")) return next();
    res.sendFile(webIndex);
  });
}

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) =>
    res
      .status(err.status ?? 500)
      .json({
        error: err.status
          ? err.message
          : "Something interrupted this expedition. Please try again.",
      }),
);

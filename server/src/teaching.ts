import { z } from "zod";
import { contextFor, simulateTeaching } from "../../shared/expedition.js";
import type { AiAdapter } from "./ai/adapter.js";
import { stubAdapter } from "./ai/adapter.js";

const planSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fixed"), amount: z.number().int().min(1).max(30) }).strict(),
  z.object({ kind: z.literal("rounds") }).strict(),
  z.object({ kind: z.literal("fraction"), n: z.number().int().min(1).max(12), d: z.number().int().min(1).max(12) }).strict(),
]);

// Narrative and questions use recomputed game state. No client-supplied result,
// score, personality claim, or arbitrary instruction is part of this contract.
export const teachingRequestSchema = z.object({
  route: z.enum(["ridge", "meadow"]),
  stage: z.enum(["first", "changed", "transfer"]),
  plan: planSchema,
  prediction: z.enum(["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "not-sure"]).default(""),
  supports: z.array(z.enum(["picture", "coach"])).max(2).default([]),
  evidenceId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  variation: z.number().int().min(0).max(2).default(0),
}).strict();

export type TeachingRequest = z.infer<typeof teachingRequestSchema>;
export interface TeachingCoach {
  source: "ai" | "authored";
  title: string;
  question: string;
  narrative: string;
  evidenceIds: string[];
  generation: { question: "ai-selected" | "authored"; narrative: "ai-selected" | "authored" };
}

type Outcome = "cannot-share" | "unequal" | "remaining" | "complete";
type Questions = readonly [string, string, string];
const QUESTION_BANK: Record<Outcome, Questions> = {
  "cannot-share": [
    "What could you change so Pip can share whole berries?",
    "Which part of your instruction could you try differently?",
    "What would you like Pip to do when a share cannot be made?",
  ],
  unequal: [
    "Which instruction made the packs different?",
    "What would you change so every friend receives an equal share?",
    "How could you test a new instruction before Pip tries again?",
  ],
  remaining: [
    "What would you like Pip to do with the berries left in the basket?",
    "Does the instruction do everything you wanted it to do?",
    "What would you change before trying the instruction again?",
  ],
  complete: [
    "What made this instruction work for the whole group?",
    "How could you check whether your teaching would work with a different group?",
    "What part of your instruction would you keep for the next stop?",
  ],
};
const CHANGED_QUESTIONS: Questions = [
  "What matters about your instruction in this changed situation?",
  "What would you predict if the supplies or group changed again?",
  "Which part of the instruction would you explain to another explorer?",
];
const TRANSFER_QUESTIONS: Questions = [
  "How would you explain why your instruction worked here?",
  "What could you change about the supplies to test your teaching again?",
  "Could another instruction reach the same goal?",
];
const PIP_LINES: Questions = [
  'Pip says, “Let’s slow down and look at what happened.”',
  'Pip says, “Let’s trace the instruction together.”',
  'Pip says, “What would you like to explore from here?”',
];

function describe(input: TeachingRequest) {
  const context = contextFor(input.route, input.stage);
  const result = simulateTeaching(input.plan, context.total, context.party);
  const outcome: Outcome = result.error ? "cannot-share" : !result.fair ? "unequal" : result.remaining > 0 ? "remaining" : "complete";
  const questions = outcome !== "complete" ? QUESTION_BANK[outcome]
    : input.stage === "changed" ? CHANGED_QUESTIONS
    : input.stage === "transfer" ? TRANSFER_QUESTIONS : QUESTION_BANK.complete;
  const title = outcome === "complete" ? "A question for your next idea" : "What would you teach Pip next?";
  // A concrete description of this simulation only; no inference about ability,
  // intention, emotion, preferred learning style, or earlier attempts.
  const narrative = result.error
    ? `Pip could not carry out this instruction using whole berries. The basket still holds ${result.remaining} berries.`
    : `Pip followed this instruction. The packs hold ${result.shares.join(", ")} berries, with ${result.remaining} left in the basket.`;
  return { context, result, outcome, questions, title, narrative };
}

async function boundedCompletion(adapter: AiAdapter, prompt: string): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      adapter.complete(prompt, 60).catch(() => null),
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 8_000); }),
    ]);
  } catch { return null; }
  finally { if (timer) clearTimeout(timer); }
}

/**
 * AI chooses a relevant next question and Pip line from finite, checked banks. It
 * never generates report claims or game mechanics. This provides a stronger boundary
 * than a lexical filter over unrestricted prose. The source label means
 * AI-selected question, not model-authored evidence or mathematical validation.
 * The evidence ID is a client journal reference, not server authentication.
 */
export async function teachingCoach(value: unknown, adapter: AiAdapter = stubAdapter): Promise<TeachingCoach> {
  const parsed = teachingRequestSchema.safeParse(value);
  if (!parsed.success) throw Object.assign(new Error("That teaching record is not valid."), { status: 400 });
  const input = parsed.data;
  const state = describe(input);
  let selected = input.variation;
  let storyId = input.variation;
  let source: TeachingCoach["source"] = "authored";
  if (adapter.name !== "stub") {
    // Child text, support labels, identifiers and history are deliberately not
    // sent. Context, instruction and outcome are finite server-validated fields.
    const prompt = [
      "Choose a useful, open question and a short Pip line for a child reviewing a teachable character's actions.",
      "Choose ONLY from the supplied question IDs and story IDs. Do not infer personality, ability, emotion, diagnosis, intention, or a learning style.",
      "There is no previous-session evidence. Do not produce an answer, new story event, claim, explanation, or extra field.",
      `Verified simulation: ${JSON.stringify({ route: input.route, stage: input.stage, total: state.context.total, party: state.context.party, plan: input.plan, shares: state.result.shares, remaining: state.result.remaining, outcome: state.outcome, predictionRecorded: input.prediction.length > 0, supportRecorded: input.supports.length > 0 })}`,
      `Available questions: ${JSON.stringify(state.questions.map((question, id) => ({ id, question })))}`,
      `Available Pip lines: ${JSON.stringify(PIP_LINES.map((line, id) => ({ id, line })))}`,
      'Return strict JSON only: {"questionId":0,"storyId":0} (integer IDs from the supplied lists).',
    ].join("\n");
    const raw = await boundedCompletion(adapter, prompt);
    if (raw && raw.length <= 120) {
      try {
        const choice = z.object({ questionId: z.number().int().min(0).max(2), storyId: z.number().int().min(0).max(2) }).strict().safeParse(JSON.parse(raw));
        if (choice.success) { selected = choice.data.questionId; storyId = choice.data.storyId; source = "ai"; }
      } catch { /* The authored question remains available. */ }
    }
  }
  return {
    source,
    title: state.title,
    question: state.questions[selected],
    narrative: `${PIP_LINES[storyId]} ${state.narrative}`,
    evidenceIds: [input.evidenceId],
    generation: { question: source === "ai" ? "ai-selected" : "authored", narrative: source === "ai" ? "ai-selected" : "authored" },
  };
}

// Applies only to explicit coach requests; ordinary play stays available.
export function createTeachingBudget(limit = 12, windowMs = 60_000) {
  const visits = new Map<string, { start: number; count: number }>();
  return (key: string, now = Date.now()): boolean => {
    for (const [id, visit] of visits) if (now - visit.start >= windowMs) visits.delete(id);
    const visit = visits.get(key);
    if (visit) {
      if (visit.count >= limit) return false;
      visit.count += 1;
      return true;
    }
    if (visits.size >= 256) return false;
    visits.set(key, { start: now, count: 1 });
    return true;
  };
}

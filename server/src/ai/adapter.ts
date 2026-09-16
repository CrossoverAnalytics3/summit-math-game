import "../env.js";
// One seam to the model. Everything else is validation in code.
export interface AiAdapter { name: string; model: string; complete(prompt: string, maxTokens?: number): Promise<string | null> }

export const stubAdapter: AiAdapter = { name: "stub", model: "none", async complete() { return null; } };

export const anthropicAdapter: AiAdapter = {
  name: "anthropic",
  get model() { return process.env.AI_MODEL ?? "claude-sonnet-4-5"; },
  async complete(prompt, maxTokens = 300) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(8_000),
        headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: this.model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) return null;
      const j: any = await res.json();
      return j?.content?.[0]?.text ?? null;
    } catch { return null; }
  },
};
export function pickAdapter(): AiAdapter { return process.env.ANTHROPIC_API_KEY ? anthropicAdapter : stubAdapter; }

export const PROMPTS = {
  story: "story.v2",
  hint: "hint.v2",
  parent: "parent.v2",
};
export function parseJson(text: string | null): any | null {
  if (!text) return null;
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { return null; }
}

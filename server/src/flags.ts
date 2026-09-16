import { createHash } from "node:crypto";

// Deterministic bucketing: a learner always lands in the same bucket, so the
// experience doesn't flap between requests. Change SUMMIT_ROLLOUT_PCT to
// canary (10), expand (50), or roll back (0) without a deploy.
export function rolloutPct(): number {
  const n = Number(process.env.SUMMIT_ROLLOUT_PCT ?? "100");
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export function isEnabledFor(learnerId: string): boolean {
  const h = parseInt(createHash("sha256").update(learnerId).digest("hex").slice(0, 8), 16) % 100;
  return h < rolloutPct();
}

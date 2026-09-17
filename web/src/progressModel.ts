import type { RunRecord, Route, Stage } from "../../shared/expedition";
export function routeProgress(runs: readonly RunRecord[]) {
  const stages: [Stage, string][] = [
    ["first", "First teaching"],
    ["changed", "Changed situation"],
    ["transfer", "Fresh summit challenge"],
  ];
  return (["ridge", "meadow"] as Route[]).map((route) => {
    const successes = runs.filter(
      (r) => r.route === route && !r.systemIssue && r.result.complete,
    );
    const transfer = successes.filter((r) => r.stage === "transfer").at(-1);
    return {
      route,
      stages: stages.map(([stage, label]) => ({
        stage,
        label,
        complete: successes.some((r) => r.stage === stage),
      })),
      complete: stages.every(([s]) => successes.some((r) => r.stage === s)),
      transferWithSupport: !!transfer?.supports.length,
    };
  });
}
export function comebackDue(
  book: {
    route: Route | null;
    completed: boolean;
    lastPlayedAt?: string;
    returnDismissedAt?: string;
    runs: readonly RunRecord[];
  },
  now = Date.now(),
) {
  const last = book.lastPlayedAt || book.runs.at(-1)?.date;
  if (!book.route || book.completed || !last) return false;
  const time = Date.parse(last),
    dismissed = Date.parse(book.returnDismissedAt || "");
  return (
    Number.isFinite(time) &&
    now - time >= 5 * 86400000 &&
    !(Number.isFinite(dismissed) && dismissed >= time)
  );
}

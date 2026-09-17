import type {
  HomeworkEvidence,
  HomeworkEvidencePage,
} from "../../shared/homeworkEvidence.ts";

export function uniqueWorksheets(worksheets: readonly HomeworkEvidence[]) {
  return [
    ...new Map(
      worksheets.map((worksheet) => [worksheet.id, worksheet]),
    ).values(),
  ];
}

/** Report each checked action separately; never turn recognition into a learner trait. */
export function homeworkFacts(worksheets: readonly HomeworkEvidence[]) {
  const observed = uniqueWorksheets(worksheets);
  const checks = [
    ["spotted", "Found the slip"],
    ["explained", "Named the reason"],
    ["fixed", "Fixed the answer"],
  ] as const;
  return checks.map(([key, label]) => {
    const passed = observed.filter((worksheet) => worksheet.result[key]);
    return {
      key,
      label,
      count: passed.length,
      total: observed.length,
      text: `${label}: ${passed.length} of ${observed.length} completed ${observed.length === 1 ? "worksheet" : "worksheets"}.`,
      // Even a zero must lead back to the observations supporting that statement.
      worksheetIds: (passed.length ? passed : observed).map(
        (worksheet) => worksheet.id,
      ),
    };
  });
}

export async function fetchHomeworkEvidence(
  signal: AbortSignal,
): Promise<HomeworkEvidencePage> {
  const response = await fetch("/api/homework/evidence", {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Worksheet evidence could not be loaded.");
  const page = (await response.json()) as HomeworkEvidencePage;
  if (
    !page ||
    !Array.isArray(page.worksheets) ||
    !Number.isInteger(page.total) ||
    !Number.isInteger(page.limit)
  )
    throw new Error("Worksheet evidence could not be read.");
  return { ...page, worksheets: uniqueWorksheets(page.worksheets) };
}

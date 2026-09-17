import {
  reconcileInterpretations,
  type Interpretation,
  type RunRecord,
} from "../../shared/expedition.ts";

export interface BriefLine {
  text: string;
  runIds: string[];
}

export interface BriefRow {
  key: "demonstrated" | "uncertain" | "support" | "next";
  title: string;
  lines: BriefLine[];
}

/** Session observations, never a profile of the child or a mastery estimate. */
export function buildTutorBrief(
  runs: readonly RunRecord[],
  receipts: readonly Interpretation[],
  notes: Readonly<Record<string, string>> = {},
): BriefRow[] {
  const byId = new Map<string, RunRecord>();
  for (const run of runs)
    if (!byId.get(run.id)?.systemIssue) byId.set(run.id, run);
  const observed = [...byId.values()];
  const eligible = observed.filter((run) => !run.systemIssue);
  const complete = eligible.filter((run) => run.result.complete);
  const supported = eligible.filter((run) => run.supports.length > 0);
  const withoutSupport = eligible.filter((run) => run.supports.length === 0);
  const issues = observed.filter((run) => run.systemIssue);
  const transfer = complete.filter((run) => run.stage === "transfer").at(-1);
  const checked = reconcileInterpretations(receipts, observed);
  const active = checked
    .filter(
      (receipt) =>
        (receipt.status === "proposed" || receipt.status === "confirmed") &&
        receipt.nextQuestion.status === "active",
    )
    .at(-1);
  const correction = checked
    .filter((receipt) => receipt.status === "corrected" && receipt.correction)
    .at(-1);
  const latestNote = observed.filter((run) => !!notes[run.id]?.trim()).at(-1);
  const ids = (records: readonly RunRecord[]) => records.map((run) => run.id);

  const demonstrated: BriefLine[] = [
    {
      text: complete.length
        ? `Equal shares with an empty basket in ${complete.length} of ${eligible.length} eligible ${eligible.length === 1 ? "attempt" : "attempts"}.`
        : eligible.length
          ? "No completed fair share observed yet. The attempts still show what Pip did with the teaching."
          : "No eligible teaching has been observed yet.",
      runIds: ids(complete.length ? complete : eligible),
    },
  ];
  if (transfer)
    demonstrated.push({
      text: `Summit check: ${transfer.context.total} berries shared among ${transfer.context.party} friends${transfer.supports.length ? ", with recorded support" : ", without picture or coach in this attempt"}. This is a local transfer observation, not proof of mastery.`,
      runIds: [transfer.id],
    });

  const uncertain: BriefLine[] = [
    {
      text:
        eligible.length < 2
          ? `${eligible.length === 1 ? "One eligible observation. Another is needed" : "Two eligible observations are needed"} before proposing an interpretation. Even two do not prove a pattern.`
          : "These observations do not establish lasting mastery, a preferred learning style, or why a choice was made.",
      runIds: ids(eligible),
    },
  ];
  if (issues.length)
    uncertain.push({
      text: `${issues.length} ${issues.length === 1 ? "system issue is" : "system issues are"} excluded from learner evidence. The original replay is preserved.`,
      runIds: ids(issues),
    });
  if (correction?.correction)
    uncertain.push({
      text: `Correction retained: “${correction.correction.note}” The dependent question is withdrawn.`,
      runIds: correction.correction.runId
        ? [correction.correction.runId]
        : correction.runIds.filter((id) => byId.has(id)),
    });
  else if (latestNote)
    uncertain.push({
      text: `Learner's note: “${notes[latestNote.id]}” This is their account, not an inferred explanation.`,
      runIds: [latestNote.id],
    });

  const support: BriefLine[] = [];
  if (supported.length)
    support.push({
      text: `${supported.length} ${supported.length === 1 ? "attempt had" : "attempts had"} recorded support: ${[...new Set(supported.flatMap((run) => run.supports))].map((value) => (value === "picture" ? "picture" : value === "coach" ? "coach" : value)).join(", ")}.`,
      runIds: ids(supported),
    });
  if (withoutSupport.length)
    support.push({
      text: `${withoutSupport.length} ${withoutSupport.length === 1 ? "attempt had" : "attempts had"} no recorded picture or coach. This does not rule out help outside the app.`,
      runIds: ids(withoutSupport),
    });
  if (!support.length)
    support.push({
      text: "No eligible support record yet. Tutorials and navigation beacons are separate from mathematical support.",
      runIds: [],
    });

  const next: BriefLine[] = [
    active
      ? { text: active.nextQuestion.text, runIds: active.runIds }
      : {
          text:
            eligible.length < 2
              ? "Collect another teaching, then invite the learner to compare what happened. No interpretation-based question is active yet."
              : "No interpretation-based question is active. Invite the learner to describe these attempts in their own words.",
          runIds: ids(eligible).slice(-2),
        },
  ];

  return [
    {
      key: "demonstrated",
      title: "What was demonstrated?",
      lines: demonstrated,
    },
    { key: "uncertain", title: "What is still uncertain?", lines: uncertain },
    { key: "support", title: "What support appeared?", lines: support },
    { key: "next", title: "What could we ask next?", lines: next },
  ];
}

import { useId } from "react";
import type { Interpretation, RunRecord } from "../../shared/expedition";
import { buildTutorBrief } from "./tutorEvidence";
import { Icon, type IconName } from "./ui";
import type { HomeworkEvidence } from "../../shared/homeworkEvidence";
import { homeworkFacts } from "./homeworkEvidenceModel";
import "./tutor-brief.css";

const icons: Record<string, IconName> = {
  demonstrated: "flag",
  uncertain: "help",
  support: "leaf",
  next: "compass",
};
const stageNames = {
  first: "first camp",
  changed: "changed situation",
  transfer: "summit check",
};

export function TutorBrief({
  runs,
  receipts,
  notes,
  onOpenRun,
  worksheets = [],
  onOpenWorksheet,
}: {
  runs: readonly RunRecord[];
  receipts: readonly Interpretation[];
  notes: Readonly<Record<string, string>>;
  onOpenRun: (id: string) => void;
  worksheets?: readonly HomeworkEvidence[];
  onOpenWorksheet?: (id: string) => void;
}) {
  const headingId = useId();
  const rows = buildTutorBrief(runs, receipts, notes);
  const positions = new Map(runs.map((run, index) => [run.id, index + 1]));
  const worksheetPositions = new Map(
    worksheets.map((worksheet, index) => [
      worksheet.id,
      worksheets.length - index,
    ]),
  );
  const worksheetLines = {
    demonstrated: homeworkFacts(worksheets).map((fact) => ({
      text: fact.text,
      worksheetIds: fact.worksheetIds,
    })),
    uncertain: [
      {
        text: "Worksheet checks record responses with Pip's worked steps visible. They do not establish an independent explanation or lasting mastery.",
        worksheetIds: worksheets.map((worksheet) => worksheet.id),
      },
    ],
    support: [
      {
        text: "Worksheet support: Pip's worked steps and four reason choices. Additional help was not recorded.",
        worksheetIds: worksheets.map((worksheet) => worksheet.id),
      },
    ],
    next: [
      {
        text: "A question to ask together: Which step would you change, and how would you show Pip why?",
        worksheetIds: worksheets.slice(0, 1).map((worksheet) => worksheet.id),
      },
    ],
  };
  const worksheetLink = (id: string) => (
    <button
      type="button"
      key={id}
      onClick={() => onOpenWorksheet?.(id)}
      aria-label={`Open worksheet ${worksheetPositions.get(id)}`}
    >
      <Icon name="book" size={12} /> Worksheet {worksheetPositions.get(id)}{" "}
      <Icon name="arrow" size={12} />
    </button>
  );
  const evidenceLink = (id: string) => {
    const run = runs.find((candidate) => candidate.id === id);
    if (!run) return null;
    return (
      <button
        type="button"
        key={id}
        onClick={() => onOpenRun(id)}
        aria-label={`Open teaching ${positions.get(id)}, ${stageNames[run.stage]}, ${run.route === "ridge" ? "Beacon Ridge" : "Meadow Camp"}${run.systemIssue ? ", system issue" : ""}`}
      >
        <Icon name="book" size={12} />
        Teaching {positions.get(id)}
        <Icon name="arrow" size={12} />
      </button>
    );
  };
  return (
    <section className="tutor-brief" aria-labelledby={headingId}>
      <header className="tutor-brief-heading">
        <div>
          <span className="eyebrow">FOR A CONVERSATION, NOT A LABEL</span>
          <h2 id={headingId}>A tutor's field notes</h2>
        </div>
        <p>
          Four questions. Every observation leads back to the teaching or
          worksheet that produced it.
        </p>
      </header>
      <div className="tutor-brief-grid">
        {rows.map((row) => (
          <article
            className={`tutor-brief-row tutor-brief-${row.key}`}
            key={row.key}
          >
            <h3>
              <Icon name={icons[row.key]} size={18} />
              {row.title}
            </h3>
            {row.lines.map((line, index) => (
              <div className="tutor-brief-line" key={`${row.key}-${index}`}>
                <p>{line.text}</p>
                {!!line.runIds.length && (
                  <div
                    className="tutor-brief-links"
                    aria-label={`Evidence for ${row.title.toLowerCase()}`}
                  >
                    {line.runIds.slice(-3).map(evidenceLink)}
                    {line.runIds.length > 3 && (
                      <details>
                        <summary>
                          {line.runIds.length - 3} earlier{" "}
                          {line.runIds.length === 4 ? "teaching" : "teachings"}
                        </summary>
                        <div className="tutor-brief-earlier">
                          {line.runIds.slice(0, -3).map(evidenceLink)}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!!worksheets.length &&
              worksheetLines[row.key].map((line, index) => (
                <div className="tutor-brief-line" key={`worksheet-${index}`}>
                  <p>{line.text}</p>
                  <div
                    className="tutor-brief-links"
                    aria-label={`Worksheet evidence for ${row.title.toLowerCase()}`}
                  >
                    {line.worksheetIds.slice(0, 3).map(worksheetLink)}
                    {line.worksheetIds.length > 3 && (
                      <details>
                        <summary>
                          {line.worksheetIds.length - 3} earlier worksheets
                        </summary>
                        <div className="tutor-brief-earlier">
                          {line.worksheetIds.slice(3).map(worksheetLink)}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
          </article>
        ))}
      </div>
      <p className="tutor-brief-footnote">
        Two eligible climb attempts allow a tentative interpretation, not a
        conclusion. The learner can correct it.
      </p>
    </section>
  );
}

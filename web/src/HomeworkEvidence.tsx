import { useId } from "react";
import { SLIP_TEXT } from "../../shared/homework";
import type { HomeworkEvidencePage } from "../../shared/homeworkEvidence";
import { Button, Icon } from "./ui";
import { homeworkFacts } from "./homeworkEvidenceModel";
import "./homework-evidence.css";

export function HomeworkEvidence({
  page,
  status,
  retry,
}: {
  page: HomeworkEvidencePage | null;
  status: "loading" | "ready" | "error";
  retry: () => void;
}) {
  const headingId = useId();
  const exportWorksheets = () => {
    if (!page) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              kind: "summit-worksheet-evidence",
              exported_at: new Date().toISOString(),
              ...page,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "summit-worksheet-evidence.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="homework-evidence" aria-labelledby={headingId}>
      <div className="homework-evidence-heading">
        <div>
          <span className="eyebrow">PIP'S WORKSHEET CHECKS</span>
          <h2 id={headingId}>Found. Named. Fixed.</h2>
        </div>
        {!!page?.worksheets.length && (
          <Button secondary onClick={exportWorksheets}>
            <Icon name="download" size={16} /> Export worksheets
          </Button>
        )}
      </div>
      <p className="homework-evidence-intro">
        Three separate observations from checking Pip's worked examples. These
        stay separate from climb teachings and independent trail answers.
      </p>
      {status === "loading" && (
        <p role="status">Loading completed worksheets…</p>
      )}
      {status === "error" && (
        <div role="status">
          <p>
            Worksheet evidence is unavailable. Your climb journal is still here.
          </p>
          <Button secondary onClick={retry}>
            Try loading worksheets again
          </Button>
        </div>
      )}
      {status === "ready" && !page?.worksheets.length && (
        <p className="homework-evidence-empty">
          No worksheets handed back yet. Find “Fix Pip's homework” inside an
          arithmetic trail to try one.
        </p>
      )}
      {status === "ready" && !!page?.worksheets.length && (
        <>
          {page.total > page.worksheets.length && (
            <p className="homework-evidence-intro">
              Showing the latest {page.worksheets.length} of {page.total}{" "}
              completed worksheets. All counts below refer to this view.
            </p>
          )}
          <div className="homework-facts">
            {homeworkFacts(page.worksheets).map((fact) => (
              <div key={fact.key}>
                <b>
                  {fact.count} / {fact.total}
                </b>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>
          <p className="homework-evidence-intro">
            Pip's steps and four reason choices were visible. Additional help
            was not recorded. Choosing a reason is not the same as explaining it
            independently.
          </p>
          <div className="homework-records">
            {page.worksheets.map((worksheet, index) => {
              const response = worksheet.response;
              const reasonText = response
                ? (worksheet.reasons.find(
                    (reason) => reason.id === response.reason,
                  )?.text ?? response.reason)
                : null;
              return (
                <article
                  className="homework-record"
                  id={`homework-evidence-${worksheet.id}`}
                  tabIndex={-1}
                  key={worksheet.id}
                >
                  <header>
                    <div>
                      <span className="eyebrow">
                        WORKSHEET {page.worksheets.length - index} · LEVEL{" "}
                        {worksheet.level}
                      </span>
                      <h3>{worksheet.skill_name}</h3>
                    </div>
                    <span className="evidence-badge">Worked-example check</span>
                  </header>
                  <div className="homework-outcomes">
                    {homeworkFacts([worksheet]).map((fact) => (
                      <span key={fact.key}>
                        <Icon name={fact.count ? "check" : "help"} size={14} />{" "}
                        {fact.label}: {fact.count ? "yes" : "not yet"}
                      </span>
                    ))}
                  </div>
                  {response ? (
                    <dl className="homework-response">
                      <div>
                        <dt>Card chosen</dt>
                        <dd>
                          {response.spotted_index + 1}:{" "}
                          {
                            worksheet.problems.find(
                              (problem) =>
                                problem.index === response.spotted_index,
                            )?.prompt
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>Reason chosen</dt>
                        <dd>{reasonText}</dd>
                      </div>
                      <div>
                        <dt>Answer entered</dt>
                        <dd>{response.fixed_answer}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="homework-evidence-intro">
                      Earlier record: the checks were saved, but the child's
                      exact selections were not recorded.
                    </p>
                  )}
                  <details>
                    <summary>See the worksheet and checked result</summary>
                    <div className="homework-saved-problems">
                      {worksheet.problems.map((problem) => (
                        <div key={problem.index}>
                          <h4>
                            Card {problem.index + 1}: {problem.prompt}
                          </h4>
                          <ol>
                            {problem.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                          <p>
                            Pip wrote <b>{problem.pip_answer}</b>.{" "}
                            {problem.index === worksheet.result.wrong_index
                              ? "This was the planted slip."
                              : "This card was correct."}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p>
                      <b>Checked result:</b> card{" "}
                      {worksheet.result.wrong_index + 1};{" "}
                      {SLIP_TEXT[worksheet.result.slip]}; correct answer{" "}
                      {worksheet.result.correct_answer}.
                    </p>
                    <p className="homework-evidence-intro">
                      {worksheet.completed_at
                        ? `Handed back ${new Date(worksheet.completed_at).toLocaleString()}.`
                        : "Completion time was not recorded for this earlier worksheet."}
                    </p>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

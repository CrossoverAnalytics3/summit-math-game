import type { Dispatch, SetStateAction } from "react";
import { TutorBrief } from "./TutorBrief";
import { HomeworkEvidence } from "./HomeworkEvidence";
import { useHomeworkEvidence } from "./useHomeworkEvidence";
import { Icon, Button, Owl } from "./ui";
import {
  planLabel,
  confirmInterpretation,
  type Interpretation,
  createEvidenceSummary,
} from "../../shared/expedition";
import type { Journal } from "../../shared/journal";
import type { TeachingPage } from "./teachingTypes";
type Props = {
  storageStatus: string;
  book: Journal;
  setBook: Dispatch<SetStateAction<Journal>>;
  go: (page: TeachingPage) => void;
  download: (book: Journal) => void;
  summary: ReturnType<typeof createEvidenceSummary>;
  onCorrection: (receipt: Interpretation, runId: string) => void;
};
export function TeachingJournal({
  book,
  storageStatus,
  setBook,
  go,
  download,
  summary,
  onCorrection,
}: Props) {
  const homework = useHomeworkEvidence();
  return (
    <div className="teaching-journal">
      <div className="journal-heading">
        <div>
          <span className="eyebrow">THE STORY OF YOUR THINKING</span>
          <h1>
            Every idea leaves
            <br />
            <em>a little trail.</em>
          </h1>
          <p>What happened, what you meant, and what to explore together.</p>
        </div>
        <Button secondary onClick={() => download(book)}>
          <Icon name="download" size={17} /> Export climb journal
        </Button>
      </div>
      <TutorBrief
        runs={book.runs}
        receipts={book.receipts}
        notes={book.notes}
        worksheets={
          homework.status === "ready" ? homework.page?.worksheets : []
        }
        onOpenWorksheet={(id) => {
          const el = document.getElementById(`homework-evidence-${id}`);
          el?.scrollIntoView({ behavior: "auto", block: "start" });
          el?.focus({ preventScroll: true });
        }}
        onOpenRun={(id) => {
          const el = document.getElementById(`evidence-${id}`);
          el?.scrollIntoView({ behavior: "auto", block: "start" });
          el?.focus({ preventScroll: true });
        }}
      />
      <p className="journal-save-state" role="status">
        {storageStatus}
      </p>
      <div className="journal-metrics">
        <article>
          <b>{book.runs.length}</b>
          <span>teachings tried</span>
          <small>Every recorded simulation</small>
        </article>
        <article>
          <b>
            {
              book.runs.filter((r) => r.result.complete && !r.systemIssue)
                .length
            }
          </b>
          <span>fair shares made</span>
          <small>Includes retries and support</small>
        </article>
        <article>
          <b>{book.runs.filter((r) => r.supports.length).length}</b>
          <span>attempts with support</span>
          <small>Picture or coach question opened</small>
        </article>
        <article>
          <b>{book.runs.filter((r) => r.systemIssue).length}</b>
          <span>system issues noted</span>
          <small>Excluded from learner conclusions</small>
        </article>
      </div>
      <div className="journal-principle">
        <Icon name="shield" size={24} />
        <div>
          <h3>A record you can question.</h3>
          <p>
            Actions are observations. Your explanation adds meaning. Suggested
            interpretations can be corrected or withdrawn.
          </p>
        </div>
      </div>
      <HomeworkEvidence {...homework} />
      {!book.runs.length ? (
        <div className="empty-teach-journal">
          <Owl />
          <h2>Your first idea is still ahead.</h2>
          <p>
            Teach Pip something on the climb. The attempt and its result will
            appear here.
          </p>
          <Button onClick={() => go(book.route ? "play" : "routes")}>
            Start the adventure <Icon name="arrow" />
          </Button>
        </div>
      ) : (
        <div className="evidence-list">
          {[...book.runs].reverse().map((r, index) => {
            const receipt = book.receipts.find((i) => i.runIds.at(-1) === r.id);
            const notes = book.notes[r.id] || "";
            return (
              <article
                className={`evidence-entry ${r.systemIssue ? "system-issue" : ""}`}
                id={`evidence-${r.id}`}
                tabIndex={-1}
                key={r.id}
              >
                <div className="evidence-entry-heading">
                  <span className="entry-number">
                    {String(book.runs.length - index).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="eyebrow">
                      {r.route === "ridge" ? "BEACON RIDGE" : "MEADOW CAMP"} ·{" "}
                      {r.stage === "first"
                        ? "FIRST CAMP"
                        : r.stage === "changed"
                          ? "CHANGED SITUATION"
                          : "FRESH CHALLENGE"}
                    </span>
                    <h2>
                      {r.context.total} berries. {r.context.party} friends.
                    </h2>
                  </div>
                  <span
                    className={`evidence-badge ${r.result.complete ? "success" : ""}`}
                  >
                    {r.systemIssue
                      ? "System issue noted"
                      : r.result.complete
                        ? "Fair share"
                        : "An experiment"}
                  </span>
                </div>
                <div className="evidence-columns">
                  <div className="observed-evidence">
                    <span className="evidence-label">
                      <Icon name="check" size={15} /> OBSERVED
                    </span>
                    <p>
                      <strong>Taught:</strong> {planLabel(r.plan)}
                    </p>
                    <p>
                      <strong>Predicted:</strong>{" "}
                      {r.prediction === "not-sure"
                        ? "Not sure yet"
                        : `${r.prediction} each`}
                    </p>
                    <p>
                      <strong>Result:</strong> {r.result.shares.join(", ")}{" "}
                      berries; {r.result.remaining} left.
                    </p>
                    <p>
                      <strong>Picture or coach before this attempt:</strong>{" "}
                      {r.supports.length
                        ? r.supports.join(", ")
                        : "None recorded"}
                    </p>
                    <details>
                      <summary>Show Pip’s actual steps</summary>
                      <ol>
                        {r.result.steps.map((s, i) => (
                          <li key={i}>{s.text}</li>
                        ))}
                      </ol>
                      {!r.result.steps.length && <p>{r.result.message}</p>}
                    </details>
                    {r.systemIssue && (
                      <div className="system-note">
                        This attempt is excluded from learner-performance
                        claims. The original observation remains visible.
                      </div>
                    )}
                  </div>
                  <div className="learner-account">
                    <label className="evidence-label" htmlFor={`note-${r.id}`}>
                      <Icon name="book" size={15} /> WHAT I MEANT
                    </label>
                    <textarea
                      id={`note-${r.id}`}
                      maxLength={500}
                      placeholder="I was trying… / I noticed… / I changed it because…"
                      value={notes}
                      onChange={(e) =>
                        setBook((b) => ({
                          ...b,
                          notes: { ...b.notes, [r.id]: e.target.value },
                        }))
                      }
                    />
                    <small>
                      Your words save to the local journal server. They are not
                      sent to AI.
                    </small>
                  </div>
                </div>
                {receipt && (
                  <div
                    className={`interpretation-card status-${receipt.status}`}
                  >
                    <div>
                      <span className="evidence-label">
                        <Icon name="compass" size={15} />
                        {receipt.status === "insufficient"
                          ? "MORE EVIDENCE NEEDED"
                          : receipt.status === "proposed"
                            ? "POSSIBLE NEXT STEP · AUTHORED"
                            : receipt.status === "confirmed"
                              ? "KEPT FOR EXPLORATION"
                              : receipt.status === "corrected"
                                ? "CONTEXT ADDED"
                                : "WITHDRAWN"}
                      </span>
                      <p>
                        {receipt.status === "insufficient"
                          ? "One attempt is an observation. We need at least two separate, eligible attempts before suggesting an interpretation."
                          : receipt.text}
                      </p>
                      {receipt.correction && (
                        <div className="correction-context">
                          <b>Your correction:</b> {receipt.correction.note}
                        </div>
                      )}
                      {receipt.status !== "insufficient" && (
                        <div
                          className={
                            receipt.nextQuestion.status === "withdrawn"
                              ? "withdrawn-question"
                              : "next-question"
                          }
                        >
                          <span>
                            {receipt.nextQuestion.status === "withdrawn"
                              ? "WITHDRAWN FOLLOW-UP"
                              : "A QUESTION TO EXPLORE"}
                          </span>
                          <p>{receipt.nextQuestion.text}</p>
                          {receipt.nextQuestion.status === "withdrawn" && (
                            <small>
                              This suggestion is no longer used. Start with your
                              added context before choosing the next activity.
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="interpretation-actions">
                      {receipt.status === "proposed" && (
                        <button
                          onClick={() =>
                            setBook((b) => ({
                              ...b,
                              receipts: b.receipts.map((x) =>
                                x.id === receipt.id
                                  ? confirmInterpretation(x)
                                  : x,
                              ),
                            }))
                          }
                        >
                          <Icon name="check" size={16} /> Keep this question
                        </button>
                      )}
                      {["insufficient", "proposed", "confirmed"].includes(
                        receipt.status,
                      ) && (
                        <button
                          onClick={() => {
                            onCorrection(receipt, r.id);
                          }}
                        >
                          <Icon name="compass" size={16} /> Add context or
                          correct this
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <div className="journal-footer-note">
        <Icon name="leaf" size={18} />
        <p>
          {summary.statement} Control tutorials and navigation beacons are
          available throughout; the support count records pictures and coach
          questions. The child and grown-up decide what to explore next.
        </p>
      </div>
    </div>
  );
}

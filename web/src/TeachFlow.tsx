import { Icon, Button, Owl } from "./ui";
import { Berry, Friend, ExpeditionMap } from "./TeachScene";
import {
  planLabel,
  type Route,
  type Context,
  type TeachingPlan,
  type RunRecord,
} from "../../shared/expedition";
import type { Journal, Coach } from "../../shared/journal";
import type { TeachingPage, StepGuide } from "./teachingTypes";
type Props = {
  book: Journal;
  route: Route;
  context: Context;
  guide: StepGuide;
  showTutorial: () => void;
  playing: boolean;
  go: (page: TeachingPage) => void;
  pointTo: (selector: string | null) => void;
  run: RunRecord | null;
  frame: number;
  setPlaying: (value: boolean) => void;
  setFrame: (value: number) => void;
  visibleResult: boolean;
  shownRemaining: number;
  shownShares: number[];
  continueClimb: () => void;
  reviseTeaching: () => void;
  teach: (plan: TeachingPlan) => void;
  confirmTeaching: () => void;
  choosePrediction: (value: string) => void;
  beginRun: () => void;
  ready: boolean;
  picture: boolean;
  showPicture: () => void;
  askCoach: (run: RunRecord) => void;
  coachBusy: boolean;
  activeCoach: Coach | null | undefined;
};
const fractions = [
  { n: 1, d: 2 },
  { n: 1, d: 3 },
  { n: 1, d: 4 },
  { n: 2, d: 6 },
  { n: 3, d: 12 },
  { n: 4, d: 12 },
  { n: 2, d: 3 },
];
function FractionTower({
  plan,
  onChange,
  total,
  disabled = false,
}: {
  plan: TeachingPlan;
  onChange: (p: TeachingPlan) => void;
  total: number;
  disabled?: boolean;
}) {
  const f = plan.kind === "fraction" ? plan : { n: 1, d: 3 };
  const index = fractions.findIndex((a) => a.n === f.n && a.d === f.d);
  function spin(d: number) {
    onChange({
      kind: "fraction",
      ...fractions[
        (Math.max(0, index) + d + fractions.length) % fractions.length
      ],
    });
  }
  return (
    <div className="teaching-tower">
      <div className="tower-glow" />
      <div className="teach-tower-top">
        <Icon name="spark" size={32} />
      </div>
      <div className="teach-ring symbol">
        <button
          aria-label="Previous fraction"
          disabled={disabled}
          onClick={() => spin(-1)}
        >
          <Icon name="back" />
        </button>
        <div>
          <span
            className="fraction-value"
            role="img"
            aria-label={`${f.n} over ${f.d} of the basket`}
          >
            <b>{f.n}</b>
            <i />
            <b>{f.d}</b>
          </span>
          <small>of the whole basket, for each friend</small>
        </div>
        <button
          aria-label="Next fraction"
          disabled={disabled}
          onClick={() => spin(1)}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <div className="teach-ring">
        <span className="ring-label">THE SAME WHOLE</span>
        <div
          role="img"
          aria-label={`${f.n} of ${f.d} equal parts shaded`}
          className="fraction-grid"
          style={{ gridTemplateColumns: `repeat(${f.d},1fr)` }}
        >
          {Array.from({ length: f.d }, (_, i) => (
            <i className={i < f.n ? "filled" : ""} key={i} />
          ))}
        </div>
        <small>
          {f.n} of {f.d} equal parts
        </small>
      </div>
      <div
        className="teach-ring numberline"
        role="img"
        aria-label={`Point at ${f.n} over ${f.d} between zero and one whole basket`}
      >
        <span className="ring-label">THE AMOUNT</span>
        <div>
          <i />
          <b style={{ left: `${(f.n / f.d) * 100}%` }} />
          <span>0</span>
          <span>1 whole basket</span>
        </div>
      </div>
      <div className="tower-pedestal" />
      <p>
        The basket holds {total} berries. Turning the fraction changes what you
        teach Pip to give each friend.
      </p>
    </div>
  );
}

export function TeachFlow({
  book,
  route,
  context,
  guide,
  showTutorial,
  playing,
  go,
  pointTo,
  run,
  frame,
  setPlaying,
  setFrame,
  visibleResult,
  shownRemaining,
  shownShares,
  continueClimb,
  reviseTeaching,
  teach,
  confirmTeaching,
  choosePrediction,
  beginRun,
  ready,
  picture,
  showPicture,
  askCoach,
  coachBusy,
  activeCoach,
}: Props) {
  return (
    <div className="expedition-page">
      <div className="expedition-top">
        <div>
          <span className="eyebrow">
            {book.stage === "first"
              ? "YOUR FIRST TEACHING"
              : book.stage === "changed"
                ? "SOMETHING HAS CHANGED"
                : "A FRESH LITTLE CHALLENGE"}
          </span>
          <h1>
            {book.stage === "first"
              ? "What will you teach Pip?"
              : book.stage === "changed"
                ? route === "ridge"
                  ? "A new basket. The same friends."
                  : "A new friend. The same basket."
                : "Can your idea travel?"}
          </h1>
          <p>
            {book.stage === "first"
              ? "Everyone needs an equal share. Show Pip a way to make it happen."
              : book.stage === "changed"
                ? "Your teaching stays here. Decide whether it needs to change."
                : "A new basket for four friends. Think ahead before Pip tries."}
          </p>
        </div>
        <div className="expedition-help-actions">
          <button
            className="text-link"
            onClick={showTutorial}
            disabled={playing}
          >
            <Icon name="play" size={17} /> Show me how
          </button>
          <button className="text-link" onClick={() => go("journal")}>
            <Icon name="book" size={17} /> My journal
          </button>
        </div>
      </div>
      <section className="teach-step-guide" aria-label="Your next step">
        <Owl small />
        <div className="teach-step-copy">
          <span>STEP {guide.step} OF 4</span>
          <h2>{guide.title}</h2>
          <p>{guide.text}</p>
          <ol aria-label="Teaching steps">
            {["Choose", "Predict", "Try & watch", "Compare"].map(
              (label, index) => (
                <li
                  key={label}
                  aria-current={guide.step === index + 1 ? "step" : undefined}
                  className={index + 1 < guide.step ? "done" : ""}
                >
                  <b>{index + 1}</b>
                  {label}
                </li>
              ),
            )}
          </ol>
        </div>
        {guide.target && (
          <button
            className="button secondary"
            onClick={() =>
              pointTo(
                !book.planConfirmed && !run
                  ? "#teaching-controls"
                  : guide.target,
              )
            }
          >
            {guide.action}
            <Icon name="arrow" size={17} />
          </button>
        )}
      </section>
      <div className="expedition-layout">
        <div className="expedition-work">
          <section
            className="picnic-board"
            aria-label="Pip follows your instruction"
          >
            <div className="board-toolbar">
              <span>
                <Icon
                  name={route === "ridge" ? "mountain" : "leaf"}
                  size={17}
                />
                {route === "ridge" ? "Beacon Ridge" : "Meadow Camp"} <i />{" "}
                {book.stage === "first"
                  ? "First camp"
                  : book.stage === "changed"
                    ? "Upper camp"
                    : "The last clearing"}
              </span>
              <span className="little-pill">
                {context.party} FRIENDS · {context.total} BERRIES
              </span>
            </div>
            <div className={`picnic-scene scene-${route}`}>
              <div className="distant-peaks" />
              <div className="scene-sun" />
              {book.stage !== "first" && (
                <div className="world-change">
                  <Icon name={route === "ridge" ? "spark" : "leaf"} size={15} />
                  {book.stage === "transfer"
                    ? "A new situation for your idea"
                    : route === "ridge"
                      ? "Your beacon is still shining"
                      : "Welcome, Lumi. There’s room for you."}
                </div>
              )}
              <div className="berry-basket">
                <div className="basket-content">
                  {Array.from({ length: shownRemaining }, (_, i) => (
                    <Berry small key={i} />
                  ))}
                </div>
                <span>{shownRemaining} in the basket</span>
              </div>
              <div className="sharing-party">
                {context.companions.map((name, i) => (
                  <div
                    className={`sharing-friend ${run && frame > 0 && run.result.steps[frame - 1]?.personIndex === i ? "receiving" : ""}`}
                    key={name}
                  >
                    <Friend name={name} index={i} />
                    <div className="berry-bowl">
                      {Array.from({ length: shownShares[i] || 0 }, (_, j) => (
                        <Berry small key={j} />
                      ))}
                    </div>
                    <span className="share-count">
                      {shownShares[i] || 0} <small>berries</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="execution-line" aria-live="polite">
              <Icon
                name={visibleResult && run?.result.complete ? "check" : "play"}
                size={18}
              />
              <span>
                {run
                  ? frame
                    ? run.result.steps[frame - 1]?.text || run.result.message
                    : run.result.steps.length
                      ? "Pip is ready to follow your teaching."
                      : run.result.message
                  : "A basket of possibilities. Pip is waiting for your idea."}
              </span>
              {playing ? (
                <button onClick={() => setPlaying(false)}>Pause</button>
              ) : run && frame < run.result.steps.length ? (
                <button
                  className="teach-resume"
                  onClick={() => setPlaying(true)}
                >
                  Resume
                </button>
              ) : null}
              {run && frame < run.result.steps.length && (
                <button
                  onClick={() => {
                    setFrame(run.result.steps.length);
                    setPlaying(false);
                  }}
                >
                  Show result
                </button>
              )}
            </div>{" "}
            {visibleResult && run && (
              <div
                className={`teaching-result ${run.result.complete && !run.systemIssue ? "complete" : ""}`}
                role="status"
              >
                <Icon
                  name={run.result.complete ? "check" : "compass"}
                  size={23}
                />
                <div>
                  <h3>
                    {run.systemIssue
                      ? "Your original replay is saved."
                      : run.result.complete
                        ? "Your teaching made a fair share."
                        : "Something to explore."}
                  </h3>
                  <p>
                    {run.systemIssue
                      ? "You reported an interface misunderstanding. This attempt stays out of learner conclusions. Try the teaching you intended."
                      : run.result.message}
                  </p>
                  <small>
                    {run.prediction === "not-sure"
                      ? "You chose to explore before making a prediction."
                      : `Your prediction: ${run.prediction} each. Compare it with what Pip did.`}
                    {run.supports.length
                      ? " · Support was available for this attempt."
                      : " · No picture or coach question opened before this attempt."}
                  </small>
                </div>
                {run.result.complete && !run.systemIssue && (
                  <Button className="teach-continue" onClick={continueClimb}>
                    {book.stage === "transfer"
                      ? "Reach the summit"
                      : book.stage === "changed"
                        ? "Try a fresh challenge"
                        : "Continue the climb"}
                    <Icon name="arrow" size={17} />
                  </Button>
                )}
                {(!run.result.complete || run.systemIssue) && (
                  <Button
                    className="teach-revise"
                    secondary
                    onClick={reviseTeaching}
                  >
                    {run.systemIssue
                      ? "Try my intended teaching"
                      : "Try another idea"}{" "}
                    <Icon name="refresh" size={17} />
                  </Button>
                )}
              </div>
            )}
          </section>
          <section
            className="teach-instruction"
            id="teaching-controls"
            tabIndex={-1}
          >
            <div className="section-title">
              <div>
                <span className="eyebrow">YOUR TEACHING, MADE VISIBLE</span>
                <h2>“Pip, here’s my idea…”</h2>
              </div>
              <span className="instruction-tag">YOU DECIDE</span>
            </div>
            <div
              className="method-tabs"
              role="group"
              aria-label="Choose a teaching method"
            >
              <button
                aria-pressed={book.plan.kind === "fraction"}
                disabled={playing}
                onClick={() => teach({ kind: "fraction", n: 1, d: 3 })}
              >
                <Icon name="spark" size={18} /> A share of the whole
              </button>
              <button
                aria-pressed={book.plan.kind === "rounds"}
                disabled={playing}
                onClick={() => teach({ kind: "rounds" })}
              >
                <Icon name="refresh" size={18} /> One each, then repeat
              </button>
              <button
                aria-pressed={book.plan.kind === "fixed"}
                disabled={playing}
                onClick={() => teach({ kind: "fixed", amount: 3 })}
              >
                <Icon name="flag" size={18} /> An amount for each
              </button>
            </div>
            {book.plan.kind === "fraction" ? (
              <FractionTower
                plan={book.plan}
                total={context.total}
                onChange={teach}
                disabled={playing}
              />
            ) : book.plan.kind === "rounds" ? (
              <div className="instruction-cards">
                <div>
                  <b>01</b>
                  <Icon name="leaf" />
                  <strong>
                    Give one berry
                    <br />
                    to each friend.
                  </strong>
                </div>
                <span>→</span>
                <div>
                  <b>02</b>
                  <Icon name="refresh" />
                  <strong>
                    Repeat while there’s enough
                    <br />
                    for a whole round.
                  </strong>
                </div>
                <p>
                  Your teaching works one full round at a time. Any berries left
                  after a full round stay in the basket.
                </p>
              </div>
            ) : (
              <div className="fixed-instruction">
                <span>Give</span>
                <div className="amount-picker">
                  <button
                    aria-label="Give one fewer berry"
                    aria-controls="teaching-amount"
                    disabled={book.plan.amount <= 1 || playing}
                    onClick={() =>
                      teach({
                        kind: "fixed",
                        amount: (book.plan as { amount: number }).amount - 1,
                      })
                    }
                  >
                    −
                  </button>
                  <output
                    id="teaching-amount"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {book.plan.amount}
                    <span className="sr-only"> berries for each friend</span>
                  </output>
                  <button
                    aria-label="Give one more berry"
                    aria-controls="teaching-amount"
                    disabled={book.plan.amount >= 6 || playing}
                    onClick={() =>
                      teach({
                        kind: "fixed",
                        amount: (book.plan as { amount: number }).amount + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
                <span>berries to each friend.</span>
                <p>
                  Pip follows this exact amount, in order, while the basket has
                  enough.
                </p>
              </div>
            )}
            <div className="accepted-instruction">
              <Icon name="book" size={18} />
              <div>
                <small>THE INSTRUCTION PIP WILL FOLLOW</small>
                <p aria-live="polite" aria-atomic="true">
                  {planLabel(book.plan)}
                </p>
              </div>
              <Button
                className="teach-confirm"
                secondary={book.planConfirmed}
                disabled={playing}
                onClick={confirmTeaching}
              >
                {book.planConfirmed ? "Teaching chosen" : "Use this teaching"}
                <Icon name="check" size={17} />
              </Button>
            </div>
            <div className="prediction-area">
              <label htmlFor="prediction">
                Before Pip moves, what would a fair share be?
              </label>
              <div>
                <select
                  id="prediction"
                  value={book.prediction}
                  disabled={playing || !book.planConfirmed}
                  onChange={(e) => choosePrediction(e.target.value)}
                >
                  <option value="">Choose your prediction</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "berry" : "berries"} each
                    </option>
                  ))}
                  <option value="not-sure">I’m not sure yet</option>
                </select>
                <Button
                  className="teach-run"
                  onClick={beginRun}
                  disabled={!ready || !book.planConfirmed || playing}
                >
                  Let Pip try this <Icon name="play" size={18} />
                </Button>
              </div>
              <small>
                {book.planConfirmed
                  ? "Pip will follow the instruction you chose. Your prediction is recorded separately."
                  : "First tap Use this teaching above. Then you can make your prediction."}
              </small>
            </div>
          </section>
        </div>
        <aside className="expedition-sidebar">
          <ExpeditionMap route={book.route} stage={book.stage} />
          <section className="pip-teaching-note">
            <Owl />
            <span className="eyebrow">PIP’S LITTLE NOTEBOOK</span>
            <h3>
              “I’ll try what
              <br />
              you teach me.”
            </h3>
            <p>
              You can keep an idea, change it, or try something unexpected. This
              adventure belongs to you.
            </p>
            <div className="teaching-facts">
              <span>
                <Icon name="check" size={15} /> Every friend gets the same
                amount
              </span>
              <span>
                <Icon name="check" size={15} /> All the berries are shared
              </span>
            </div>
          </section>
          <section className="help-card">
            <span className="eyebrow">A LITTLE SUPPORT, IF YOU WANT IT</span>
            <button className="text-link" onClick={showPicture}>
              <Icon name="help" size={17} /> Show an equal-share picture
            </button>
            {picture && (
              <div className="support-picture">
                {Array.from({ length: context.party }, (_, i) => (
                  <div key={i}>
                    {Array.from(
                      { length: context.total / context.party },
                      (_, j) => (
                        <Berry small key={j} />
                      ),
                    )}
                  </div>
                ))}
                {picture && (
                  <small>
                    Picture support is recorded for your next attempt.
                  </small>
                )}
              </div>
            )}
            {run && (
              <button
                className="text-link"
                disabled={coachBusy || playing}
                onClick={() => askCoach(run)}
              >
                <Icon name="spark" size={17} />
                {coachBusy
                  ? "Finding a useful question…"
                  : activeCoach
                    ? "Another question"
                    : "A question about this attempt"}
              </button>
            )}
            {activeCoach && (
              <div className="coach-response">
                <span className="provenance">
                  {activeCoach.source === "ai"
                    ? "AI-SELECTED QUESTION"
                    : "AUTHORED QUESTION"}
                </span>
                <h4>{activeCoach.title}</h4>
                <p>{activeCoach.question}</p>
                <small>{activeCoach.narrative}</small>
              </div>
            )}
          </section>
          <div className="side-note">
            <Icon name="shield" size={17} />
            <p>
              Experiments are welcome. Your notes keep predictions, help, and
              revisions distinct.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

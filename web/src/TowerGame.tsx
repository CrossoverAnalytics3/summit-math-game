import { useEffect, useState } from "react";
import { QuickTutorial } from "./QuickTutorial";
import { ActionBeacon } from "./ActionBeacon";
import "./legacy-guidance.css";
import {
  LEVELS,
  CHECKS,
  equivalent,
  isTowerCorrect,
  getHint,
  summary,
  type Fraction,
  type EvidenceRecord,
} from "./fractions";
import {
  Icon,
  Button,
  Owl,
  FractionText,
  readLocal,
  saveLocal,
  chime,
  speak,
  Modal,
} from "./ui";
type GameState = {
  id: string;
  phase: "tower" | "check" | "done";
  index: number;
  indices: number[];
  attempts: number;
  assisted: boolean;
  feedback: string;
  solved: boolean;
  records: EvidenceRecord[];
  pick: number | null;
  answered: boolean;
};
const fresh = (): GameState => ({
  id: crypto.randomUUID(),
  phase: "tower",
  index: 0,
  indices: [0, 0, 0],
  attempts: 0,
  assisted: false,
  feedback: "",
  solved: false,
  records: [],
  pick: null,
  answered: false,
});
function restore() {
  const s = readLocal<GameState | null>("summit.fraction.active", null);
  return s &&
    ["tower", "check"].includes(s.phase) &&
    Number.isInteger(s.index) &&
    s.index >= 0 &&
    s.index < (s.phase === "tower" ? LEVELS.length : CHECKS.length) &&
    Array.isArray(s.records) &&
    Array.isArray(s.indices) &&
    s.indices.length === 3 &&
    s.indices.every((x) => Number.isInteger(x) && x >= 0 && x < 4)
    ? s
    : fresh();
}
export function AreaModel({
  fraction,
  large = false,
}: {
  fraction: Fraction;
  large?: boolean;
}) {
  return (
    <svg
      className={`area-model ${large ? "large" : ""}`}
      viewBox="0 0 240 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${fraction.n} of ${fraction.d} equal parts shaded`}
    >
      <rect x="0" y="0" width="240" height="40" fill="#163331" />
      <rect
        x="0"
        y="0"
        width={(240 * fraction.n) / fraction.d}
        height="40"
        fill="#c5dbaa"
      />
      {Array.from({ length: fraction.d - 1 }, (_, i) => (
        <path
          key={i}
          d={`M${(240 * (i + 1)) / fraction.d} 0V40`}
          stroke="#28483c"
          strokeWidth="1.5"
        />
      ))}
      <rect
        x=".75"
        y=".75"
        width="238.5"
        height="38.5"
        rx="2"
        fill="none"
        stroke="#a8c998"
        strokeWidth="1.5"
      />
    </svg>
  );
}
export function NumberLine({ fraction }: { fraction: Fraction }) {
  return (
    <svg
      className="number-line"
      viewBox="0 0 230 62"
      role="img"
      aria-label={`Point at ${fraction.n} over ${fraction.d} on a number line from zero to one`}
    >
      <path d="M14 28H216" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: fraction.d + 1 }, (_, i) => (
        <path
          key={i}
          d={`M${14 + (202 * i) / fraction.d} 21v14`}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
      <circle
        cx={14 + (202 * fraction.n) / fraction.d}
        cy="28"
        r="6"
        fill="#e5b694"
        stroke="#fff3d6"
        strokeWidth="2"
      />
      <text x="14" y="56" textAnchor="middle">
        0
      </text>
      <text x="216" y="56" textAnchor="middle">
        1
      </text>
    </svg>
  );
}
export default function TowerGame({
  sound,
  reducedMotion = false,
  onDone,
  onExit,
}: {
  sound: boolean;
  reducedMotion?: boolean;
  onDone: () => void;
  onExit: () => void;
}) {
  const [s, setS] = useState<GameState>(restore),
    [scaffold, setScaffold] = useState(false),
    [split, setSplit] = useState(false),
    [exit, setExit] = useState(false),
    [rules, setRules] = useState(true),
    [explored, setExplored] = useState<boolean[]>([false, false, false]),
    [editedAfterCheck, setEditedAfterCheck] = useState(false);
  const level = LEVELS[Math.min(s.index, LEVELS.length - 1)],
    check = CHECKS[Math.min(s.index, CHECKS.length - 1)];
  const done = s.phase === "done",
    stop =
      s.phase === "tower" ? s.index : s.phase === "check" ? 3 + s.index : 5;
  useEffect(() => {
    if (s.phase === "done") {
      const sessions = readLocal<any[]>("summit.fraction.sessions", []);
      if (!sessions.some((x) => x.id === s.id))
        saveLocal(
          "summit.fraction.sessions",
          [
            ...sessions,
            { id: s.id, date: new Date().toISOString(), records: s.records },
          ].slice(-30),
        );
      try {
        localStorage.removeItem("summit.fraction.active");
      } catch {}
    } else saveLocal("summit.fraction.active", s);
  }, [s]);
  useEffect(() => {
    setExplored([false, false, false]);
    setEditedAfterCheck(false);
  }, [s.id, s.phase, s.index]);
  const spin = (row: number, direction: number) => {
    if (s.solved) return;
    setEditedAfterCheck(true);
    setExplored((visited) =>
      visited.map((value, i) => (i === row ? true : value)),
    );
    setS((p) => ({
      ...p,
      indices: p.indices.map((x, i) =>
        i === row ? (x + direction + 4) % 4 : x,
      ),
    }));
  };
  const askHint = () => {
    setS((p) => ({
      ...p,
      assisted: true,
      feedback:
        p.phase === "tower"
          ? getHint(level, p.indices)
          : "Imagine splitting every equal part into smaller equal pieces. The shaded amount stays the same.",
    }));
    setScaffold(true);
  };
  const submitTower = () => {
    if (s.solved) return;
    setEditedAfterCheck(false);
    const correct = isTowerCorrect(level, s.indices),
      attempts = s.attempts + 1;
    if (correct) {
      chime(sound);
      setS((p) => ({
        ...p,
        attempts,
        solved: true,
        feedback: "You found it! Different pieces, exactly the same amount.",
        records: [
          ...p.records,
          {
            id: level.id,
            kind: "tower",
            correct: true,
            assisted: p.assisted,
            attempts,
          },
        ],
      }));
    } else {
      setS((p) => ({ ...p, attempts, feedback: getHint(level, p.indices) }));
    }
  };
  const nextTower = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setScaffold(false);
    setSplit(false);
    setS((p) => ({
      ...p,
      phase: p.index === LEVELS.length - 1 ? "check" : "tower",
      index: p.index === LEVELS.length - 1 ? 0 : p.index + 1,
      indices: [0, 0, 0],
      attempts: 0,
      assisted: false,
      feedback: "",
      solved: false,
      pick: null,
      answered: false,
    }));
  };
  const submitCheck = () => {
    if (s.pick === null || s.answered) return;
    const correct = s.pick === check.correctIndex;
    if (correct) chime(sound);
    setS((p) => ({
      ...p,
      answered: true,
      feedback: check.explanation,
      records: [
        ...p.records,
        {
          id: check.id,
          kind: "check",
          correct,
          assisted: p.assisted,
          attempts: 1,
        },
      ],
    }));
  };
  const nextCheck = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setScaffold(false);
    setS((p) => ({
      ...p,
      phase: p.index === CHECKS.length - 1 ? "done" : "check",
      index: p.index === CHECKS.length - 1 ? 0 : p.index + 1,
      pick: null,
      answered: false,
      assisted: false,
      feedback: "",
    }));
  };
  const stats = summary(s.records);
  const nextLayer = explored.findIndex((visited) => !visited);
  const offerFeedback =
    s.phase === "tower" &&
    s.attempts > 0 &&
    !s.solved &&
    !editedAfterCheck &&
    !scaffold;
  const guidanceStep =
    s.phase === "check"
      ? s.answered
        ? 2
        : s.pick === null
          ? 0
          : 1
      : s.solved
        ? 2
        : nextLayer === -1
          ? 1
          : 0;
  const beaconTarget = done
    ? null
    : s.phase === "check"
      ? s.answered
        ? ".fraction-next"
        : s.pick === null
          ? ".fraction-check-choices"
          : ".fraction-check-submit"
      : s.solved
        ? ".fraction-next"
        : offerFeedback
          ? ".fraction-hint"
          : nextLayer === -1
            ? ".fraction-light"
            : `[data-fraction-layer="${nextLayer}"]`;
  const beaconMessage =
    s.phase === "check"
      ? s.answered
        ? "Your result is ready. Tap here for the next step."
        : s.pick === null
          ? "Tap the fraction you think matches. You choose the answer."
          : "Ready? Tap here to check your choice."
      : s.solved
        ? "Your beacon is lit! Tap here to keep climbing."
        : offerFeedback
          ? "Pip has a clue. Tap here if you want help, or turn a layer to try again."
          : nextLayer === -1
            ? "Ready to test your three layers? Light the beacon."
            : `Try this arrow to change the ${["fraction", "picture", "number line"][nextLayer]}. Keep turning until you think it matches.`;
  return (
    <div className="game-page fraction-game">
      <div className="game-toolbar">
        <button className="back-button" onClick={() => setExit(true)}>
          <Icon name="back" size={17} />
          Basecamp
        </button>
        <div
          className="trail-progress"
          aria-label={`Stop ${Math.min(stop + 1, 5)} of 5`}
        >
          {["Notice", "Connect", "Discover", "Try it", "Own it"].map(
            (name, i) => (
              <div
                key={name}
                className={`${i < stop ? "complete" : ""} ${i === stop ? "current" : ""}`}
              >
                <span>
                  {i < stop ? <Icon name="check" size={12} /> : i + 1}
                </span>
                <small>{name}</small>
              </div>
            ),
          )}
        </div>
        <button
          className="text-button legacy-help-button"
          aria-label="Show me how to play"
          onClick={() => setRules(true)}
        >
          <Icon name="help" size={17} /> Show me how
        </button>
      </div>
      {done ? (
        <section className="summit-finish">
          <div className="summit-medal">
            <Icon name="mountain" size={70} />
            <span>✧</span>
          </div>
          <div className="eyebrow">LOOK HOW FAR YOU'VE COME</div>
          <h1>
            That's a little more
            <br />
            <em>“I can.”</em>
          </h1>
          <p>
            You connected fractions, pictures, and number lines.
            <br />
            {stats.independentChecks === 2
              ? "And you made two matches on your own."
              : "Every attempt gives you something to build on."}
          </p>
          <div className="finish-stats">
            <div>
              <b>{stats.towers}</b>
              <span>towers connected</span>
            </div>
            <div>
              <b>
                {stats.independentChecks}
                <small> / 2</small>
              </b>
              <span>checks without hints</span>
            </div>
            <div>
              <b>{stats.supported}</b>
              <span>matches with support</span>
            </div>
          </div>
          <div className="tip-box">
            <Owl small />
            <p>
              {stats.independentChecks === 2
                ? "Next time, try explaining why both numbers change while the amount stays the same."
                : "Try splitting the same-size whole into smaller equal parts. Then come back for a fresh climb."}
            </p>
          </div>
          <Button onClick={onDone}>
            Open my field journal <Icon name="arrow" />
          </Button>
          <button
            className="text-button"
            onClick={() => {
              setS(fresh());
              setScaffold(false);
              setRules(true);
            }}
          >
            Explore this trail again
          </button>
          <p className="small muted">
            A snapshot of this session, not a lasting mastery assessment.
          </p>
        </section>
      ) : (
        <>
          <div className="game-heading">
            <div className="eyebrow">
              FRACTION PEAKS <span>/</span>{" "}
              {s.phase === "tower"
                ? "THE SAME-VALUE TOWER"
                : "YOUR OWN LITTLE DISCOVERY"}
            </div>
            <h1>
              {s.phase === "tower"
                ? "One amount. Many ways to see it."
                : "New fraction. Same clever you."}
            </h1>
            <p>
              {s.phase === "tower"
                ? "Turn each layer to match the target. Then light your beacon."
                : "Try a match without the tower. Take all the time you need."}
            </p>
          </div>
          <div className="legacy-action-guide" aria-label="Your next steps">
            <div className="legacy-guide-heading">
              <Icon name="compass" size={18} />
              <strong>
                {s.phase === "check"
                  ? "Your own turn"
                  : "Here is how to light this beacon"}
              </strong>
            </div>
            <ol>
              {(s.phase === "check"
                ? [
                    "Pick the fraction that matches the target.",
                    "Tap ‘This is my match’ to check.",
                    "Read what happened, then keep climbing.",
                  ]
                : [
                    "Use each layer’s arrows. Make all three match the target above.",
                    "Tap ‘Light the beacon’ to test your tower.",
                    "Read Pip’s note. Turn again, or climb to the next beacon.",
                  ]
              ).map((text, index) => (
                <li
                  key={text}
                  className={guidanceStep === index ? "current" : ""}
                  aria-current={guidanceStep === index ? "step" : undefined}
                >
                  <span>{index + 1}</span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
          <div
            className={`game-layout ${s.phase === "check" ? "check-layout" : ""}`}
          >
            <section
              className="puzzle-stage"
              aria-label={
                s.phase === "tower"
                  ? "Fraction tower"
                  : "Fraction session check"
              }
            >
              <div className="stage-top">
                <span className="badge">
                  {s.phase === "tower"
                    ? `BEACON 0${s.index + 1}`
                    : `SESSION CHECK 0${s.index + 1}`}
                </span>
                <button
                  className="icon-button"
                  aria-label="Read challenge aloud"
                  onClick={() =>
                    speak(
                      s.phase === "tower"
                        ? `Make every layer equal to ${level.target.n} over ${level.target.d}. Use the arrows to turn each layer.`
                        : check.prompt,
                    )
                  }
                >
                  <Icon name="sound" size={17} />
                </button>
              </div>
              {s.phase === "tower" ? (
                <>
                  <div className="target-chip">
                    <span>
                      MATCH THIS
                      <br />
                      AMOUNT
                    </span>
                    <FractionText {...level.target} />
                    <AreaModel fraction={level.target} />
                  </div>
                  <div
                    className={`tower-scene ${s.solved ? "illuminated" : ""}`}
                  >
                    <div className="beacon-rays" />
                    <div className="beacon-top">
                      <Icon name={s.solved ? "spark" : "mountain"} size={30} />
                    </div>
                    {level.choices.map((choices, row) => {
                      const value = choices[s.indices[row]],
                        right = equivalent(value, level.target);
                      return (
                        <div
                          key={row}
                          className={`tower-row tier-${row} ${s.solved ? "matched" : ""}`}
                        >
                          <button
                            className="rotate-button"
                            aria-label={`Previous ${["fraction", "picture", "number line"][row]}`}
                            onClick={() => spin(row, -1)}
                            disabled={s.solved}
                          >
                            <Icon name="back" size={18} />
                          </button>
                          <div className="tower-block">
                            <span className="tower-side" />
                            <div
                              key={`${s.index}-${s.indices[row]}`}
                              className="tower-face"
                            >
                              <span className="ring-name">
                                {
                                  [
                                    "THE FRACTION",
                                    "THE PICTURE",
                                    "THE NUMBER LINE",
                                  ][row]
                                }
                              </span>
                              {row === 0 ? (
                                <FractionText {...value} />
                              ) : row === 1 ? (
                                <AreaModel fraction={value} />
                              ) : (
                                <NumberLine fraction={value} />
                              )}
                              <div className="ring-dots">
                                {choices.map((_, i) => (
                                  <i
                                    key={i}
                                    className={
                                      i === s.indices[row] ? "selected" : ""
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            {s.solved && right && (
                              <span className="ring-check">
                                <Icon name="check" size={14} />
                              </span>
                            )}
                          </div>
                          <button
                            className="rotate-button"
                            aria-label={`Next ${["fraction", "picture", "number line"][row]}`}
                            data-fraction-layer={row}
                            onClick={() => spin(row, 1)}
                            disabled={s.solved}
                          >
                            <Icon name="arrow" size={18} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="tower-base" />
                    <div className="tower-shadow" />
                  </div>
                  <div className="stage-action">
                    {s.solved ? (
                      <Button className="fraction-next" onClick={nextTower}>
                        {s.index === 2
                          ? "Try it on your own"
                          : "On to the next beacon"}
                        <Icon name="arrow" />
                      </Button>
                    ) : (
                      <Button className="fraction-light" onClick={submitTower}>
                        Light the beacon <Icon name="spark" size={17} />
                      </Button>
                    )}
                    <span className="small muted">
                      {s.solved
                        ? "Same amount. Beacon lit."
                        : s.attempts
                          ? "Keep exploring. Every turn is a new possibility."
                          : "Tap the arrows · Match all three layers"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="check-stage">
                  <span className="check-instruction">
                    Find a fraction with the same value as
                  </span>
                  <div className="check-target">
                    <FractionText {...check.target} />
                  </div>
                  <div
                    className="answer-options fraction-check-choices"
                    tabIndex={-1}
                    role="group"
                    aria-label="Equivalent fraction choices"
                  >
                    {check.choices.map((f, i) => (
                      <button
                        key={i}
                        aria-pressed={s.pick === i}
                        disabled={s.answered}
                        className={`${s.pick === i ? "chosen" : ""} ${s.answered && i === check.correctIndex ? "correct" : ""} ${s.answered && s.pick === i && i !== check.correctIndex ? "incorrect" : ""}`}
                        onClick={() => setS((p) => ({ ...p, pick: i }))}
                      >
                        <FractionText {...f} />
                        {s.answered && i === check.correctIndex && (
                          <Icon name="check" size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                  {s.answered ? (
                    <Button className="fraction-next" onClick={nextCheck}>
                      {s.index === 1
                        ? "See my discoveries"
                        : "One more little discovery"}
                      <Icon name="arrow" />
                    </Button>
                  ) : (
                    <Button
                      className="fraction-check-submit"
                      onClick={submitCheck}
                      disabled={s.pick === null}
                    >
                      This is my match <Icon name="check" />
                    </Button>
                  )}
                  {!s.answered && (
                    <button className="text-button" onClick={askHint}>
                      I'd like a nudge
                    </button>
                  )}
                  {s.answered && (
                    <p className="check-response">
                      {s.pick === check.correctIndex
                        ? "Same value. Beautiful connection!"
                        : "A useful discovery. Let’s see why this match works."}
                    </p>
                  )}
                </div>
              )}
            </section>
            <aside className="coach-column">
              <div className="coach-card">
                <div className="coach-heading">
                  <div className="owl-avatar">
                    <Owl small />
                  </div>
                  <div>
                    <h3>Pip's trail notes</h3>
                    <span>YOUR THINKING BUDDY</span>
                  </div>
                  <span className="live-dot" />
                </div>
                <div className="coach-text" role="status" aria-live="polite">
                  <span className="quote-mark">“</span>
                  <p>
                    {s.feedback ||
                      (s.phase === "tower"
                        ? s.index === 0
                          ? "A fraction can wear different outfits. Can you find three ways to show the same amount?"
                          : level.subtitle
                        : "This one is all yours. Look for a new way to describe the same amount.")}
                  </p>
                </div>
                {s.phase === "tower" && !s.solved && (
                  <button
                    className="coach-hint fraction-hint"
                    onClick={askHint}
                  >
                    <Icon name="spark" size={17} />
                    Give me a little nudge
                    <Icon name="arrow" size={15} />
                  </button>
                )}
                {s.solved && (
                  <button
                    className="coach-hint"
                    onClick={() => {
                      setScaffold(!scaffold);
                      setSplit(false);
                    }}
                  >
                    <Icon name="leaf" size={17} />
                    Show me why it works
                    <Icon name="arrow" size={15} />
                  </button>
                )}
                <span className="coach-source">
                  {s.phase === "tower"
                    ? "Hints respond to your selected layers."
                    : "Help is always available and recorded."}
                </span>
              </div>
              {scaffold && (
                <div className="visual-support">
                  <div className="eyebrow">SAME WHOLE. SAME AMOUNT.</div>
                  <h3>
                    {s.phase === "tower"
                      ? "Watch the pieces change."
                      : "Start with what you can see."}
                  </h3>
                  <div className="support-whole">
                    <AreaModel
                      large
                      fraction={
                        s.phase === "tower" ? level.target : check.target
                      }
                    />
                    <FractionText
                      {...(s.phase === "tower" ? level.target : check.target)}
                    />
                  </div>
                  {s.phase === "tower" && (
                    <>
                      <div className="support-whole">
                        <AreaModel
                          large
                          fraction={
                            split
                              ? { n: level.target.n * 2, d: level.target.d * 2 }
                              : level.target
                          }
                        />
                        <FractionText
                          {...(split
                            ? { n: level.target.n * 2, d: level.target.d * 2 }
                            : level.target)}
                        />
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setSplit(!split)}
                      >
                        <Icon name="refresh" size={15} />
                        {split
                          ? "Join the pieces again"
                          : "Split each piece in two"}
                      </button>
                      <p className="small muted">
                        The number of pieces changes. The shaded length stays
                        exactly the same.
                      </p>
                    </>
                  )}
                </div>
              )}
              <div className="trail-note">
                <Icon name="leaf" size={20} />
                <div>
                  <h4>
                    {s.phase === "tower"
                      ? "A little space to figure it out."
                      : "Now try without the tower."}
                  </h4>
                  <p>
                    {s.phase === "tower"
                      ? "No timer. No lost hearts. You can turn, think, and try again."
                      : "Your journal keeps independent matches separate from matches with help."}
                  </p>
                </div>
              </div>
              <div className="trail-view">
                <div className="trail-mini-mountain">
                  <Icon name="mountain" size={80} />
                </div>
                <div className="altitude-track">
                  <i style={{ height: `${((stop + 1) / 5) * 100}%` }} />
                </div>
                <div>
                  <span>YOUR EXPEDITION</span>
                  <strong>
                    {stop + 1} <small>of 5 stops</small>
                  </strong>
                  <p>A little higher, every time.</p>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
      {exit && (
        <Modal title="Take a little breather?" onClose={() => setExit(false)}>
          <p className="muted">
            Your fraction climb is saved on this device. Your tower will be here
            when you're ready.
          </p>
          <Button onClick={onExit}>
            Back to basecamp <Icon name="home" />
          </Button>
          <Button secondary onClick={() => setExit(false)}>
            Keep exploring
          </Button>
        </Modal>
      )}
      {rules && (
        <QuickTutorial
          kind="fraction"
          onClose={() => setRules(false)}
          reducedMotion={reducedMotion}
        />
      )}
      <ActionBeacon
        activityKey={`fraction:${s.id}`}
        target={beaconTarget}
        message={beaconMessage}
        enabled={!rules && !exit && !done}
        resetKey={`${s.id}-${s.phase}-${s.index}-${s.indices.join("-")}-${s.pick}-${s.solved}-${s.answered}-${s.attempts}`}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

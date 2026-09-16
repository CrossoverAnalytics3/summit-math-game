import { useEffect, useRef, useState } from "react";
import type { Skill, Problem, Provenance } from "./types";
import { api, Icon, Button, Owl, chime, speak, Modal } from "./ui";
type RoundData = { round_id: string; level: number; problems: Problem[] };
const THEMES = [
  {
    id: "space",
    name: "Among the stars",
    detail: "A cosmic little quest",
    icon: "spark" as const,
  },
  {
    id: "ocean",
    name: "Under the sea",
    detail: "Dive into a discovery",
    icon: "compass" as const,
  },
  {
    id: "dinosaurs",
    name: "Dinosaur valley",
    detail: "A prehistoric adventure",
    icon: "leaf" as const,
  },
  {
    id: "animals",
    name: "Forest friends",
    detail: "A wild little wonder",
    icon: "sun" as const,
  },
];
export default function Arithmetic({
  skill,
  story,
  sound,
  onExit,
  onDone,
}: {
  skill: Skill;
  story: boolean;
  sound: boolean;
  onExit: () => void;
  onDone: () => void;
}) {
  const [data, setData] = useState<RoundData | null>(null),
    [theme, setTheme] = useState("space"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [i, setI] = useState(0),
    [entry, setEntry] = useState(""),
    [result, setResult] = useState<any>(null),
    [hint, setHint] = useState(""),
    [hintUsed, setHintUsed] = useState(false),
    [prov, setProv] = useState<Provenance | null>(null),
    [finished, setFinished] = useState<any>(null),
    [exit, setExit] = useState(false),
    [visual, setVisual] = useState(false);
  const loadRef = useRef<Promise<RoundData> | null>(null),
    lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (story) return;
    let active = true;
    loadRef.current ??= api("/round", { skill_id: skill.id });
    loadRef.current
      .then((r) => {
        if (active) setData(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [skill.id, story]);
  const makeStory = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await api("/story", { skill_id: skill.id, theme });
      setData({ round_id: r.round_id, level: r.level, problems: [r.problem] });
      setProv(r.provenance);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const p = data?.problems[i];
  const askHint = async () => {
    if (!p || lock.current || hintUsed || result) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await api("/hint", { problem_id: p.id });
      setHint(r.hint);
      setHintUsed(true);
      setVisual(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!p || !entry || result || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await api("/answer", {
        problem_id: p.id,
        answer: Number(entry),
      });
      setResult(r);
      if (r.correct) chime(sound);
      else setVisual(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const next = async () => {
    if (!data || lock.current) return;
    if (i === data.problems.length - 1) {
      lock.current = true;
      setBusy(true);
      try {
        setFinished(await api("/round/finish", { round_id: data.round_id }));
        chime(sound);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      setI(i + 1);
      setEntry("");
      setResult(null);
      setHint("");
      setHintUsed(false);
      setVisual(false);
      input.current?.focus();
    }
  };
  return (
    <div className="game-page arithmetic-game">
      <div className="game-toolbar">
        <button
          className="back-button"
          onClick={() => (data && !finished ? setExit(true) : onExit())}
        >
          <Icon name="back" size={17} />
          Basecamp
        </button>
        <span className="badge">
          {story
            ? "STORY EXPEDITION"
            : `GRADE ${skill.grade} · LEVEL ${data?.level || skill.level}`}
        </span>
        <span className="small muted">
          {data
            ? `${Math.min(i + 1, data.problems.length)} / ${data.problems.length} stops`
            : "YOUR WORLD. YOUR STORY."}
        </span>
      </div>
      {finished ? (
        <section className="summit-finish">
          <div className="summit-medal">
            <Icon name="flag" size={60} />
          </div>
          <div className="eyebrow">ANOTHER LITTLE ADVENTURE</div>
          <h1>
            {finished.correct === finished.total
              ? "Look at you go."
              : "A little more practice.\nA little more possibility."}
          </h1>
          <p>
            {skill.name} · {story ? "Story expedition" : "Practice trail"}{" "}
            complete
          </p>
          <div className="finish-stats">
            <div>
              <b>
                {finished.correct}
                <small> / {finished.total}</small>
              </b>
              <span>correct matches</span>
            </div>
            <div>
              <b>{finished.score}</b>
              <span>trail points</span>
            </div>
          </div>
          <div className="tip-box">
            <Owl small />
            <p>
              Try explaining one problem to someone you know. Teaching it is
              another way to explore it.
            </p>
          </div>
          <Button onClick={onDone}>
            See my field journal <Icon name="arrow" />
          </Button>
          <button className="text-button" onClick={onExit}>
            Choose another adventure
          </button>
        </section>
      ) : story && !data ? (
        <section className="story-picker">
          <div className="eyebrow">LET YOUR CURIOSITY CHOOSE</div>
          <h1>Where shall we wander?</h1>
          <p>Pick a world. There's a little math adventure waiting inside.</p>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card theme-${t.id} ${theme === t.id ? "selected" : ""}`}
                aria-pressed={theme === t.id}
                onClick={() => setTheme(t.id)}
              >
                <div className="theme-art">
                  <Icon name={t.icon} size={52} />
                  <span>✧</span>
                </div>
                <h3>{t.name}</h3>
                <p>{t.detail}</p>
                <span className="theme-radio">
                  {theme === t.id && <Icon name="check" size={13} />}
                </span>
              </button>
            ))}
          </div>
          <div className="story-start">
            <Button onClick={() => void makeStory()} disabled={busy}>
              {busy ? "Finding your adventure…" : "Make my adventure"}
              <Icon name="spark" size={18} />
            </Button>
            <span className="small muted">
              {skill.name} · Grade {skill.grade} · Level {skill.level}
            </span>
          </div>
          <div className="story-promise">
            <Icon name="shield" size={16} />
            <span>
              Checked math. Short stories. An offline trail if the connection
              wanders.
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="game-heading">
            <div className="eyebrow">
              {story
                ? THEMES.find((t) => t.id === theme)?.name.toUpperCase()
                : "ONE SMALL STEP AT A TIME"}
            </div>
            <h1>{story ? "A little story. A big discovery." : skill.name}</h1>
            <p>
              {story
                ? "Imagine the world. Find the math inside."
                : "Take a breath, try a strategy, and find your answer."}
            </p>
          </div>
          <div className="game-layout">
            <section
              className={`puzzle-stage arithmetic-stage ${story ? "story-stage" : ""}`}
            >
              <div className="stage-top">
                <span className="badge">
                  {story
                    ? prov?.final_source === "ai"
                      ? "AI STORY · CHECKED"
                      : "OFFLINE STORY"
                    : `STOP ${String(i + 1).padStart(2, "0")}`}
                </span>
                <button
                  className="icon-button"
                  aria-label="Read problem aloud"
                  disabled={!p}
                  onClick={() => p && speak(p.story || p.prompt)}
                >
                  <Icon name="sound" size={17} />
                </button>
              </div>
              {p ? (
                <>
                  <div className="arithmetic-problem">
                    {story ? (
                      <>
                        <div className={`story-scene theme-${theme}`}>
                          <Icon
                            name={
                              THEMES.find((t) => t.id === theme)?.icon || "book"
                            }
                            size={58}
                          />
                          <span>✦</span>
                        </div>
                        <p className="story-text">{p.story}</p>
                        <span className="equation-reminder">
                          {p.prompt} = ?
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="problem-altitude">
                          <Icon name="mountain" size={42} />
                        </div>
                        <h2>
                          {p.prompt}
                          <span> = ?</span>
                        </h2>
                      </>
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit();
                    }}
                  >
                    <label className="sr-only" htmlFor="answer">
                      Your answer
                    </label>
                    <div
                      className={`answer-input ${result ? (result.correct ? "correct" : "incorrect") : ""}`}
                    >
                      <input
                        id="answer"
                        ref={input}
                        inputMode="numeric"
                        autoComplete="off"
                        value={entry}
                        placeholder="Your answer"
                        disabled={!!result || busy}
                        onChange={(e) =>
                          setEntry(
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 5),
                          )
                        }
                      />
                      {result && (
                        <Icon
                          name={result.correct ? "check" : "refresh"}
                          size={24}
                        />
                      )}
                    </div>
                    {!result && (
                      <div className="number-pad" aria-label="Number keypad">
                        {[
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "delete",
                          "0",
                          "enter",
                        ].map((k) => (
                          <button
                            type={k === "enter" ? "submit" : "button"}
                            key={k}
                            disabled={busy || (k === "enter" && !entry)}
                            aria-label={
                              k === "delete"
                                ? "Delete last digit"
                                : k === "enter"
                                  ? "Check answer"
                                  : k
                            }
                            className={
                              k === "enter"
                                ? "pad-enter"
                                : k === "delete"
                                  ? "pad-delete"
                                  : ""
                            }
                            onClick={() => {
                              if (k === "enter") return;
                              setEntry((v) =>
                                k === "delete"
                                  ? v.slice(0, -1)
                                  : v.length < 5
                                    ? v + k
                                    : v,
                              );
                            }}
                          >
                            {k === "delete" ? (
                              "⌫"
                            ) : k === "enter" ? (
                              <Icon name="arrow" />
                            ) : (
                              k
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                  {result && (
                    <div
                      className={`answer-feedback ${result.correct ? "success" : ""}`}
                      role="status"
                    >
                      <h3>
                        {result.correct
                          ? "You found it. Nice thinking!"
                          : "A little discovery to take with you."}
                      </h3>
                      <p>
                        {result.correct
                          ? result.unlocked
                            ? "Your independent practice unlocked the next level."
                            : "That’s another connection made."
                          : `${p.prompt} = ${result.expected_answer}. ${skill.tip}`}
                      </p>
                      <Button onClick={() => void next()} disabled={busy}>
                        {i === data!.problems.length - 1
                          ? "Finish this trail"
                          : "Next little challenge"}
                        <Icon name="arrow" />
                      </Button>
                    </div>
                  )}
                  <div className="arithmetic-dots" aria-label="Round progress">
                    {data!.problems.map((_, n) => (
                      <i
                        key={n}
                        className={
                          n < i ? "complete" : n === i ? "current" : ""
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="loading-panel small-loading">
                  <Icon name="compass" size={35} />
                  <p>Finding your first stepping stone…</p>
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
                    <span>A NUDGE, WHEN YOU NEED ONE</span>
                  </div>
                </div>
                <div className="coach-text" role="status">
                  <span className="quote-mark">“</span>
                  <p>
                    {hint ||
                      "You don’t have to know it straight away. There is always a way to figure it out."}
                  </p>
                </div>
                <button
                  className="coach-hint"
                  onClick={() => void askHint()}
                  disabled={busy || hintUsed || !!result || !p}
                >
                  <Icon name="spark" size={17} />
                  {hintUsed ? "Your nudge is ready" : "Give me a little nudge"}
                  <Icon name="arrow" size={15} />
                </button>
                <span className="coach-source">
                  Hints help you practice. Independent answers grow your level.
                </span>
              </div>
              {visual && p && (
                <div className="visual-support">
                  <div className="eyebrow">MAKE IT VISIBLE</div>
                  <MathVisual p={p} />
                </div>
              )}
              <div className="trail-note">
                <Icon name="leaf" />
                <div>
                  <h4>Your own pace is the right pace.</h4>
                  <p>
                    There’s no countdown. Your next step is ready whenever you
                    are.
                  </p>
                </div>
              </div>
              {prov && (
                <details className="story-provenance">
                  <summary>Grown-up notes about this story</summary>
                  <p>
                    {prov.final_source === "ai"
                      ? `Generated by ${prov.provider}, then checked.`
                      : "An authored offline story is being used."}
                  </p>
                  <ul>
                    {prov.checks.map((c, i) => (
                      <li key={i}>
                        <Icon name={c.passed ? "check" : "refresh"} size={13} />
                        {c.name.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                  <p className="small muted">
                    These checks bound numbers and format; they do not prove the
                    meaning of generated text.
                  </p>
                </details>
              )}
            </aside>
          </div>
        </>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => {
              setError("");
              if (!story && !data) {
                loadRef.current = api("/round", { skill_id: skill.id });
                loadRef.current.then(setData).catch((e) => setError(e.message));
              }
            }}
          >
            Try again
          </button>
        </div>
      )}
      {exit && (
        <Modal title="Head back to basecamp?" onClose={() => setExit(false)}>
          <p className="muted">
            Answers you've already completed stay in your journal. You can begin
            a new practice trail next time.
          </p>
          <Button onClick={onExit}>
            Back to basecamp <Icon name="home" />
          </Button>
          <Button secondary onClick={() => setExit(false)}>
            Keep going
          </Button>
        </Modal>
      )}
    </div>
  );
}
function MathVisual({ p }: { p: Problem }) {
  if (p.op === "mul" && p.a * p.b <= 100)
    return (
      <>
        <div
          className="dot-array"
          role="img"
          aria-label={`${p.a} rows of ${p.b} dots`}
          style={{ gridTemplateColumns: `repeat(${p.b},1fr)` }}
        >
          {Array.from({ length: p.a * p.b }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <p className="small muted">
          Count equal rows. Each row holds the same amount.
        </p>
      </>
    );
  if (p.op === "add" && p.a + p.b <= 25)
    return (
      <>
        <div className="dot-groups">
          <span>
            {Array.from({ length: p.a }, (_, i) => (
              <i key={i} />
            ))}
          </span>
          <b>+</b>
          <span>
            {Array.from({ length: p.b }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </div>
        <p className="small muted">
          Two groups. How many when they come together?
        </p>
      </>
    );
  if (p.op === "place")
    return (
      <>
        <div className="place-columns">
          {String(p.a)
            .padStart(3, "0")
            .split("")
            .map((v, i) => (
              <div
                key={i}
                className={
                  (p.b === 10 && i === 1) || (p.b === 1 && i === 2)
                    ? "highlight"
                    : ""
                }
              >
                <span>{["Hundreds", "Tens", "Ones"][i]}</span>
                <b>{v}</b>
              </div>
            ))}
        </div>
        <p className="small muted">
          Each position tells you how much a digit is worth.
        </p>
      </>
    );
  return (
    <div className="strategy-steps">
      <span>
        01 <b>Notice the numbers.</b>
      </span>
      <span>
        02{" "}
        <b>
          {p.op === "div"
            ? "Think about equal groups."
            : p.op === "sub"
              ? "Count up from the smaller number."
              : "Break each number into tens and ones."}
        </b>
      </span>
      <span>
        03 <b>Check with the opposite operation.</b>
      </span>
    </div>
  );
}

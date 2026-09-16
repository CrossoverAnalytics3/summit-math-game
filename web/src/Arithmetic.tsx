import { useEffect, useRef, useState } from "react";
import type { Skill, Problem, Provenance, ArithmeticRound, ArithmeticAssessment, ArithmeticFinish } from "./types";
import { api, Icon, Button, Owl, chime, speak, Modal, readLocal, saveLocal } from "./ui";
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
  const [data, setData] = useState<ArithmeticRound | null>(null),
    [theme, setTheme] = useState("space"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [i, setI] = useState(0),
    [entry, setEntry] = useState(""),
    [result, setResult] = useState<ArithmeticAssessment | null>(null),
    [hint, setHint] = useState(""),
    [hintUsed, setHintUsed] = useState(false),
    [prov, setProv] = useState<Provenance | null>(null),
    [finished, setFinished] = useState<ArithmeticFinish | null>(null),
    [exit, setExit] = useState(false),
    [visual, setVisual] = useState(false),
    [resumed, setResumed] = useState(false),
    [recoveredAssessment, setRecoveredAssessment] = useState(false),
    [now, setNow] = useState(Date.now());
  const storageKey = `summit.arithmetic.active.${skill.id}`;
  const loadRef = useRef<Promise<ArithmeticRound> | null>(null),
    lock = useRef(false),
    retryRef = useRef<(() => Promise<void>) | null>(null),
    clockAnchor = useRef({ server: Date.now(), local: performance.now() });
  const input = useRef<HTMLInputElement>(null);

  const rememberFinish = (r: ArithmeticFinish) => {
    setFinished(r);
    if (!story) saveLocal(storageKey, null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const finishRound = async (roundId: string, celebrate = true) => {
    rememberFinish(await api("/round/finish", { round_id: roundId }));
    if (celebrate) chime(sound);
  };
  const restoreRound = (r: ArithmeticRound, wasSaved: boolean) => {
    const assessments = r.assessments || [];
    const firstOpen = r.problems.findIndex((p) => !assessments.some((a) => a.problem_id === p.id));
    const last = r.round_ended ? assessments.at(-1) : undefined;
    const index = last
      ? r.problems.findIndex((p) => p.id === last.problem_id)
      : Math.max(0, firstOpen);
    const hadHint = r.hinted_problem_ids?.includes(r.problems[index]?.id) || false;
    setData({ ...r, current_level: r.current_level ?? r.level, run: r.run ?? (wasSaved ? 0 : skill.run) });
    setI(Math.max(0, index));
    setEntry("");
    setResult(last || null);
    setHint("");
    setHintUsed(hadHint);
    setVisual(hadHint || !!last && !last.correct);
    setRecoveredAssessment(!!last);
    setResumed(wasSaved && !r.result);
    setFinished(r.result || null);
    // Only fresh round/snapshot responses synchronize this clock. An answer
    // replay contains its original timestamp and must not rewind the window.
    clockAnchor.current = { server: r.server_now ?? Date.now(), local: performance.now() };
    setNow(clockAnchor.current.server);
    if (!story) saveLocal(storageKey, r.result ? null : { round_id: r.round_id });
  };
  const requestRound = async () => {
    const saved = readLocal<{ round_id?: string } | null>(storageKey, null);
    return saved?.round_id
      ? api(`/round/${encodeURIComponent(saved.round_id)}`)
      : api("/round", { skill_id: skill.id });
  };
  const perform = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    retryRef.current = action;
    try {
      await action();
      retryRef.current = null;
    } catch (e) {
      setError((e as Error).message || "The connection took a little detour. Try again to pick up here.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const recoverRound = async () => {
    const saved = !!readLocal<{ round_id?: string } | null>(storageKey, null)?.round_id;
    const r = await requestRound();
    restoreRound(r, saved);
    if (r.round_ended && !r.result) await finishRound(r.round_id, false);
  };
  const startFresh = () => void perform(async () => {
    const r = await api("/round", { skill_id: skill.id });
    restoreRound(r, false);
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  useEffect(() => {
    if (story) return;
    let active = true;
    const saved = !!readLocal<{ round_id?: string } | null>(storageKey, null)?.round_id;
    lock.current = true;
    setBusy(true);
    loadRef.current ??= requestRound();
    loadRef.current
      .then(async (r) => {
        if (!active) return;
        restoreRound(r, saved);
        if (r.round_ended && !r.result) {
          retryRef.current = () => finishRound(r.round_id, false);
          const complete = await api("/round/finish", { round_id: r.round_id });
          if (active) rememberFinish(complete);
        }
        retryRef.current = null;
      })
      .catch((e) => {
        if (!active) return;
        retryRef.current ??= recoverRound;
        setError(e.message);
      })
      .finally(() => {
        if (active) {
          lock.current = false;
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [skill.id, story]);
  useEffect(() => {
    if (story || !data?.bonus_deadline_at || data.round_ended || finished) return;
    const tick = () => setNow(clockAnchor.current.server + performance.now() - clockAnchor.current.local);
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [story, data?.round_id, data?.bonus_deadline_at, data?.round_ended, finished]);
  useEffect(() => {
    if (data && !busy && !result && !finished && !error) input.current?.focus({ preventScroll: true });
  }, [data?.round_id, i, busy, result, finished, error]);
  const makeStory = async () => {
    await perform(async () => {
      const r = await api("/story", { skill_id: skill.id, theme });
      setData({ round_id: r.round_id, level: r.level, problems: [r.problem] });
      setProv(r.provenance);
    });
  };
  const p = data?.problems[i];
  const askHint = async () => {
    if (!p || lock.current || hint || result || data?.round_ended || error) return;
    await perform(async () => {
      const r = await api("/hint", { problem_id: p.id });
      setHint(r.hint);
      setHintUsed(true);
      setVisual(true);
    });
  };
  const submit = async () => {
    if (!p || !entry || result || lock.current || data?.round_ended || error) return;
    await perform(async () => {
      const r: ArithmeticAssessment = await api("/answer", {
        problem_id: p.id,
        answer: Number(entry),
      });
      setResult(r);
      setData((previous) => previous ? {
        ...previous,
        current_level: r.level,
        run: r.run,
        hearts_remaining: r.hearts_remaining ?? previous.hearts_remaining,
        round_ended: r.round_ended,
        ended_reason: r.ended_reason,
        answered: r.answered ?? i + 1,
        score: r.score ?? (previous.score || 0) + (r.correct ? r.used_hint ? 60 : 100 : 0),
        bonus_points: r.bonus_points ?? 0,
        assessments: [...(previous.assessments || []).filter((a) => a.problem_id !== r.problem_id), r],
      } : previous);
      if (r.correct) chime(sound);
      else setVisual(true);
    });
  };
  const next = async () => {
    if (!data || !result || lock.current || error) return;
    if (data.round_ended || i === data.problems.length - 1) {
      await perform(() => finishRound(data.round_id));
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      setI(i + 1);
      setEntry("");
      setResult(null);
      setHint("");
      setHintUsed(false);
      setVisual(false);
      setRecoveredAssessment(false);
    }
  };
  const hasHearts = !story && data?.hearts_total != null;
  const remaining = data?.bonus_deadline_at ? Math.max(0, Math.ceil((data.bonus_deadline_at - now) / 1000)) : 0;
  const bonusEarned = (data?.bonus_points || 0) > 0;
  const currentLevel = data?.current_level ?? data?.level ?? skill.level;
  const stopped = finished?.ended_reason === "hearts";
  return (
    <div className={`game-page arithmetic-game ${story ? "story-game" : "arithmetic-trail"}`}>
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
            : `GRADE ${skill.grade} · LEVEL ${data?.level ?? skill.level}`}
        </span>
        <span className="small muted">
          {data
            ? `${Math.min(i + 1, data.problems.length)} / ${data.problems.length} stops`
            : "YOUR WORLD. YOUR STORY."}
        </span>
      </div>
      {finished ? (
        <section className={`summit-finish ${stopped ? "trail-rest" : ""}`}>
          <div className="summit-medal">
            <Icon name={stopped ? "leaf" : "flag"} size={60} />
          </div>
          <div className="eyebrow">{stopped ? "A BREATHER AT BASECAMP" : "ANOTHER LITTLE ADVENTURE"}</div>
          <h1>
            {stopped
              ? "A little rest.\nA fresh start."
              : finished.correct === finished.total
              ? "Look at you go."
              : "A little more practice.\nA little more possibility."}
          </h1>
          <p>
            {stopped
              ? `All three hearts have been used in this round. You explored ${finished.answered ?? 0} of ${finished.total} stepping stones.`
              : `${skill.name} · ${story ? "Story expedition" : "Practice trail"} complete`}
          </p>
          <div className="finish-stats">
            <div>
              <b>
                {finished.correct}
                <small> / {finished.answered ?? finished.total}</small>
              </b>
              <span>answers correct</span>
            </div>
            <div>
              <b>{finished.score}</b>
              <span>trail points</span>
            </div>
            {!story && (
              <div>
                <b>{finished.level ?? currentLevel}</b>
                <span>current level</span>
              </div>
            )}
          </div>
          {!story && (
            <div className="trail-keepsakes">
              <span><Icon name="shield" size={16} /> Ending this round does not lower your level.</span>
              {!!finished.bonus_points && <span className="bonus-earned"><Icon name="spark" size={16} /> +{finished.bonus_points} finish bonus included</span>}
            </div>
          )}
          <div className="tip-box">
            <Owl small />
            <p>
              {stopped
                ? "A tricky trail is a reason to try a new way. Your answers are saved. We can start fresh, use a nudge, or choose a different adventure."
                : "Try explaining one problem to someone you know. Teaching it is another way to explore it."}
            </p>
          </div>
          {!story && <Button onClick={startFresh} disabled={busy || !!error}>
            {busy ? "Preparing your stepping stones…" : stopped ? "Try a fresh trail" : "Climb again"} <Icon name="refresh" />
          </Button>}
          <Button onClick={onDone} secondary={!story} disabled={busy}>
            See my field journal <Icon name="arrow" />
          </Button>
          <button className="text-button" onClick={onExit} disabled={busy}>
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
                disabled={busy || !!error}
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
            <Button onClick={() => void makeStory()} disabled={busy || !!error}>
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
            {resumed && <span className="trail-resumed"><Icon name="map" size={13} /> Welcome back. Your stepping stones are saved.</span>}
          </div>
          {hasHearts && data && (
            <section className="trail-dashboard" aria-label="Arithmetic trail status">
              <div className="trail-stat hearts-stat">
                <span className="trail-stat-label">YOUR TRAIL HEARTS</span>
                <div className="trail-hearts" aria-label={`${data.hearts_remaining} of ${data.hearts_total} hearts left`} role="img">
                  {Array.from({ length: data.hearts_total! }, (_, n) => <Icon key={n} name="heart" size={23} className={n < (data.hearts_remaining ?? 0) ? "heart-full" : "heart-resting"} />)}
                </div>
                <small>{data.hearts_remaining === 0 ? "Time for a fresh trail" : "A new try after three misses"}</small>
              </div>
              <div className="trail-stat">
                <span className="trail-stat-label">POINTS COLLECTED</span>
                <strong><Icon name="spark" size={18} /> {data.score || 0}</strong>
                <small>{bonusEarned ? "Includes your +50 bonus" : "Each answer can add more"}</small>
              </div>
              <div className="trail-stat">
                <span className="trail-stat-label">LEVEL STREAK</span>
                <strong>{data.run ?? skill.run}<span> / 3</span></strong>
                <small>Independent answers in a row</small>
              </div>
              <div className={`trail-stat bonus-stat ${bonusEarned ? "is-earned" : remaining === 0 ? "is-open-pace" : ""}`}>
                <div className="bonus-stat-heading">
                  <span className="trail-stat-label">{bonusEarned ? "BONUS COLLECTED" : "A LITTLE EXTRA"}</span>
                  {!data.round_ended && remaining > 0 && <span className="bonus-clock" aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds in the bonus window`}><Icon name="clock" size={13} /><span>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span></span>}
                </div>
                <div className="bonus-message" role="status">
                  {bonusEarned ? "+50 points. You made the whole trail!" : data.round_ended ? "Your earned points stay with you." : remaining > 0 ? `Finish all ${data.problems.length} for +50 points.` : "Keep going—your points are safe."}
                </div>
                {!data.round_ended && remaining > 0 ? <>
                  <div className="bonus-track" aria-hidden="true"><span style={{ width: `${Math.min(100, remaining / (data.bonus_seconds || 120) * 100)}%` }} /></div>
                  <small>The bonus clock never stops your play.</small>
                </> : <small>{bonusEarned ? "Thoughtful practice counts, too." : "No points are taken away."}</small>}
              </div>
            </section>
          )}
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
                  {!recoveredAssessment && <form
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
                        disabled={!!result || busy || !!error || data?.round_ended}
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
                            disabled={busy || !!error || data?.round_ended || (k === "enter" && !entry)}
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
                  </form>}
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
                      {hasHearts && !result.correct && <p className="heart-feedback">
                        <Icon name="heart" size={14} />
                        {data?.ended_reason === "hearts" ? "This round is at its resting spot. Your level stays where it is." : `One heart used. ${data?.hearts_remaining} ${data?.hearts_remaining === 1 ? "heart is" : "hearts are"} ready for the next step.`}
                      </p>}
                      {recoveredAssessment && <p className="small muted">This answer was already checked. Your result is saved.</p>}
                      <Button onClick={() => void next()} disabled={busy || !!error}>
                        {busy ? "Saving your trail…" : data?.ended_reason === "hearts" ? "Rest at basecamp" : data?.round_ended || i === data!.problems.length - 1
                          ? "Finish this trail"
                          : "Next little challenge"}
                        <Icon name="arrow" />
                      </Button>
                    </div>
                  )}
                  <div className="arithmetic-dots" role="img" aria-label={`${data?.answered ?? i} of ${data!.problems.length} stepping stones answered`}>
                    {data!.problems.map((_, n) => (
                      <i
                        key={n}
                        className={
                          n < (data?.answered ?? i) ? "complete" : n === i ? "current" : ""
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
                  disabled={busy || !!error || !!hint || !!result || !p || data?.round_ended}
                >
                  <Icon name="spark" size={17} />
                  {hint ? "Your nudge is ready" : hintUsed ? "Show my saved nudge" : "Give me a little nudge"}
                  <Icon name="arrow" size={15} />
                </button>
                <span className="coach-source">
                  {hasHearts ? "Hints keep every heart. Independent answers grow your level." : "Hints help you practice. Independent answers grow your level."}
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
                  <h4>{hasHearts ? "Every point is a little foothold." : "Your own pace is the right pace."}</h4>
                  <p>
                    {hasHearts ? "100 points for a correct independent answer; 60 with a nudge. The two-minute window adds a finish bonus. It never takes your points away." : "There’s no countdown. Your next step is ready whenever you are."}
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
          <span>{error} {data && "Try again to pick up at this same step."}</span>
          <div className="trail-error-actions">
            <button className="text-button" disabled={busy} onClick={() => {
              if (retryRef.current) void perform(retryRef.current);
            }}>{busy ? "Reconnecting…" : "Try again"}</button>
            {!story && data && !finished && <button className="text-button" disabled={busy} onClick={() => void perform(async () => {
              const r = await api(`/round/${encodeURIComponent(data.round_id)}`);
              restoreRound(r, true);
              if (r.round_ended && !r.result) await finishRound(r.round_id, false);
            })}>Check saved progress</button>}
            {!story && !data && <button className="text-button" disabled={busy} onClick={startFresh}>Start a fresh trail</button>}
          </div>
        </div>
      )}
      {exit && (
        <Modal title="Head back to basecamp?" onClose={() => setExit(false)}>
          <p className="muted">
            {story
              ? "Answers you've already completed stay in your journal. You can choose a new story next time."
              : "Your answers and remaining hearts are saved. Choose this trail again to pick up here. The bonus window keeps running while you are away; your earned points stay safe."}
          </p>
          <Button onClick={onExit} disabled={busy}>
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

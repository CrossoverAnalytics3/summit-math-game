import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Skill } from "./types";
import { api, Icon, Button, Owl, chime, readLocal, saveLocal } from "./ui";
import "./homework.css";

// The server validates rules independently; only supported picker values are restored here.
export type KidRules = { hearts: 1 | 3; timer: boolean; difficulty: "easier" | "same" | "harder"; avoid_digit: number | null };
export const DEFAULT_RULES: KidRules = { hearts: 3, timer: true, difficulty: "same", avoid_digit: null };
export const rulesKey = (skillId: string) => `summit.rules.${skillId}`;
export function loadRules(skillId: string): KidRules {
  const saved = readLocal<unknown>(rulesKey(skillId), null);
  const r = saved && typeof saved === "object" && !Array.isArray(saved) ? saved as Record<string, unknown> : {};
  return {
    hearts: r.hearts === 1 ? 1 : 3,
    timer: typeof r.timer === "boolean" ? r.timer : DEFAULT_RULES.timer,
    difficulty: r.difficulty === "easier" || r.difficulty === "harder" ? r.difficulty : "same",
    avoid_digit: r.avoid_digit === 5 || r.avoid_digit === 7 || r.avoid_digit === 9 ? r.avoid_digit : null,
  };
}

// Keep the component identity stable so selecting a rule preserves keyboard focus.
function RuleChip({ on, label, click }: { on: boolean; label: string; click: () => void }) {
  return <button type="button" className={"rule-chip" + (on ? " on" : "")} aria-pressed={on} onClick={click}>{label}</button>;
}

export function RulesPicker({ skill, onChange }: { skill: Skill; onChange?: (r: KidRules) => void }) {
  const [r, setR] = useState<KidRules>(() => loadRules(skill.id));
  useEffect(() => setR(loadRules(skill.id)), [skill.id]);
  const set = (patch: Partial<KidRules>) => { const next = { ...r, ...patch }; setR(next); saveLocal(rulesKey(skill.id), next); onChange?.(next); };
  return (
    <div className="rules-picker" role="group" aria-label="Your rules for this trail">
      <span className="eyebrow">Your rules</span>
      <p className="small muted">The math is the math. How you climb it is up to you.</p>
      <div className="rule-row" role="group" aria-label="Hearts"><span>Hearts</span>
        <RuleChip on={r.hearts === 3} label="three" click={() => set({ hearts: 3 })} />
        <RuleChip on={r.hearts === 1} label="just one" click={() => set({ hearts: 1 })} />
      </div>
      <div className="rule-row" role="group" aria-label="Bonus clock"><span>Bonus clock</span>
        <RuleChip on={r.timer} label="on" click={() => set({ timer: true })} />
        <RuleChip on={!r.timer} label="off" click={() => set({ timer: false })} />
      </div>
      <div className="rule-row" role="group" aria-label="Number difficulty"><span>Numbers</span>
        <RuleChip on={r.difficulty === "easier"} label="a bit easier" click={() => set({ difficulty: "easier" })} />
        <RuleChip on={r.difficulty === "same"} label="my level" click={() => set({ difficulty: "same" })} />
        <RuleChip on={r.difficulty === "harder"} label="a bit harder" click={() => set({ difficulty: "harder" })} />
      </div>
      <div className="rule-row" role="group" aria-label="Digits to leave out"><span>Leave out</span>
        <RuleChip on={r.avoid_digit === null} label="none" click={() => set({ avoid_digit: null })} />
        {[5, 7, 9].map((d) => <RuleChip key={d} on={r.avoid_digit === d} label={`${d}s`} click={() => set({ avoid_digit: d })} />)}
      </div>
      {r.difficulty === "easier" && <p className="small muted">Easier problems are practice. Your level only moves at your level or above.</p>}
    </div>
  );
}

type Worked = { index: number; prompt: string; a: number; b: number; op: string; steps: string[]; pip_answer: number };
type Set = { id: string; skill_id: string; level: number; problems: Worked[]; reasons: { id: string; text: string }[] };
type Result = { spotted: boolean; explained: boolean; fixed: boolean; all: boolean; slip: string; correct_answer: number; wrong_index: number; level: number; wrong_prompt: string };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The page could not be saved. Please try again.";

export function Homework({ skill, sound, onExit, onDone }: { skill: Skill; sound: boolean; onExit: () => void; onDone: () => void }) {
  const [set, setSet] = useState<Set | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [fix, setFix] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryPending, setRetryPending] = useState(false);
  const request = useRef(0);
  const submitting = useRef(false);
  const cards = useRef(new Map<number, HTMLButtonElement>());
  const resultPanel = useRef<HTMLDivElement>(null);

  const fresh = useCallback(async () => {
    const requestId = ++request.current;
    submitting.current = false;
    setBusy(true); setError(""); setRetryPending(false); setSet(null); setSpot(null); setReason(null); setFix(""); setResult(null);
    try {
      const page: Set = await api("/homework", { skill_id: skill.id });
      if (request.current === requestId) setSet(page);
    } catch (e) { if (request.current === requestId) setError(errorMessage(e)); }
    finally { if (request.current === requestId) setBusy(false); }
  }, [skill.id]);
  useEffect(() => {
    void fresh();
    return () => { request.current += 1; };
  }, [fresh]);
  useEffect(() => { if (result) resultPanel.current?.focus(); }, [result]);

  const submit = async () => {
    if (!set || spot === null || !reason || fix === "" || busy || result || submitting.current) return;
    const requestId = ++request.current;
    submitting.current = true;
    setBusy(true); setError("");
    try {
      const r: Result = await api(`/homework/${set.id}/answer`, { spotted_index: spot, reason, fixed_answer: Number(fix) });
      if (request.current === requestId) { setRetryPending(false); setResult(r); chime(sound && r.all); }
    } catch (e) {
      if (request.current === requestId) { setRetryPending(true); setError(errorMessage(e)); }
    }
    finally {
      submitting.current = false;
      if (request.current === requestId) setBusy(false);
    }
  };

  const chooseProblem = (index: number) => {
    if (busy || retryPending || result || index === spot) return;
    setSpot(index); setReason(null); setFix(""); setError("");
  };
  const moveCard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!set || busy || retryPending || result) return;
    const position = set.problems.findIndex((problem) => problem.index === index);
    const last = set.problems.length - 1;
    let next = position;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (position + 1) % set.problems.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (position + last) % set.problems.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    const selected = set.problems[next].index;
    chooseProblem(selected);
    cards.current.get(selected)?.focus();
  };
  const step = spot === null ? 1 : !reason ? 2 : !result ? 3 : 4;
  const chosenProblem = set?.problems.find((p) => p.index === spot);
  const actualReason = result && set?.reasons.find((r) => r.id === result.slip)?.text;

  return (
    <section className="homework" aria-busy={busy}>
      <div className="homework-head">
        <div>
          <span className="badge mint">PIP'S WORKSHEET · LEVEL {set?.level ?? skill.level}</span>
          <h2>Help Pip check this math page.</h2>
          <p className="muted">Three problems. One slip. Read Pip's steps, find what went wrong, and teach Pip the fix.</p>
        </div>
        <button type="button" className="text-button" onClick={onExit} disabled={busy}>Back to camp</button>
      </div>

      {error && <div className="homework-error" role="alert">
        <p>{error}{set && " Your original choices are kept for a safe retry."}</p>
        <button type="button" className="text-button" disabled={busy} onClick={() => void (set ? submit() : fresh())}>{set ? "Try handing it back again" : "Try loading the page again"}</button>
      </div>}
      {!set && !error && <p className="muted" role="status">Pip is getting the page out…</p>}

      {set && (
        <>
          <ol className="homework-guide" aria-label="How to check Pip's worksheet">
            <li aria-current={step === 1 ? "step" : undefined}><strong>1 · Find</strong><span>Choose the problem with a slip.</span></li>
            <li aria-current={step === 2 ? "step" : undefined}><strong>2 · Explain</strong><span>Choose what went wrong.</span></li>
            <li aria-current={step === 3 ? "step" : undefined}><strong>3 · Fix</strong><span>Write the answer and hand it back.</span></li>
          </ol>
          {!result && <p className="small muted homework-step" role="status">{retryPending ? "Your choices are kept. Use the retry button above to finish handing this page back." : step === 1 ? "Start here: tap a problem to check it. With a keyboard, use the arrow keys to choose." : step === 2 ? "Next: choose a reason below the problems." : "Now: type your fix below. You can change your choices before sending."}</p>}
          <div className="worksheet" role="radiogroup" aria-label="Which problem has the slip?">
            {set.problems.map((p, position) => {
              const chosen = spot === p.index;
              const revealed = result && p.index === result.wrong_index;
              return (
                <button key={p.index} type="button" role="radio" aria-checked={chosen} disabled={!!result || busy || retryPending}
                  tabIndex={chosen || (spot === null && position === 0) ? 0 : -1}
                  ref={(element) => { if (element) cards.current.set(p.index, element); else cards.current.delete(p.index); }}
                  className={"worked" + (chosen ? " chosen" : "") + (revealed ? (result!.spotted ? " right" : " missed") : "")}
                  onKeyDown={(event) => moveCard(event, p.index)}
                  onClick={() => chooseProblem(p.index)}>
                  <span className="worked-prompt">{p.prompt}</span>
                  <ol className="worked-steps">{p.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  <span className="worked-answer">Pip wrote <strong>{p.pip_answer}</strong></span>
                  {revealed && <span className="worked-tag">{result!.spotted ? "You found it" : "This was the one"}</span>}
                </button>
              );
            })}
          </div>

          {step >= 2 && !result && (
            <div className="homework-panel">
              <span className="eyebrow" id="homework-reason">2 · What went wrong?</span>
              <div className="reason-chips" role="group" aria-labelledby="homework-reason">
                {set.reasons.map((r) => (
                  <button key={r.id} type="button" disabled={busy || retryPending} className={"rule-chip" + (reason === r.id ? " on" : "")} aria-pressed={reason === r.id} onClick={() => { setReason(r.id); setError(""); }}>{r.text}</button>
                ))}
              </div>
            </div>
          )}

          {step >= 3 && !result && chosenProblem && (
            <form className="homework-panel" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              <label className="eyebrow" htmlFor="homework-fix">3 · Fix it for Pip</label>
              <p className="muted" id="homework-fix-prompt">{chosenProblem.prompt} should be</p>
              <div className="fix-row">
                <input id="homework-fix" className="fix-input" inputMode="numeric" pattern="[0-9]*" value={fix} disabled={busy || retryPending} aria-label="Corrected answer" aria-describedby="homework-fix-prompt" autoComplete="off"
                  onChange={(e) => { setFix(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }} />
                <Button type="submit" disabled={busy || retryPending || fix === ""}>{busy ? "Handing it back…" : "Hand it back to Pip"} <Icon name="arrow" /></Button>
              </div>
            </form>
          )}

          {result && (
            <div className="homework-panel result" ref={resultPanel} tabIndex={-1} aria-label="Pip's worksheet results">
              <div className="tip-box"><Owl small /><p>
                {result.all ? "That's the one, that's why, and that's the fix. Pip says thanks."
                  : result.spotted && result.fixed ? `Right problem, right fix. Here's the reason: ${actualReason ?? "check Pip's steps"}.`
                  : result.spotted ? `Right problem. The fix is ${result.correct_answer}. ${actualReason ?? "Let's check Pip's steps"}.`
                  : `The slip was in ${result.wrong_prompt}. The reason: ${actualReason ?? "check Pip's steps"}. The right answer is ${result.correct_answer}.`}
              </p></div>
              <ul className="result-marks">
                <li className={result.spotted ? "yes" : "no"}>Found the slip · {result.spotted ? "yes" : "not this time"}</li>
                <li className={result.explained ? "yes" : "no"}>Named the reason · {result.explained ? "yes" : "not this time"}</li>
                <li className={result.fixed ? "yes" : "no"}>Fixed the answer · {result.fixed ? "yes" : "not this time"}</li>
              </ul>
              <p className="small muted">Recorded as worksheet practice, with finding, explaining, and fixing kept separate in the teaching journal. Trail levels are earned with independent answers.</p>
              <div className="homework-actions">
                <Button onClick={() => void fresh()} disabled={busy}>Another page <Icon name="refresh" /></Button>
                <Button secondary onClick={onDone}>See teaching journal <Icon name="arrow" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

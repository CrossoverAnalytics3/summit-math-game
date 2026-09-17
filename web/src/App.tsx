import { useEffect, useRef, useState } from "react";
import LegacyApp from "./LegacyApp";
import { Icon, Button, Modal, Owl } from "./ui";
import { Party, RouteArt } from "./TeachScene";
import {
  contextFor,
  createRun,
  createEvidenceSummary,
  createInterpretation,
  reconcileInterpretations,
  correctInterpretation,
  invalidateDependentQuestions,
  selectCurrentRun,
  type Route,
  type TeachingPlan,
  type RunRecord,
  type Interpretation,
} from "../../shared/expedition";
import "./teach.css";
import { TeachHome } from "./TeachHome";
import { TeachFlow } from "./TeachFlow";
import { TeachingJournal } from "./TeachingJournal";
import { useTeachingJournal } from "./useTeachingJournal";
import type { Journal, Coach } from "../../shared/journal";
import type { TeachingPage } from "./teachingTypes";
import { QuickTutorial, type TutorialKind } from "./QuickTutorial";
import { ActionBeacon } from "./ActionBeacon";

type Page = TeachingPage;
function uid() {
  return crypto.randomUUID();
}
function download(book: Journal) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          product: "Summit Teach the Climb",
          exportedAt: new Date().toISOString(),
          ...book,
          statement:
            "Local expedition observations, not validated mastery or a learning-style profile.",
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "summit-teaching-journal.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const {
    book,
    setBook,
    syncStatus,
    retrySync,
    loadServerCopy,
    recoveryAvailable,
    downloadRecovery,
    localStorageFailed,
  } = useTeachingJournal();
  const [page, setPage] = useState<Page>("home");
  const [tutorial, setTutorial] = useState<TutorialKind | null>(null);
  const introducedRoutes = useRef(new Set<Route>());
  const [modal, setModal] = useState<"grownups" | "settings" | "new" | null>(
      null,
    ),
    [toast, setToast] = useState("");
  const [frame, setFrame] = useState(
      () =>
        book.runs.find((r) => r.id === book.currentRunId)?.result.steps
          .length ?? 0,
    ),
    [playing, setPlaying] = useState(false),
    [picture, setPicture] = useState(() => book.supports.includes("picture"));
  const [coachBusy, setCoachBusy] = useState(false),
    [health, setHealth] = useState<any>(null),
    [aiBusy, setAiBusy] = useState(false);
  const [correctionRunId, setCorrectionRunId] = useState<string | null>(null);
  const [correction, setCorrection] = useState<Interpretation | null>(null),
    [correctionKind, setCorrectionKind] = useState<"context" | "system">(
      "context",
    ),
    [correctionNote, setCorrectionNote] = useState("");
  const [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [contrast, setContrast] = useState(false);
  const coachSeq = useRef(0),
    coachAbort = useRef<AbortController | null>(null);
  const route = book.route || "ridge",
    context = contextFor(route, book.stage);
  const summary = createEvidenceSummary(book.runs);
  const run = selectCurrentRun(
    book.runs,
    book.currentRunId,
    book.route,
    book.stage,
  );
  const visibleResult = !!run && !playing && frame >= run.result.steps.length;
  const ready = !!book.prediction;
  const guide = playing
    ? {
        step: 3,
        title: "Watch Pip follow your teaching",
        text: "Look at each bowl as Pip shares. You can pause whenever you like.",
        target: null,
        action: "Watching together",
      }
    : run && !visibleResult
      ? {
          step: 3,
          title: "Ready to watch the rest?",
          text: "Pip is paused. Tap Resume to keep watching your idea.",
          target: ".teach-resume",
          action: "Find Resume",
        }
      : visibleResult && run?.systemIssue
        ? {
            step: 4,
            title: "Let’s try your intended teaching again",
            text: "You reported that the interface misunderstood. Your earlier replay is saved; choose the instruction you meant to use.",
            target: ".teach-revise",
            action: "Choose my intended teaching",
          }
        : visibleResult && run?.result.complete
          ? {
              step: 4,
              title: "Compare the bowls. Then keep climbing!",
              text: "Everyone has the same amount and the basket is empty. Your teaching worked here.",
              target: ".teach-continue",
              action: "Find the next step",
            }
          : visibleResult
            ? {
                step: 4,
                title: "What could you change?",
                text: "Pip followed your teaching. Look at the bowls, then try another idea. Experiments are welcome.",
                target: ".teach-revise",
                action: "Find Try another idea",
              }
            : !book.planConfirmed
              ? {
                  step: 1,
                  title:
                    book.stage === "first"
                      ? "First, choose your teaching"
                      : "Keep your teaching, or change it",
                  text: "Pick a card below. Set your fraction or amount, then tap Use this teaching.",
                  target: ".teach-confirm",
                  action: "Choose my teaching",
                }
              : !ready
                ? {
                    step: 2,
                    title: "What do you think a fair share would be?",
                    text: "Pick how many berries each friend should get. You can choose I’m not sure yet.",
                    target: "#prediction",
                    action: "Find my prediction",
                  }
                : {
                    step: 3,
                    title: "Your idea is ready. Let Pip try it!",
                    text: "Tap Let Pip try this and watch what your instruction does.",
                    target: ".teach-run",
                    action: "Find Let Pip try this",
                  };
  function pointTo(selector: string | null) {
    if (!selector) return;
    const element = document.querySelector<HTMLElement>(selector);
    element?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "center",
    });
    element?.focus({ preventScroll: true });
  }
  function showTutorial() {
    cancelCoach();
    setTutorial(route === "ridge" ? "teaching-ridge" : "teaching-meadow");
  }
  function closeTutorial() {
    introducedRoutes.current.add(route);
    setTutorial(null);
    requestAnimationFrame(() =>
      pointTo(run ? guide.target : "#teaching-controls"),
    );
  }
  function confirmTeaching() {
    setBook((b) => ({ ...b, planConfirmed: true }));
    requestAnimationFrame(() => pointTo("#prediction"));
  }
  function reviseTeaching() {
    teach(book.plan);
    requestAnimationFrame(() => pointTo("#teaching-controls"));
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [page, book.stage]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);
  useEffect(() => {
    if (!playing || !run) return;
    if (reduced) {
      setFrame(run.result.steps.length);
      setPlaying(false);
      return;
    }
    const t = setInterval(
      () =>
        setFrame((f) => {
          if (f >= run.result.steps.length) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        }),
      480,
    );
    return () => clearInterval(t);
  }, [playing, run, reduced]);
  useEffect(
    () => () => {
      coachAbort.current?.abort();
    },
    [],
  );
  function cancelCoach() {
    coachSeq.current++;
    coachAbort.current?.abort();
    coachAbort.current = null;
    setCoachBusy(false);
  }
  function go(p: Page) {
    cancelCoach();
    setPlaying(false);
    if (run) setFrame(run.result.steps.length);
    if (
      p === "play" &&
      book.route &&
      !introducedRoutes.current.has(book.route)
    ) {
      setTutorial(
        book.route === "ridge" ? "teaching-ridge" : "teaching-meadow",
      );
    }
    setPage(p);
  }
  function chooseRoute(r: Route) {
    cancelCoach();
    setBook((b) => ({
      ...b,
      route: r,
      expeditionId: uid(),
      lastPlayedAt: new Date().toISOString(),
      stage: "first",
      plan:
        r === "ridge" ? { kind: "fraction", n: 1, d: 2 } : { kind: "rounds" },
      prediction: "",
      planConfirmed: false,
      supports: [],
      currentRunId: null,
      completed: false,
    }));
    setFrame(0);
    setPicture(false);
    setPlaying(false);
    setPage("play");
    setTutorial(r === "ridge" ? "teaching-ridge" : "teaching-meadow");
  }
  function newExpedition() {
    cancelCoach();
    setBook((b) => ({
      ...b,
      route: null,
      expeditionId: uid(),
      stage: "first",
      plan: { kind: "rounds" },
      prediction: "",
      planConfirmed: false,
      supports: [],
      currentRunId: null,
      completed: false,
    }));
    setPicture(false);
    setFrame(0);
    setPlaying(false);
    setModal(null);
    setPage("routes");
  }
  function teach(plan: TeachingPlan) {
    cancelCoach();
    setBook((b) => ({
      ...b,
      plan,
      planConfirmed: false,
      prediction: "",
      currentRunId: null,
    }));
    setFrame(0);
    setPlaying(false);
  }
  function choosePrediction(value: string) {
    cancelCoach();
    setBook((b) => ({ ...b, prediction: value, currentRunId: null }));
    setFrame(0);
    setPlaying(false);
  }
  function beginRun() {
    if (book.runs.length >= 200) {
      setToast(
        "This demo journal has 200 attempts. Export it to keep exploring with a grown-up.",
      );
      return;
    }
    if (!ready || !book.planConfirmed || playing || tutorial) return;
    cancelCoach();
    const r = createRun({
      id: uid(),
      route,
      stage: book.stage,
      plan: book.plan,
      prediction: book.prediction,
      supports: book.supports,
    });
    const previous = [...book.runs]
      .reverse()
      .find((item) => item.route === route && !item.systemIssue);
    const receipt = createInterpretation({
      id: uid(),
      runs: [...book.runs, r],
      runIds: previous ? [previous.id, r.id] : [r.id],
      text: r.result.complete
        ? "This teaching may be worth trying with a different basket or group."
        : "A closer look at this instruction may help explain the result.",
      nextQuestion: r.result.complete
        ? "What would you predict if the basket or the group changed?"
        : "Which part of your instruction would you try changing, and why?",
    });
    setBook((b) => ({
      ...b,
      currentRunId: r.id,
      runs: [...b.runs, r],
      lastPlayedAt: r.date,
      receipts: [...b.receipts, receipt],
    }));
    setFrame(0);
    setPlaying(r.result.steps.length > 0);
    document.querySelector(".picnic-board")?.scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "start",
    });
  }
  function continueClimb() {
    if (!run?.result.complete || run.systemIssue) return;
    cancelCoach();
    if (book.stage === "transfer") {
      setBook((b) => ({ ...b, completed: true }));
      go("summit");
      return;
    }
    setBook((b) => ({
      ...b,
      stage: b.stage === "first" ? "changed" : "transfer",
      prediction: "",
      planConfirmed: false,
      supports: [],
      currentRunId: null,
    }));
    setFrame(0);
    setPicture(false);
    setPlaying(false);
  }
  function showPicture() {
    setPicture(true);
    setBook((b) => ({
      ...b,
      supports: Array.from(new Set([...b.supports, "picture"])),
    }));
  }
  async function askCoach(r: RunRecord) {
    if (
      r.systemIssue ||
      book.receipts.some(
        (i) =>
          i.runIds.includes(r.id) &&
          ["corrected", "withdrawn"].includes(i.status),
      )
    ) {
      setToast(
        "Your correction comes first. Try a new teaching before asking for a new follow-up.",
      );
      return;
    }
    cancelCoach();
    const seq = ++coachSeq.current,
      controller = new AbortController();
    coachAbort.current = controller;
    setCoachBusy(true);
    const saveCoach = (c: Coach) => {
      if (seq !== coachSeq.current) return;
      setBook((b) => {
        if (
          b.currentRunId !== r.id ||
          b.route !== r.route ||
          b.stage !== r.stage ||
          b.runs.find((item) => item.id === r.id)?.systemIssue ||
          b.receipts.some(
            (i) =>
              i.runIds.includes(r.id) &&
              ["corrected", "withdrawn"].includes(i.status),
          )
        )
          return b;
        return {
          ...b,
          supports: Array.from(new Set([...b.supports, "coach"])),
          coaches: { ...b.coaches, [r.id]: c },
        };
      });
    };
    try {
      const response = await fetch("/api/teaching/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: r.route,
          stage: r.stage,
          plan: r.plan,
          prediction: r.prediction,
          supports: r.supports,
          evidenceId: r.id,
          variation: seq % 3,
        }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(10000),
        ]),
      });
      if (!response.ok) throw Error();
      const c: Coach = await response.json();
      if (
        !["ai", "authored"].includes(c.source) ||
        typeof c.title !== "string" ||
        typeof c.question !== "string" ||
        typeof c.narrative !== "string" ||
        !Array.isArray(c.evidenceIds) ||
        !c.evidenceIds.includes(r.id)
      )
        throw Error();
      saveCoach(c);
    } catch {
      saveCoach({
        source: "authored",
        title: "A moment to wonder",
        question: r.result.complete
          ? "What could you change while keeping a fair share?"
          : "Is this what you meant Pip to do? Which instruction could you change?",
        narrative:
          "Your expedition is still here. Take a moment to try another idea.",
        evidenceIds: [r.id],
        generation: { question: "authored", narrative: "authored" },
      });
    } finally {
      if (seq === coachSeq.current) {
        setCoachBusy(false);
        coachAbort.current = null;
      }
    }
  }
  function applyCorrection() {
    if (!correction || !correctionNote.trim()) return;
    cancelCoach();
    setBook((b) => {
      const currentReceipt = b.receipts.find((i) => i.id === correction.id);
      if (!currentReceipt) return b;
      const changed = correctInterpretation(
        currentReceipt,
        {
          kind: correctionKind,
          note: correctionNote.trim().slice(0, 500),
          ...(correctionRunId ? { runId: correctionRunId } : {}),
        },
        b.runs,
      );
      const receipts = reconcileInterpretations(
        invalidateDependentQuestions(
          b.receipts.map((i) =>
            i.id === correction.id ? changed.interpretation : i,
          ),
          correction.id,
        ),
        changed.runs,
      );
      const affectedRunIds = new Set(
        receipts
          .filter((i) => ["corrected", "withdrawn"].includes(i.status))
          .flatMap((i) => i.runIds),
      );
      return {
        ...b,
        runs: changed.runs,
        receipts,
        completed:
          b.completed &&
          !changed.runs.some((r) => r.id === b.currentRunId && r.systemIssue),
        coaches: Object.fromEntries(
          Object.entries(b.coaches).filter(
            ([id, c]) =>
              !affectedRunIds.has(id) &&
              !c.evidenceIds.some((key) => affectedRunIds.has(key)),
          ),
        ),
      };
    });
    setCorrection(null);
    setCorrectionNote("");
    setToast("Context saved. The dependent follow-up was withdrawn.");
  }
  async function toggleAI() {
    setAiBusy(true);
    try {
      const response = await fetch("/api/settings/ai-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !health?.guardian_consent_ai }),
      });
      if (!response.ok) throw Error();
      const h = await response.json();
      setHealth({ ...health, ...h });
      setToast(
        h.guardian_consent_ai
          ? "Optional AI selection is allowed. A configured server key is still required."
          : "Authored questions are selected.",
      );
    } catch {
      setToast(
        "The setting could not be saved. Authored play is still available.",
      );
    } finally {
      setAiBusy(false);
    }
  }
  const shownShares = run
    ? run.result.shares.map((_, i) =>
        run.result.steps
          .slice(0, frame)
          .filter((s) => s.personIndex === i)
          .reduce((n, s) => n + s.amount, 0),
      )
    : Array(context.party).fill(0);
  const shownRemaining = run
    ? frame
      ? (run.result.steps[Math.min(frame, run.result.steps.length) - 1]
          ?.after ?? context.total)
      : context.total
    : context.total;
  const activeCoach = run ? book.coaches[run.id] : null;
  if (syncStatus === "loading")
    return (
      <div className="teach-app">
        <main className="page-intro" role="status">
          <Owl />
          <p>Opening your saved expedition…</p>
        </main>
      </div>
    );
  if (page === "legacy")
    return (
      <>
        <div className="legacy-return">
          <button onClick={() => go("home")}>
            <Icon name="back" size={16} /> Back to Teach the Climb
          </button>
          <span>Original practice trails · separate practice records</span>
        </div>
        <LegacyApp onOpenTeachingJournal={() => go("journal")} />
      </>
    );
  return (
    <div
      className={`teach-app ${reduced ? "reduce-motion" : ""} ${contrast ? "high-contrast" : ""}`}
    >
      <a className="skip-link" href="#teach-main">
        Skip to adventure
      </a>
      <header className="teach-header">
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="Summit home"
        >
          <span className="brand-icon">
            <Icon name="mountain" size={28} />
          </span>
          summit<span className="brand-period">.</span>
        </button>
        <span className="teach-edition">TEACH THE CLIMB</span>
        <nav aria-label="Main navigation">
          <button
            className={
              page === "home" || page === "routes" || page === "play"
                ? "active"
                : ""
            }
            onClick={() => go("home")}
          >
            <Icon name="compass" size={17} />
            <span>Adventure</span>
          </button>
          <button
            className={page === "journal" ? "active" : ""}
            onClick={() => go("journal")}
          >
            <Icon name="book" size={17} />
            <span>Teaching journal</span>
            {book.runs.length > 0 && <i>{book.runs.length}</i>}
          </button>
        </nav>
        <button className="teach-grownups" onClick={() => setModal("grownups")}>
          For grown-ups <Icon name="arrow" size={14} />
        </button>
        <button
          className="icon-button"
          aria-label="Comfort settings"
          onClick={() => setModal("settings")}
        >
          <Icon name="settings" size={19} />
        </button>
      </header>
      {recoveryAvailable && (
        <div className="teach-warning" role="status">
          An older device journal could not be read. Its original contents have
          been kept for recovery.{" "}
          <button onClick={downloadRecovery}>Download recovery copy</button>
        </div>
      )}
      {localStorageFailed && (
        <div className="teach-warning" role="status">
          This browser could not save a device copy. Keep the page open until
          the server saves, or export the journal.
        </div>
      )}
      {syncStatus !== "saved" && (
        <div className="teach-warning">
          {syncStatus === "saving"
            ? "Saving your expedition…"
            : syncStatus === "conflict"
              ? "Another window has newer saved evidence. Keep a copy of this journal before opening it."
              : localStorageFailed
                ? "The server copy could not be updated. Export your journal before leaving."
                : "Your expedition is saved on this device. The server copy could not be updated."}
          {(syncStatus === "offline" || syncStatus === "conflict") && (
            <button onClick={retrySync}>Try saving again</button>
          )}
          {syncStatus === "conflict" && (
            <button
              onClick={() => {
                download(book);
                cancelCoach();
                setPlaying(false);
                setTutorial(null);
                setPicture(false);
                setPage("journal");
                loadServerCopy();
              }}
            >
              Save my copy & open server journal
            </button>
          )}
        </div>
      )}
      <main id="teach-main" tabIndex={-1}>
        {page === "home" && (
          <TeachHome
            book={book}
            go={go}
            setModal={setModal}
            onWarmUp={() => {
              setBook((b) => ({
                ...b,
                returnDismissedAt: new Date().toISOString(),
              }));
              go("play");
              showTutorial();
            }}
            onResume={() => {
              setBook((b) => ({
                ...b,
                returnDismissedAt: new Date().toISOString(),
              }));
              go("play");
            }}
          />
        )}
        {page === "routes" && (
          <div className="route-page">
            <div className="page-intro">
              <span className="eyebrow">CHAPTER 01 · THE SUMMIT PICNIC</span>
              <h1>
                Same summit.
                <br />
                <em>Your way there.</em>
              </h1>
              <p>
                Twelve berries. Three friends. A picnic at the top.
                <br />
                Choose a route, then teach Pip how to share the basket fairly.
              </p>
            </div>
            <div className="route-grid">
              {(["ridge", "meadow"] as Route[]).map((r) => (
                <article className="route-card" key={r}>
                  <RouteArt route={r} />
                  <div className="route-copy">
                    <span className="eyebrow">
                      {r === "ridge"
                        ? "01 / A BEACON TO REPAIR"
                        : "02 / A FRIEND TO WELCOME"}
                    </span>
                    <h2>{r === "ridge" ? "Beacon Ridge" : "Meadow Camp"}</h2>
                    <p>
                      {r === "ridge"
                        ? "Turn the tower and teach Pip a share of the whole. Your beacon opens a high path."
                        : "Teach Pip how to pass the berries around. At the next camp, another friend joins you."}
                    </p>
                    <div className="route-consequence">
                      <Icon name={r === "ridge" ? "spark" : "leaf"} size={18} />
                      <span>
                        {r === "ridge"
                          ? "Next: a smaller basket, the same three friends."
                          : "Next: the same basket, four friends to share it."}
                      </span>
                    </div>
                    <Button onClick={() => chooseRoute(r)}>
                      Take {r === "ridge" ? "Beacon Ridge" : "Meadow Camp"}{" "}
                      <Icon name="arrow" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="route-note">
              <Icon name="compass" size={20} />
              <p>
                Both paths can work. You can try the other on another
                expedition. Your journal keeps the story of each attempt.
              </p>
            </div>
          </div>
        )}
        {page === "play" && (
          <TeachFlow
            {...{
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
            }}
          />
        )}
        {page === "summit" && (
          <div className="summit-page">
            <div className="summit-celebration">
              <img
                src="/art/summit-island.png"
                alt="The expedition has reached the summit of the alpine island"
              />
              <div />
              <section>
                <span className="eyebrow">THE SUMMIT PICNIC · COMPLETE</span>
                <Icon name="flag" size={40} />
                <h1>
                  You taught a way.
                  <br />
                  <em>They made it here.</em>
                </h1>
                <p>
                  {route === "ridge"
                    ? "Your beacon lights the ridge. Your teaching worked with a different basket."
                    : "Lumi joined the picnic. You explored sharing with a different group."}
                </p>
                <Party names={contextFor(route, "transfer").companions} />
                <Button onClick={() => go("journal")}>
                  See the story of our thinking <Icon name="book" size={18} />
                </Button>
              </section>
            </div>
            <div className="summit-reflection">
              <span className="eyebrow">
                SOMETHING TO WONDER ABOUT TOGETHER
              </span>
              <h2>What would you teach differently next time?</h2>
              <p>
                A different path. Another idea. The same mountain, seen in a new
                way.
              </p>
              <Button secondary onClick={() => setModal("new")}>
                Explore another route <Icon name="compass" size={18} />
              </Button>
            </div>
          </div>
        )}
        {page === "journal" && (
          <TeachingJournal
            storageStatus={
              syncStatus === "saved"
                ? "Saved to this journal server"
                : syncStatus === "saving"
                  ? "Saving to this journal server…"
                  : "Server save needs attention"
            }
            {...{ book, setBook, go, download, summary }}
            onCorrection={(receipt, id) => {
              setCorrection(receipt);
              setCorrectionRunId(id);
              setCorrectionKind("context");
              setCorrectionNote("");
            }}
          />
        )}
      </main>
      <footer className="teach-footer">
        <span>
          <Icon name="mountain" size={17} /> Your pace. Your path. Your
          mountain.
        </span>
        <button onClick={() => setModal("grownups")}>
          How the evidence works <Icon name="arrow" size={14} />
        </button>
      </footer>
      <ActionBeacon
        activityKey={`teaching:${book.expeditionId || "restored-expedition"}`}
        target={guide.target}
        message={guide.text}
        enabled={
          page === "play" &&
          !tutorial &&
          !modal &&
          !correction &&
          !playing &&
          !coachBusy
        }
        resetKey={`${page}:${route}:${book.stage}:${book.plan.kind}:${JSON.stringify(book.plan)}:${book.planConfirmed}:${book.prediction}:${book.currentRunId}:${guide.step}`}
        reducedMotion={reduced}
      />
      {tutorial && (
        <QuickTutorial
          kind={tutorial}
          onClose={closeTutorial}
          reducedMotion={reduced}
        />
      )}
      {toast && (
        <div className="teach-toast" role="status">
          {toast}
        </div>
      )}
      {modal === "new" && (
        <Modal
          title="Another path, another possibility."
          onClose={() => setModal(null)}
        >
          <p>
            Your past teachings will stay in the journal. A new expedition
            starts at basecamp.
          </p>
          <div className="modal-actions">
            <Button onClick={newExpedition}>
              Choose a new route <Icon name="arrow" />
            </Button>
          </div>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          title="Make a little room for you."
          onClose={() => setModal(null)}
        >
          <div className="teach-settings">
            <label>
              <span>
                Reduce motion
                <small>Show Pip’s results without the animated replay.</small>
              </span>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
            </label>
            <label>
              <span>
                Stronger contrast
                <small>Brighter labels and clearer boundaries.</small>
              </span>
              <input
                type="checkbox"
                checked={contrast}
                onChange={(e) => setContrast(e.target.checked)}
              />
            </label>
          </div>
        </Modal>
      )}
      {modal === "grownups" && (
        <Modal
          title="A window into their thinking."
          onClose={() => setModal(null)}
        >
          <div className="grownup-explanation">
            <p>
              Children teach Pip a way to share, predict a fair outcome, and
              watch their instruction run. Changing a basket or a group gives
              them something new to investigate.
            </p>
            <h3>Evidence you can inspect and correct.</h3>
            <p>
              The journal separates recorded actions, support, the child’s
              words, and a tentative next step. Correcting a suggestion
              withdraws its follow-up. A system misunderstanding is kept
              separate from a learner mistake.
            </p>
            <h3>Small observations, useful questions.</h3>
            <p>
              These are session records, not a diagnosis, a learning-style
              profile, or proof of lasting mastery. Ask what the child meant
              before deciding what their choice reveals. New examples and
              conversations help you check understanding.
            </p>
            <h3>Optional AI, bounded choices.</h3>
            <p>
              AI can select a context-appropriate question from reviewed
              options. The game controls the quantities, rules, actions, and
              evidence. Authored questions keep the adventure working without a
              model. The source label shows what happened.
            </p>
            <div className="ai-setting">
              <span>
                <b>
                  {health?.guardian_consent_ai
                    ? "AI selection allowed"
                    : "Authored questions selected"}
                </b>
                <small>
                  {health?.configured_ai === "anthropic"
                    ? "A provider is configured on this server."
                    : "No live provider is currently confirmed."}{" "}
                  Only structured teaching context is sent to AI. Notes and
                  corrections stay with the local journal server.
                </small>
              </span>
              <Button secondary disabled={aiBusy || !health} onClick={toggleAI}>
                {aiBusy
                  ? "Saving…"
                  : health?.guardian_consent_ai
                    ? "Use authored only"
                    : "Allow optional AI"}
              </Button>
            </div>
            <h3>Local prototype.</h3>
            <p>
              This expedition saves to this local server, with a browser copy
              for offline use. Other browsers connected to the same server can
              open its saved journal. Export it to keep a separate copy.
              Original practice records remain separate. This prototype has no
              child accounts or protected multiuser access.
            </p>
          </div>
        </Modal>
      )}
      {correction && (
        <Modal
          title="Help the record tell the right story."
          onClose={() => setCorrection(null)}
        >
          <p>
            The observation stays visible. Your context will correct the
            interpretation and withdraw its dependent question.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyCorrection();
            }}
          >
            <label className="field-label" htmlFor="correction-kind">
              What needs correcting?
            </label>
            <select
              id="correction-kind"
              value={correctionKind}
              onChange={(e) =>
                setCorrectionKind(e.target.value as "context" | "system")
              }
            >
              <option value="context">
                The suggestion missed my intention
              </option>
              <option value="system">
                Pip or the interface misunderstood my instruction
              </option>
            </select>
            <label className="field-label" htmlFor="correction-note">
              What should we know?
            </label>
            <textarea
              id="correction-note"
              value={correctionNote}
              maxLength={500}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="I was trying something on purpose…"
              required
            />
            <small>
              This context saves to the local journal server and is not sent to
              AI. System issues are excluded from learner-performance claims.
            </small>
            <div className="modal-actions">
              <Button type="submit" disabled={!correctionNote.trim()}>
                Save context & withdraw follow-up{" "}
                <Icon name="check" size={17} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

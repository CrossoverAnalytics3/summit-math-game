import { useEffect, useState } from "react";
import type { Home, Provenance } from "./types";
import { api, Icon, Button, FractionText, readLocal, Modal } from "./ui";
import { summary, type EvidenceRecord } from "./fractions";

type FractionSession = { id: string; date: string; records: EvidenceRecord[] };
type ParentReport = {
  facts: {
    by_skill: {
      skill_id: string;
      name: string;
      attempts: number;
      correct: number;
      hints: number;
    }[];
    levels: { skill_id: string; name: string; level: number }[];
    rounds: number;
    homework?: { pages: number; spotted: number; explained: number; fixed: number };
  };
  note: string;
  provenance: Provenance;
};

function storedSessions(): FractionSession[] {
  const value = readLocal<unknown>("summit.fraction.sessions", []);
  if (!Array.isArray(value)) return [];
  return value
    .filter((session): session is FractionSession =>
      Boolean(
        session &&
          typeof session === "object" &&
          typeof session.id === "string" &&
          typeof session.date === "string" &&
          Array.isArray(session.records),
      ),
    )
    .map((session) => ({
      ...session,
      records: session.records.filter((record) =>
        Boolean(
          record &&
            typeof record.id === "string" &&
            (record.kind === "tower" || record.kind === "check") &&
            typeof record.correct === "boolean" &&
            typeof record.assisted === "boolean" &&
            Number.isSafeInteger(record.attempts) &&
            record.attempts > 0,
        ),
      ),
    }));
}

function sessionDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Your latest climb"
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Reports({
  home,
  onPlay,
  grownup = false,
}: {
  home: Home;
  onPlay: () => void;
  grownup?: boolean;
}) {
  const [sessions] = useState(storedSessions);
  const latest = sessions.at(-1);
  const evidence = latest ? summary(latest.records) : null;
  const [parent, setParent] = useState<ParentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(Boolean(home.guardian_consent_ai));
  useEffect(() => {
    setConsent(Boolean(home.guardian_consent_ai));
  }, [home.guardian_consent_ai]);
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentMessage, setConsentMessage] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [exportText, setExportText] = useState("");

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setParent(null);
    api("/parent")
      .then((data: ParentReport) => {
        if (current) setParent(data);
      })
      .catch((reason: unknown) => {
        if (current)
          setError(
            reason instanceof Error
              ? reason.message
              : "The practice log is unavailable right now.",
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [requestVersion]);

  async function changeConsent() {
    setSavingConsent(true);
    setConsentMessage("");
    try {
      const saved: { guardian_consent_ai: boolean } = await api(
        "/settings/ai-consent",
        { enabled: !consent },
      );
      setConsent(saved.guardian_consent_ai);
      setConsentMessage(
        saved.guardian_consent_ai
          ? "AI is now enabled for this demo profile."
          : "AI is now off for this demo profile.",
      );
      setRequestVersion((value) => value + 1);
    } catch (reason) {
      setConsentMessage(
        reason instanceof Error
          ? reason.message
          : "That setting could not be saved. Try again.",
      );
    } finally {
      setSavingConsent(false);
    }
  }

  function downloadEvidence() {
    const output = {
      schema_version: "summit-evidence-v1",
      exported_at: new Date().toISOString(),
      profile: "local-demo-profile",
      scope:
        "Completed browser-local fraction sessions and the current seven-day arithmetic log. Session checks do not establish lasting mastery.",
      fraction_sessions: sessions,
      arithmetic_week: parent?.facts ?? null,
      guidance_provenance: parent?.provenance ?? null,
    };
    setExportText(JSON.stringify(output, null, 2));
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(output, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `summit-field-journal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="report-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">YOUR FIELD JOURNAL</p>
          <h1>Every little climb counts.</h1>
          <p className="muted">
            {grownup
              ? "A clear view of what was practiced, where help was used, and what happened on a session check."
              : "Look back at what you tried. Discover what to explore next."}
          </p>
        </div>
        <span className="badge">
          <Icon name="leaf" size={15} /> Local demo profile
        </span>
      </header>

      <div className="report-grid">
        <article className="panel evidence-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">FRACTION EXPEDITION</p>
              <h2>Your latest climb</h2>
            </div>
            {latest && (
              <span className="badge">{sessionDate(latest.date)}</span>
            )}
          </div>
          {evidence ? (
            <>
              <p className="muted">
                A snapshot of one completed session. Practice and session checks
                tell different parts of the story.
              </p>
              <FractionEvidence evidence={evidence} />
              <p className="evidence-note">
                <Icon name="book" size={18} /> These are first-try results
                without hints in this session. Replaying uses the same
                questions; these counts do not establish retention or lasting
                mastery.
              </p>
            </>
          ) : (
            <div className="report-empty">
              <div className="empty-icon">
                <Icon name="mountain" size={40} />
              </div>
              <h3>Your trail starts with a try.</h3>
              <p className="muted">
                Complete a fraction climb to see your practice and session
                checks here. There are no results to report yet.
              </p>
              <Button onClick={onPlay}>
                Start fraction climb <Icon name="arrow" size={18} />
              </Button>
            </div>
          )}
        </article>

        <article className="panel report-next">
          <span className="badge">
            <Icon name="compass" size={15} /> Try it together
          </span>
          <h2>
            Same amount.
            <br />A new way to see it.
          </h2>
          <div
            className="report-fraction-example"
            aria-label="One half equals two quarters"
          >
            <FractionText n={1} d={2} />
            <span aria-hidden="true">=</span>
            <FractionText n={2} d={4} />
          </div>
          <p>
            Fold a piece of paper in half. Then fold it again. Ask, “How many
            small pieces make the same amount as one half?”
          </p>
          <p className="muted">
            Let the learner point, draw, or explain. A helpful conversation is
            part of learning.
          </p>
          <Button secondary onClick={onPlay}>
            Explore the mountain <Icon name="arrow" size={17} />
          </Button>
        </article>

        <article className="panel arithmetic-report">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ARITHMETIC PRACTICE</p>
              <h2>Along the other trails</h2>
            </div>
            <span className="badge">Past 7 days</span>
          </div>
          <p className="muted">
            These are the arithmetic game’s logged answers, shown separately
            from the fraction expedition.
          </p>
          {loading && (
            <p className="muted" role="status">
              Opening the practice log…
            </p>
          )}
          {error && (
            <div className="evidence-note" role="alert">
              <p>{error}</p>
              <Button
                secondary
                onClick={() => setRequestVersion((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          )}
          {parent && !loading && (
            <>
              {parent.facts.by_skill.length ? (
                <div className="table-scroll">
                  <table className="evidence-table">
                    <caption className="sr-only">
                      Arithmetic answers recorded in the past seven days
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Trail</th>
                        <th scope="col">Correct / attempts</th>
                        <th scope="col">With a hint</th>
                        <th scope="col">Game level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parent.facts.by_skill.map((skill) => (
                        <tr key={skill.skill_id}>
                          <th scope="row">{skill.name}</th>
                          <td>
                            {skill.correct} / {skill.attempts}
                          </td>
                          <td>{skill.hints}</td>
                          <td>
                            {parent.facts.levels.find(
                              (level) => level.skill_id === skill.skill_id,
                            )?.level ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="evidence-note">
                  No arithmetic answers are recorded for this week yet. The
                  mountain is ready when you are.
                </p>
              )}
              <p className="muted report-caption">
                {parent.facts.rounds} completed arithmetic{" "}
                {parent.facts.rounds === 1 ? "round" : "rounds"}.
                {parent.facts.homework && parent.facts.homework.pages > 0 && (
                  <>
                    {" "}Checked {parent.facts.homework.pages} of Pip's worksheet{parent.facts.homework.pages === 1 ? "" : "s"}: found the slip {parent.facts.homework.spotted}, named the reason {parent.facts.homework.explained}, fixed the answer {parent.facts.homework.fixed}.
                  </>
                )} Game levels
                reflect progression rules; they are not a measurement of
                mastery.
              </p>
            </>
          )}
        </article>

        <article className="panel report-guidance">
          <p className="eyebrow">A SMALL NEXT STEP</p>
          <h2>Keep the conversation going.</h2>
          {parent && !loading ? (
            <>
              <span className="badge">
                <Icon name="shield" size={15} />{" "}
                {parent.provenance.final_source === "ai"
                  ? "Checked AI note"
                  : "Offline guidance"}
              </span>
              <p className="guidance-copy">{parent.note}</p>
              <p className="muted">
                This note offers a practice idea. The recorded counts above come
                from game events.
              </p>
              {grownup && <ProvenanceDetails provenance={parent.provenance} />}
            </>
          ) : (
            <p className="muted">
              Ask, “What did you notice?” and “Can you show it another way?”
              Give the learner time to describe their thinking.
            </p>
          )}
        </article>

        {grownup && (
          <article className="panel report-settings">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">GROWN-UP SETTINGS</p>
                <h2>AI, with a clear choice.</h2>
              </div>
              <Icon name="shield" size={26} />
            </div>
            <p>
              Optional AI can help write short stories and practice guidance.
              Turning it off keeps the math games available with built-in
              content.
            </p>
            <div className="consent-control">
              <div>
                <strong>Optional AI features</strong>
                <p className="muted">
                  Currently {consent ? "enabled" : "off"} for this demo profile.
                </p>
              </div>
              <Button
                secondary
                disabled={savingConsent}
                onClick={changeConsent}
              >
                {savingConsent
                  ? "Saving…"
                  : consent
                    ? "Turn AI off"
                    : "Enable AI"}
              </Button>
            </div>
            <p className="evidence-note">
              This is a seeded demo profile. This switch demonstrates a consent
              setting; it does not verify a guardian’s identity or establish
              production consent.
            </p>
            {consentMessage && <p role="status">{consentMessage}</p>}
          </article>
        )}

        <article className="panel report-export">
          <Icon name="book" size={26} />
          <div>
            <h2>A journal you can keep.</h2>
            <p className="muted">
              {sessions.length} completed fraction{" "}
              {sessions.length === 1 ? "session" : "sessions"} saved in this
              browser. Export the raw evidence and the available arithmetic log.
            </p>
          </div>
          <Button secondary onClick={downloadEvidence}>
            <Icon name="download" size={18} /> Download journal
          </Button>
          <p className="muted report-caption">
            Fraction sessions stay in this browser. Arithmetic records belong to
            the local demo server. Neither is a school record.
          </p>
        </article>
      </div>
      {exportText && (
        <Modal title="Your journal is ready" onClose={() => setExportText("")}>
          <p className="muted">
            A JSON file was prepared for download. If your browser does not save
            it, select and copy the journal below.
          </p>
          <label className="small" htmlFor="journal-copy">
            Your complete journal
          </label>
          <textarea
            id="journal-copy"
            className="export-text"
            readOnly
            value={exportText}
            onFocus={(event) => event.target.select()}
          />
          <Button onClick={() => setExportText("")}>
            Back to my journal <Icon name="book" />
          </Button>
        </Modal>
      )}
    </section>
  );
}

function FractionEvidence({
  evidence,
}: {
  evidence: ReturnType<typeof summary>;
}) {
  return (
    <div className="report-metrics">
      <div className="metric-card">
        <Icon name="flag" size={22} />
        <p className="metric-value">
          {evidence.independentChecks}
          <span> / {evidence.checkCount}</span>
        </p>
        <h3>Session checks</h3>
        <p className="muted">Correct on the first try, without help.</p>
      </div>
      <div className="metric-card">
        <Icon name="mountain" size={22} />
        <p className="metric-value">{evidence.towers}</p>
        <h3>Practice towers</h3>
        <p className="muted">Matched during the guided expedition.</p>
      </div>
      <div className="metric-card">
        <Icon name="leaf" size={22} />
        <p className="metric-value">{evidence.supported}</p>
        <h3>With support</h3>
        <p className="muted">Items solved after help or another try.</p>
      </div>
    </div>
  );
}

function ProvenanceDetails({ provenance }: { provenance: Provenance }) {
  return (
    <details className="evidence-proof">
      <summary>See how this note was made</summary>
      <p className="muted">
        Automatic checks inspect the response format and text constraints. They
        do not establish learning outcomes.
      </p>
      <dl>
        <dt>Content source</dt>
        <dd>
          {provenance.final_source === "ai"
            ? "AI response accepted after checks"
            : "Built-in fallback content"}
        </dd>
        <dt>Provider</dt>
        <dd>{provenance.provider}</dd>
        <dt>Prompt version</dt>
        <dd>{provenance.prompt_version}</dd>
        <dt>Fields sent</dt>
        <dd>
          {provenance.fields_sent.length
            ? provenance.fields_sent.join(", ")
            : "None"}
        </dd>
      </dl>
      <ul>
        {provenance.checks.map((check, index) => (
          <li key={`${check.name}-${index}`}>
            <span className="badge">
              {check.passed ? "Passed" : "Fallback triggered"}
            </span>{" "}
            {check.name.replaceAll("_", " ")}
            {check.detail ? ` — ${check.detail}` : ""}
          </li>
        ))}
      </ul>
    </details>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  Icon,
  Button,
  Modal,
  Owl,
  readLocal,
  saveLocal,
  type IconName,
} from "./ui";
import type { Home, Skill, Preferences } from "./types";
import TowerGame from "./TowerGame";
import Arithmetic from "./Arithmetic";
import Reports from "./Reports";

type Screen =
  | "explore"
  | "journey"
  | "grownups"
  | "tower"
  | "arithmetic"
  | "story";
export default function App() {
  const [home, setHome] = useState<Home | null>(null),
    [error, setError] = useState(""),
    [screen, setScreen] = useState<Screen>("explore"),
    [skill, setSkill] = useState<Skill | null>(null),
    [settings, setSettings] = useState(false),
    [help, setHelp] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(() =>
    readLocal("summit.preferences", {
      sound: false,
      motion: true,
      contrast: false,
    }),
  );
  const reload = useCallback(async () => {
    try {
      setHome(await api("/home"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    saveLocal("summit.preferences", prefs);
    document.documentElement.classList.toggle("still", !prefs.motion);
    document.documentElement.classList.toggle("high-contrast", prefs.contrast);
  }, [prefs]);
  const go = (next: Screen, s?: Skill) => {
    if (s) setSkill(s);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    void reload();
  };
  const playing = ["tower", "arithmetic", "story"].includes(screen);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => go("explore")}
          aria-label="Summit home"
        >
          <span className="brand-icon">
            <Icon name="mountain" size={29} />
          </span>
          <span>
            summit<span className="brand-period">.</span>
          </span>
        </button>
        {!playing && (
          <nav aria-label="Main navigation">
            <button
              className={screen === "explore" ? "active" : ""}
              onClick={() => go("explore")}
            >
              <Icon name="compass" size={17} />
              Explore
            </button>
            <button
              className={screen === "journey" ? "active" : ""}
              onClick={() => go("journey")}
            >
              <Icon name="map" size={17} />
              My journey
            </button>
          </nav>
        )}
        {playing && (
          <span className="header-trail">
            <Icon name="mountain" size={16} />
            {screen === "tower"
              ? "Fraction peaks"
              : screen === "story"
                ? "Story expedition"
                : skill?.name}
          </span>
        )}
        <div className="header-actions">
          <button className="grownups-link" onClick={() => go("grownups")}>
            For grown-ups <Icon name="arrow" size={14} />
          </button>
          <button
            className="icon-button sound-toggle"
            aria-label={prefs.sound ? "Turn sound off" : "Turn sound on"}
            onClick={() => setPrefs({ ...prefs, sound: !prefs.sound })}
          >
            <Icon name={prefs.sound ? "sound" : "muted"} size={18} />
          </button>
          <button
            className="avatar"
            onClick={() => setSettings(true)}
            aria-label="Explorer settings"
          >
            S<span />
          </button>
        </div>
      </header>
      <main id="main-content">
        {!home ? (
          <div className="loading-panel">
            <Icon name="mountain" size={54} />
            <h1>
              {error
                ? "The trail is taking a moment."
                : "Preparing your next adventure…"}
            </h1>
            <p>{error || "A little curiosity goes a long way."}</p>
            {error && <Button onClick={() => void reload()}>Try again</Button>}
          </div>
        ) : (
          <>
            {screen === "explore" && (
              <Explore
                home={home}
                onTower={() => go("tower")}
                onPractice={(s) => go("arithmetic", s)}
                onStory={(s) => go("story", s)}
                onHelp={() => setHelp(true)}
                reload={reload}
              />
            )}
            {(screen === "journey" || screen === "grownups") && (
              <Reports
                key={screen}
                home={home}
                grownup={screen === "grownups"}
                onPlay={() => go("tower")}
              />
            )}
            {screen === "tower" && (
              <TowerGame
                sound={prefs.sound}
                onDone={() => go("journey")}
                onExit={() => go("explore")}
              />
            )}
            {(screen === "arithmetic" || screen === "story") && skill && (
              <Arithmetic
                key={`${screen}-${skill.id}`}
                skill={skill}
                story={screen === "story"}
                sound={prefs.sound}
                onExit={() => go("explore")}
                onDone={() => go("journey")}
              />
            )}
          </>
        )}
      </main>
      {!playing && (
        <footer className="site-footer">
          <span>
            <Icon name="mountain" size={17} />A little higher, every day.
          </span>
          <span>
            Made for curious minds. <i /> K–5 math adventures
          </span>
          <button onClick={() => setSettings(true)}>
            <Icon name="settings" size={15} />
            Settings
          </button>
        </footer>
      )}
      {settings && (
        <Modal title="Make yourself at home" onClose={() => setSettings(false)}>
          <p className="muted">
            Little adjustments for your kind of adventure.
          </p>
          <div className="setting-row">
            <span>
              <Icon name="sound" />
              Gentle game sounds
            </span>
            <button
              role="switch"
              aria-label="Gentle game sounds"
              aria-checked={prefs.sound}
              className={`switch ${prefs.sound ? "on" : ""}`}
              onClick={() => setPrefs({ ...prefs, sound: !prefs.sound })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>
              <Icon name="leaf" />
              Animated scenery
            </span>
            <button
              role="switch"
              aria-label="Animated scenery"
              aria-checked={prefs.motion}
              className={`switch ${prefs.motion ? "on" : ""}`}
              onClick={() => setPrefs({ ...prefs, motion: !prefs.motion })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>
              <Icon name="sun" />
              Extra contrast
            </span>
            <button
              role="switch"
              aria-label="Extra contrast"
              aria-checked={prefs.contrast}
              className={`switch ${prefs.contrast ? "on" : ""}`}
              onClick={() => setPrefs({ ...prefs, contrast: !prefs.contrast })}
            >
              <span />
            </button>
          </div>
          <p className="small muted">
            Fraction Peaks and stories have no clock or hearts. Arithmetic
            trails have three hearts and a two-minute bonus window that never
            stops play. Buttons and your keyboard both work.
          </p>
          <Button onClick={() => setSettings(false)}>
            Ready to explore <Icon name="arrow" />
          </Button>
        </Modal>
      )}
      {help && (
        <Modal
          title="Small steps. Real discoveries."
          onClose={() => setHelp(false)}
        >
          <div className="how-step">
            <span>01</span>
            <div>
              <h3>Find your adventure</h3>
              <p>
                Start with Fraction Peaks, or practice a number skill you know.
              </p>
            </div>
          </div>
          <div className="how-step">
            <span>02</span>
            <div>
              <h3>Think with your hands</h3>
              <p>Turn each layer until every picture shows the same amount.</p>
            </div>
          </div>
          <div className="how-step">
            <span>03</span>
            <div>
              <h3>Make it your own</h3>
              <p>
                Ask Pip for help, then try a fresh challenge. Your journal
                remembers both.
              </p>
            </div>
          </div>
          <div className="how-step">
            <span>04</span>
            <div>
              <h3>Find your way back</h3>
              <p>After five days away, you can choose a practice level one step easier. Your past achievements stay in your journal.</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setHelp(false);
              go("tower");
            }}
          >
            Let's climb <Icon name="arrow" />
          </Button>
        </Modal>
      )}
    </div>
  );
}
const skillMeta: Record<
  string,
  { name: string; land: string; icon: IconName; tone: string }
> = {
  add20: {
    name: "Little additions",
    land: "Meadow trail",
    icon: "leaf",
    tone: "mint",
  },
  sub20: {
    name: "Take-away trail",
    land: "Fern forest",
    icon: "leaf",
    tone: "mint",
  },
  place: {
    name: "Tens & ones",
    land: "Crystal caves",
    icon: "spark",
    tone: "lilac",
  },
  add100: {
    name: "Bigger additions",
    land: "Sunrise ridge",
    icon: "sun",
    tone: "peach",
  },
  sub100: {
    name: "Subtraction steps",
    land: "Moonlit valley",
    icon: "moon",
    tone: "lilac",
  },
  mul: {
    name: "Multiplication",
    land: "Alpine meadows",
    icon: "sun",
    tone: "peach",
  },
  div: {
    name: "Share it equally",
    land: "River crossing",
    icon: "compass",
    tone: "blue",
  },
};
function Explore({
  home,
  onTower,
  onPractice,
  onStory,
  onHelp,
  reload,
}: {
  home: Home;
  onTower: () => void;
  onPractice: (s: Skill) => void;
  onStory: (s: Skill) => void;
  onHelp: () => void;
  reload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("All trails"),
    [choose, setChoose] = useState<Skill | null>(null),
    [come, setCome] = useState(home.comeback.due),
    [comeInfo, setComeInfo] = useState(false),
    [comeBusy, setComeBusy] = useState(false),
    [error, setError] = useState("");
  const comeLock = useRef(false);
  const applyComeback = async () => {
    if (comeLock.current) return;
    comeLock.current = true;
    setComeBusy(true);
    setError("");
    try {
      const comeback = await api("/comeback/apply", {});
      if (comeback.applied) {
        // The learner chose a gentler new round. Old assessments remain on
        // the server, but an old harder round should not override that choice.
        home.skills.forEach((s) => saveLocal(`summit.arithmetic.active.${s.id}`, null));
      }
      await reload();
      setCome(false);
      setComeInfo(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      comeLock.current = false;
      setComeBusy(false);
    }
  };
  const visible = home.skills.filter((s) =>
    filter === "All trails" || filter === "Early explorers"
      ? filter === "All trails" || ["add20", "sub20", "place"].includes(s.id)
      : ["add100", "sub100", "mul", "div"].includes(s.id),
  );
  const startStory = () => {
    const s = home.skills.find((s) => s.id === "mul") || home.skills[0];
    onStory(s);
  };
  return (
    <div className="explore-page">
      <section className="hero-world" aria-labelledby="hero-heading">
        <img
          src="/art/summit-island.png"
          alt="A tiny alpine world with glowing stepping stones winding up to a snowy summit"
          className="hero-art"
        />
        <div className="hero-vignette" />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="live-dot" /> BIG DISCOVERIES START SMALL
          </div>
          <h1 id="hero-heading">
            A little curiosity.
            <br />A whole new <br />
            <span>altitude.</span>
          </h1>
          <p>
            Turn “I can't” into “I did.”
            <br />
            One playful math adventure at a time.
          </p>
          <Button onClick={onTower}>
            Let's climb <Icon name="arrow" size={19} />
          </Button>
          <div className="hero-footnote">
            <Icon name="leaf" size={15} />
            Your pace. Your path. Your mountain.
          </div>
        </div>
        <div className="map-label label-summit">
          <span className="marker" />
          <span>
            THE SUMMIT<small>There’s a little more in you.</small>
          </span>
        </div>
        <div className="map-label label-camp">
          <span className="camp-icon">
            <Icon name="flag" size={17} />
          </span>
          <span>
            BASECAMP<small>Your adventure starts here</small>
          </span>
        </div>
        <div className="hero-coordinate">
          EST. FOR EXPLORERS <span>✦</span> 01 / ∞
        </div>
      </section>
      <div className="welcome-strip">
        <span className="welcome-avatar">
          <Icon name="sun" size={20} />
        </span>
        <div>
          <strong>
            Hey, {home.learner.display_name}. Ready for a little wonder?
          </strong>
          <span>You don't have to be fast. Just curious.</span>
        </div>
        <button onClick={onHelp}>
          How it works <Icon name="arrow" size={17} />
        </button>
      </div>
      <section className="return-trail" aria-labelledby="return-heading">
        <div className="return-trail-mark" aria-hidden="true"><Icon name="refresh" size={36} /><span><Icon name="leaf" size={17} /></span></div>
        <div className="return-trail-copy">
          <div className="eyebrow">THERE'S A WAY BACK, TOO</div>
          <h2 id="return-heading">A new day. A softer first step.</h2>
          <p>After five days away, choose an easier practice level to find your footing. Your past achievements stay in your journal.</p>
        </div>
        <button className="return-trail-action" onClick={() => home.comeback.due ? setCome(true) : setComeInfo(true)}>
          <span>{home.comeback.due ? "Your return trail is ready" : "A little help returning"}</span>
          {home.comeback.due ? "Choose my way back" : "How a comeback works"} <Icon name="arrow" size={17} />
        </button>
      </section>
      <section className="adventures-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FIND YOUR NEXT “AHA!”</div>
            <h2>Choose a little adventure.</h2>
          </div>
          <span className="quiet-pill">
            <span className="live-dot" /> A path for every kind of day.
          </span>
        </div>
        <div className="adventure-grid">
          <button className="adventure-card featured" onClick={onTower}>
            <div className="card-copy">
              <span className="badge mint">
                <Icon name="spark" size={13} />
                THE FEATURED CLIMB
              </span>
              <h3>
                Different pieces.
                <br />
                Same big idea.
              </h3>
              <p>
                Spin a tower. Find a match.
                <br />
                Discover the magic of fractions.
              </p>
              <div className="card-meta">
                FRACTIONS <i /> GRADE 4 <i /> 5 STOPS
              </div>
              <span className="text-link">
                Explore Fraction Peaks <Icon name="arrow" size={17} />
              </span>
            </div>
            <div className="mini-tower" aria-hidden="true">
              <span className="tower-star">✧</span>
              <div className="mini-layer layer-one">½</div>
              <div className="mini-layer layer-two">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="mini-layer layer-three">²⁄₄</div>
              <div className="mini-plinth" />
            </div>
          </button>
          <button
            className="adventure-card story-card"
            onClick={startStory}
            disabled={!home.story_missions_enabled}
          >
            <span className="badge peach">
              <Icon name="book" size={13} />
              STORY EXPEDITION
            </span>
            <div className="story-orbit" aria-hidden="true">
              <div className="planet">
                <span />
              </div>
              <span className="orbit-star s1">✦</span>
              <span className="orbit-star s2">✧</span>
              <span className="orbit-dot" />
              <div className="orbital-ring" />
            </div>
            <h3>
              A problem.
              <br />A thousand possibilities.
            </h3>
            <p>
              Space explorer or ocean adventurer?
              <br />
              Make math part of your story.
            </p>
            <span className="text-link">
              Choose your world <Icon name="arrow" size={17} />
            </span>
          </button>
        </div>
      </section>
      <section className="practice-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">BUILD YOUR FOOTING</div>
            <h2>Small steps. Strong foundations.</h2>
          </div>
          <div className="filter-pills" aria-label="Filter practice trails">
            {["All trails", "Early explorers", "Growing climbers"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                className={filter === f ? "selected" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="skill-grid">
          {visible.map((s) => {
            const m = skillMeta[s.id];
            return (
              <button
                key={s.id}
                className={`skill-card ${m.tone}`}
                onClick={() => setChoose(s)}
              >
                <div className="skill-icon">
                  <Icon name={m.icon} size={23} />
                </div>
                <div>
                  <span className="skill-land">{m.land}</span>
                  <h3>{m.name}</h3>
                  <span className="skill-detail">
                    Grade {s.grade} <i /> Level {s.level}
                  </span>
                </div>
                <Icon name="arrow" size={17} />
                <div className="skill-progress">
                  <span style={{ width: `${(s.run / 3) * 100}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="pip-banner">
        <Owl />
        <div>
          <h3>You've got a trail buddy.</h3>
          <p>
            Pip is here with a little nudge whenever you need one. Asking for
            help is part of the climb.
          </p>
        </div>
        <span className="handwritten">Let's figure it out, together.</span>
      </section>
      {choose && (
        <Modal
          title={skillMeta[choose.id].name}
          onClose={() => setChoose(null)}
        >
          <span className="badge mint">
            GRADE {choose.grade} · LEVEL {choose.level}
          </span>
          <h3 className="modal-lead">A little practice goes a long way.</h3>
          <p className="muted">
            Seven little challenges and three hearts. A wrong answer uses one
            heart; after three, start fresh with your level still unlocked.
          </p>
          <div className="practice-rules">
            <span><Icon name="spark" size={17} /><span>Finish all seven within two minutes for <strong>+50 points</strong>. After that, keep playing. Your points are safe.</span></span>
            <span><Icon name="mountain" size={17} /><span>Three correct, independent answers in a row at your current level unlock the next one.</span></span>
          </div>
          <div className="tip-box">
            <Owl small />
            <p>{choose.tip}</p>
          </div>
          <Button onClick={() => onPractice(choose)}>
            {readLocal<{round_id?: string} | null>(`summit.arithmetic.active.${choose.id}`, null)?.round_id ? "Resume this trail" : "Start this trail"} <Icon name="arrow" />
          </Button>
          <Button
            secondary
            onClick={() => onStory(choose)}
            disabled={!home.story_missions_enabled}
          >
            Make it a story <Icon name="book" />
          </Button>
        </Modal>
      )}
      {(come || comeInfo) && (
        <Modal title={home.comeback.due ? "Good to see you again." : "Your trail will be here."} onClose={() => {
          if (!comeBusy) { setCome(false); setComeInfo(false); }
        }}>
          <Owl />
          <p className="muted">
            {home.comeback.due ? `It's been ${home.comeback.days_away} days. We` : "After five days away, we"} can ease each practice skill by one level, never below level one, to help you find your footing.
            You choose whether to take the gentler trail. Your past achievements stay in your journal.
          </p>
          <p className="small muted">Choosing the gentler trail starts fresh practice at that level. Answers from unfinished trails stay in your history.</p>
          {home.comeback.due && <p>
            {home.comeback.freeze_available
              ? "Your streak protection is ready."
              : "A fresh start is always welcome."}
          </p>}
          {error && <p role="alert">{error}</p>}
          {home.comeback.due && <Button onClick={() => void applyComeback()} disabled={comeBusy}>
            {comeBusy ? "Finding your footing…" : "Take the gentle trail"} <Icon name="leaf" />
          </Button>}
          <Button secondary={home.comeback.due} disabled={comeBusy} onClick={() => { setCome(false); setComeInfo(false); }}>
            {home.comeback.due ? "Keep my current challenge" : "Ready for my next little adventure"}
          </Button>
        </Modal>
      )}
    </div>
  );
}

import { Icon, Button, Owl } from "./ui";
import { ExpeditionProgress } from "./ExpeditionProgress";
import { Party } from "./TeachScene";
import type { Journal } from "../../shared/journal";
import type { TeachingPage } from "./teachingTypes";
export function TeachHome({
  book,
  go,
  setModal,
  onWarmUp,
  onResume,
}: {
  book: Journal;
  go: (page: TeachingPage) => void;
  setModal: (value: "new") => void;
  onWarmUp: () => void;
  onResume: () => void;
}) {
  return (
    <div className="teach-home">
      <section className="teach-hero">
        <img
          src="/art/summit-island.png"
          alt="An alpine island with a glowing path from a cozy basecamp to the summit"
        />
        <div className="teach-hero-shade" />
        <div className="teach-hero-copy">
          <span className="eyebrow">
            <i /> A LITTLE WORLD. LED BY YOU.
          </span>
          <h1>
            Your ideas.
            <br />
            Their adventure.
            <br />
            <em>One summit.</em>
          </h1>
          <p>
            Teach Pip and friends a way forward.
            <br />
            See what happens. Find another way.
          </p>
          <Button
            onClick={() =>
              book.route ? go(book.completed ? "summit" : "play") : go("routes")
            }
          >
            {book.route ? "Continue our expedition" : "Lead the expedition"}
            <Icon name="arrow" />
          </Button>
          <span className="hero-small">Create. Teach. Wonder together.</span>
        </div>
        <div className="summit-marker">
          <Icon name="flag" size={18} />
          <span>
            THE SUMMIT<small>We get there together.</small>
          </span>
        </div>
        <div className="hero-party-note">
          <Owl />
          <p>
            “You lead.
            <br />
            <strong>I’ll try your idea.”</strong>
          </p>
        </div>
        <div className="hero-chapter">
          <span>01</span>
          <div>
            THE SUMMIT PICNIC
            <small>A small adventure in sharing fairly</small>
          </div>
          <Icon name="leaf" size={20} />
        </div>
      </section>
      <div className="teach-manifest">
        <span>
          <b>01</b> Choose your path
        </span>
        <i />
        <span>
          <b>02</b> Teach your idea
        </span>
        <i />
        <span>
          <b>03</b> Watch it become real
        </span>
      </div>
      <section className="home-invite">
        <div>
          <span className="eyebrow">PIP HAS FRIENDS. YOU HAVE IDEAS.</span>
          <h2>
            A little more than
            <br />
            getting to the top.
          </h2>
          <p>
            Some paths light a beacon. Others welcome a new friend.
            <br />
            The decisions are yours. So is the teaching.
          </p>
        </div>
        <Party names={["Pip", "Moss", "Wren"]} />
        <button
          className="text-link"
          onClick={() => (book.route ? setModal("new") : go("routes"))}
        >
          Explore the two routes <Icon name="arrow" size={17} />
        </button>
      </section>
      <ExpeditionProgress
        book={book}
        onExplore={() => (book.route ? setModal("new") : go("routes"))}
        onWarmUp={onWarmUp}
        onResume={onResume}
      />
      <section className="home-panels">
        <button onClick={() => go("journal")}>
          <Icon name="book" size={26} />
          <div>
            <span className="eyebrow">THE STORY OF YOUR THINKING</span>
            <h3>Ideas worth coming back to.</h3>
            <p>Your teaching, revisions, and questions to explore together.</p>
          </div>
          <Icon name="arrow" />
        </button>
        <button onClick={() => go("legacy")}>
          <Icon name="mountain" size={26} />
          <div>
            <span className="eyebrow">THE ORIGINAL TRAILS</span>
            <h3>A little practice at basecamp.</h3>
            <p>Fraction Peaks, arithmetic trails, and story worlds.</p>
          </div>
          <Icon name="arrow" />
        </button>
      </section>
    </div>
  );
}

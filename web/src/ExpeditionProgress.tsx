import type { Journal } from "../../shared/journal";
import { Icon } from "./ui";
import { comebackDue, routeProgress } from "./progressModel";
import "./progress.css";
export function ExpeditionProgress({
  book,
  onExplore,
  onWarmUp,
  onResume,
}: {
  book: Journal;
  onExplore: () => void;
  onWarmUp: () => void;
  onResume: () => void;
}) {
  const progress = routeProgress(book.runs);
  const comeback = comebackDue(book);
  return (
    <section className="expedition-progress" aria-label="Your expedition trail">
      <div>
        <span className="eyebrow">YOUR EXPEDITION TRAIL</span>
        <h2>A new situation. Another way to grow.</h2>
        <p>
          Teach a fair share, adapt it at the next camp, then try eight berries
          with four friends at the summit.
        </p>
      </div>
      <div className="progress-routes">
        {progress.map((p) => (
          <article key={p.route}>
            <Icon name={p.route === "ridge" ? "spark" : "leaf"} size={24} />
            <h3>{p.route === "ridge" ? "Beacon Ridge" : "Meadow Camp"}</h3>
            <ol>
              {p.stages.map((s) => (
                <li key={s.stage}>
                  <Icon name={s.complete ? "check" : "flag"} size={14} />
                  <span>
                    {s.label}:{" "}
                    {s.complete ? "fair share observed" : "still to explore"}
                  </span>
                </li>
              ))}
            </ol>
            <strong>
              {p.complete
                ? "Summit reached together"
                : "A path waiting for your idea"}
            </strong>
            {p.complete && (
              <small>
                {p.transferWithSupport
                  ? "Picture or coach support accompanied the summit attempt."
                  : "No picture or coach opened before the summit attempt."}
              </small>
            )}
          </article>
        ))}
      </div>
      <p className="progress-boundary">
        Your route keeps the story of what worked here. Try the other path to
        explore a different change. Longer expeditions are a next build.
      </p>
      <button className="button secondary" onClick={onExplore}>
        Explore the two routes <Icon name="compass" size={18} />
      </button>
      {comeback && (
        <aside className="expedition-comeback">
          <OwlNote />
          <div>
            <h3>Welcome back. Your ideas are still here.</h3>
            <p>
              Start with a small six-berry example, or continue from your saved
              camp. Your earlier achievements stay with you.
            </p>
            <button className="button" onClick={onWarmUp}>
              Warm up with Pip
            </button>
            <button className="text-link" onClick={onResume}>
              Continue my expedition
            </button>
          </div>
        </aside>
      )}
    </section>
  );
}
function OwlNote() {
  return <Icon name="leaf" size={30} />;
}

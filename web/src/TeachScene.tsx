import { Owl, Icon } from "./ui";
import type { Route } from "../../shared/expedition";
export function Berry({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`berry ${small ? "small" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 9C4 2 1 11 5 17s11 7 15 0 0-15-8-8Z" fill="#d9938d" />
      <path d="M12 11c-1-6 3-9 7-8-1 5-4 7-7 8" fill="#adc89b" />
      <path
        d="M8 13v1m6 2v1m-4 1v1"
        stroke="#73444e"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Friend({
  name,
  index = 0,
  joined = false,
}: {
  name: string;
  index?: number;
  joined?: boolean;
}) {
  return (
    <div className={`exp-friend friend-${index} ${joined ? "joined" : ""}`}>
      <div className="friend-halo">
        <Owl />
        <span className="friend-scarf" />
      </div>
      <span>{name}</span>
    </div>
  );
}
export function Party({ names }: { names: string[] }) {
  return (
    <div className="exp-party">
      {names.map((n, i) => (
        <Friend key={n} name={n} index={i} joined={i === 3} />
      ))}
    </div>
  );
}
export function RouteArt({ route }: { route: Route }) {
  return (
    <div className={`route-art ${route}`}>
      <svg viewBox="0 0 600 230" aria-hidden="true">
        <defs>
          <linearGradient id={`r-${route}`} x2="0" y2="1">
            <stop stopColor={route === "ridge" ? "#38556b" : "#355e50"} />
            <stop offset="1" stopColor="#243e42" />
          </linearGradient>
        </defs>
        <path d="M0 0h600v230H0Z" fill={`url(#r-${route})`} />
        <circle cx="480" cy="55" r="23" fill="#edcf90" opacity=".85" />
        <path
          d="m0 165 100-105 98 98 130-127 152 135 60-70 60 65v69H0Z"
          fill={route === "ridge" ? "#6a8490" : "#769982"}
        />
        <path d="m279 78 49-47 55 49-35-5-19 11-20-15Z" fill="#dbe5da" />
        <path d="M0 199Q122 96 240 183t360-8v70H0Z" fill="#315849" />
        <path
          d="M-20 226Q150 113 340 209t280-45"
          fill="none"
          stroke="#b6c78e"
          strokeWidth="12"
        />
        <path
          d="M-20 226Q150 113 340 209t280-45"
          fill="none"
          stroke="#e0d5a7"
          strokeWidth="2"
          strokeDasharray="7 9"
        />
        {route === "ridge" ? (
          <g transform="translate(334 112)">
            <path d="m0 0 27-15 27 15-27 16Z" fill="#d7bca0" />
            <path d="M0 0v60l27 16V16Z" fill="#789a8e" />
            <path d="M27 16v60l27-16V0Z" fill="#4d776d" />
            <circle cx="27" cy="-13" r="13" fill="#e9d895" />
            <circle cx="27" cy="-13" r="24" fill="#e9d895" opacity=".12" />
          </g>
        ) : (
          <g>
            <path
              d="M190 190v-73m-20 30 20-45 20 45m-44 15 24-46 24 46"
              fill="#183f37"
              stroke="#183f37"
              strokeWidth="5"
            />
            <path
              d="M422 204v-66m-16 17 16-38 16 38m-37 18 21-44 21 44"
              fill="#244f3a"
              stroke="#244f3a"
              strokeWidth="5"
            />
            <g fill="#d79b97">
              {[70, 92, 435, 455, 477].map((x, i) => (
                <circle key={x} cx={x} cy={198 + (i % 2) * 8} r="4" />
              ))}
            </g>
          </g>
        )}
      </svg>
      <div className="route-art-label">
        <Icon name={route === "ridge" ? "spark" : "leaf"} size={14} />
        {route === "ridge"
          ? "LIGHT A WAY FOR EVERYONE"
          : "THERE’S ROOM FOR ONE MORE"}
      </div>
    </div>
  );
}
export function ExpeditionMap({
  route,
  stage,
  complete = false,
}: {
  route: Route | null;
  stage: string;
  complete?: boolean;
}) {
  const active = complete
    ? 4
    : stage === "transfer"
      ? 3
      : stage === "changed"
        ? 2
        : route
          ? 1
          : 0;
  return (
    <div className="exp-map">
      <img
        src="/art/summit-island.png"
        alt="The alpine island, from basecamp to the summit"
      />
      <div className="map-shade" />
      <div className="map-caption">
        <span className="eyebrow">YOUR EXPEDITION</span>
        <strong>
          {complete
            ? "A summit, reached together."
            : route === "ridge"
              ? "Along Beacon Ridge"
              : route === "meadow"
                ? "Through Meadow Camp"
                : "Every path starts with an idea."}
        </strong>
      </div>
      <div className="map-stops">
        {[
          "Basecamp",
          "Your teaching",
          "Changed situation",
          "Fresh challenge",
          "The summit",
        ].map((s, i) => (
          <div
            className={i <= active ? "reached" : ""}
            key={s}
            aria-current={i === active ? "step" : undefined}
            aria-label={`${s}: ${i < active ? "completed" : i === active ? "current step" : "ahead"}`}
          >
            <span>
              {i < active ? (
                <Icon name="check" size={13} />
              ) : i === 4 ? (
                <Icon name="flag" size={13} />
              ) : (
                i + 1
              )}
            </span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <p className="map-stage-note">
        {complete
          ? "Summit reached. Explore the other route for a different change."
          : stage === "transfer"
            ? "Next: reach the summit by sharing eight berries fairly among four friends."
            : stage === "changed"
              ? "Next: a fresh challenge opens when every friend has an equal share and the basket is empty."
              : "Next: the changed camp opens when every friend has an equal share and the basket is empty."}
      </p>
    </div>
  );
}

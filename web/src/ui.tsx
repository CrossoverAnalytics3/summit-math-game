import { useEffect, useRef, useId, type ReactNode } from "react";
export type IconName =
  | "mountain"
  | "compass"
  | "map"
  | "spark"
  | "arrow"
  | "back"
  | "check"
  | "close"
  | "sound"
  | "muted"
  | "settings"
  | "leaf"
  | "flag"
  | "book"
  | "shield"
  | "sun"
  | "moon"
  | "help"
  | "home"
  | "download"
  | "play"
  | "refresh";
const paths: Record<IconName, ReactNode> = {
  mountain: (
    <>
      <path d="m2 20 7-13 4 7 3-10 6 16Z" />
      <path d="m6 13 3 2 2-2m3-3 2 2 2-2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-3 5-5 3 3-5Z" />
    </>
  ),
  map: (
    <>
      <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16" />
    </>
  ),
  spark: (
    <>
      <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5ZM20 2v4m-2-2h4" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  sound: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    </>
  ),
  muted: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 2-1 2 3h3l1-3 3-1 2-3-2-2 1-3-3-2-2 1-2-3Z" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C5 2 1 10 6 17s16 2 14-14ZM5 20 16 9" />
    </>
  ),
  flag: (
    <>
      <path d="M5 22V3m0 1c6-4 8 4 15 0v10c-7 4-9-4-15 0" />
    </>
  ),
  book: (
    <>
      <path d="M12 5C8 2 5 3 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-3 0-6-1-10 2Zm0 0v16" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 9 3 3 7-7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
    </>
  ),
  moon: <path d="M21 14A9 9 0 0 1 10 3a9 9 0 1 0 11 11Z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8a3 3 0 1 1 4 3c-1 0-1 1-1 2m0 3h.01" />
    </>
  ),
  home: (
    <>
      <path d="m2 10 10-8 10 8M5 8v13h14V8m-10 13v-7h6v7" />
    </>
  ),
  download: (
    <>
      <path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8Z" />,
  refresh: (
    <>
      <path d="M20 8a8 8 0 1 0 0 8m0-14v6h-6" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  ...rest
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`${secondary ? "button secondary" : "button"} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const headingId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={headingId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export async function api(path: string, body?: unknown) {
  const r = await fetch(
    "/api" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const j = await r.json();
  if (!r.ok)
    throw new Error(
      j.error || "Something interrupted the trail. Please try again.",
    );
  return j;
}
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}
export function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export function speak(text: string) {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    speechSynthesis.speak(u);
  }
}
let audioContext: AudioContext | null = null;
export function chime(enabled: boolean) {
  if (!enabled) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = audioContext!.createOscillator(),
        g = audioContext!.createGain(),
        t = audioContext!.currentTime + i * 0.09;
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g);
      g.connect(audioContext!.destination);
      o.start(t);
      o.stop(t + 0.45);
    });
  } catch {}
}
export function FractionText({ n, d }: { n: number; d: number }) {
  return (
    <span className="fraction-text" aria-label={`${n} over ${d}`}>
      <span>{n}</span>
      <span>{d}</span>
    </span>
  );
}
export function Owl({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "owl small" : "owl"}
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <path
        d="M15 29 12 10l21 10a40 40 0 0 1 17 0l18-10-3 22c16 39-15 44-25 44S1 69 15 29Z"
        fill="#c7dec5"
      />
      <path d="M19 52C0 39 9 30 15 28m46 24c20-13 11-22 5-24" fill="#719b83" />
      <ellipse cx="29" cy="37" rx="15" ry="17" fill="#faf4dc" />
      <ellipse cx="52" cy="37" rx="15" ry="17" fill="#faf4dc" />
      <circle cx="31" cy="38" r="5" fill="#143336" />
      <circle cx="50" cy="38" r="5" fill="#143336" />
      <circle cx="33" cy="36" r="1.7" fill="white" />
      <circle cx="52" cy="36" r="1.7" fill="white" />
      <path d="m35 47 6 8 6-8" fill="#e6ac67" />
      <path
        d="m31 62 3 3m8-3 3 3m-6 6 3 2"
        stroke="#719b83"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m24 74 8-1m16 0 8 1"
        stroke="#e6ac67"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

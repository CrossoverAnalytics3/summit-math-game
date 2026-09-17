import { useEffect, useId, useRef, useState } from "react";
import {
  createGuidanceBudget,
  createIdleGuidance,
  type GuidanceBudget,
} from "./guidance";
import { Icon, Owl } from "./ui";
import "./beacon.css";

type Props = {
  /** Selector for an existing, actionable control. Never a correct-answer selector. */
  target: string | null;
  message: string;
  enabled?: boolean;
  resetKey?: string;
  /** Stable across steps and runs within one activity; new only for a new activity. */
  activityKey?: string;
  reducedMotion?: boolean;
};

// Keep a resumed activity's budget during this page visit, including remounts.
// No child data is stored here. A bounded cache avoids growing with every round.
const budgets = new Map<string, GuidanceBudget>();
function activityBudget(key: string) {
  const existing = budgets.get(key);
  if (existing) return existing;
  const budget = createGuidanceBudget();
  budgets.set(key, budget);
  if (budgets.size > 256) budgets.delete(budgets.keys().next().value!);
  return budget;
}

function isAvailable(element: HTMLElement | null) {
  if (
    !element ||
    !element.isConnected ||
    document.hidden ||
    document.querySelector("dialog[open]")
  )
    return false;
  if (
    element.matches(":disabled, [aria-disabled='true']") ||
    element.closest("[hidden], [inert], [aria-hidden='true']")
  )
    return false;
  const style = getComputedStyle(element);
  // Being below the fold is allowed: Show me can bring that control into view.
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    element.getClientRects().length > 0
  );
}

export function ActionBeacon({
  target,
  message,
  enabled = true,
  resetKey = "",
  activityKey,
  reducedMotion = false,
}: Props) {
  const [shown, setShown] = useState(false);
  const instanceId = useId();
  const budgetKey = activityKey ?? instanceId;
  const targetRef = useRef<HTMLElement | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let current: HTMLElement | null = null;
    const removeGlow = () =>
      current?.classList.remove("action-beacon-target", "action-beacon-steady");
    const controller = createIdleGuidance(
      (show) => {
        setShown(show);
        if (!show) removeGlow();
      },
      {
        setTimeout: (callback, delay) => window.setTimeout(callback, delay),
        clearTimeout: (handle) => window.clearTimeout(handle as number),
      },
      {
        budget: activityBudget(budgetKey),
        isEligible: () => isAvailable(current),
      },
    );

    function refreshTarget() {
      let next: HTMLElement | null = null;
      if (target) {
        try {
          next = document.querySelector<HTMLElement>(target);
        } catch {
          /* Invalid selectors simply disable guidance. */
        }
      }
      if (next !== current) {
        removeGlow();
        current = next;
        targetRef.current = next;
        controller.resetContext();
      }
      controller.setEligible(isAvailable(current));
    }

    function activity(event: Event) {
      // Let the help button receive its click before dismissing its own card.
      if (
        event.target instanceof Element &&
        event.target.closest(".action-beacon-card")
      )
        return;
      controller.activity();
      refreshTarget();
    }
    function visibility() {
      controller.setVisible(!document.hidden);
      refreshTarget();
    }
    resetRef.current = controller.activity;
    controller.setVisible(!document.hidden);
    refreshTarget();
    controller.setEnabled(enabled && !!target);

    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;
    for (const event of events)
      document.addEventListener(event, activity, {
        capture: true,
        passive: true,
      });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", refreshTarget);
    const observer = new MutationObserver(refreshTarget);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "disabled",
        "aria-disabled",
        "hidden",
        "inert",
        "aria-hidden",
        "open",
        "style",
        "class",
      ],
    });

    return () => {
      controller.dispose();
      removeGlow();
      observer.disconnect();
      for (const event of events)
        document.removeEventListener(event, activity, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", refreshTarget);
      resetRef.current = null;
      targetRef.current = null;
    };
  }, [target, enabled, resetKey, message, budgetKey]);

  useEffect(() => {
    const element = targetRef.current;
    if (!shown || !element) return;
    element.classList.add("action-beacon-target");
    element.classList.toggle("action-beacon-steady", reducedMotion);
    return () =>
      element.classList.remove("action-beacon-target", "action-beacon-steady");
  }, [shown, reducedMotion]);

  function showControl() {
    const element = targetRef.current;
    if (isAvailable(element) && element) {
      element.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "center",
        inline: "nearest",
      });
      // This is an explicit request to find the control, not an automatic focus move.
      element.focus({ preventScroll: true });
    }
    resetRef.current?.();
  }

  if (!shown || !enabled || !target) return null;
  return (
    <aside
      className={`action-beacon-card${reducedMotion ? " action-beacon-calm" : ""}`}
      aria-label="A little help from Pip"
    >
      <div className="action-beacon-pip">
        <Owl />
      </div>
      <div className="action-beacon-copy">
        <span>Pip’s next step</span>
        <p role="status">{message}</p>
        <button type="button" onClick={showControl}>
          Show me <Icon name="arrow" size={16} />
        </button>
      </div>
      <button
        className="action-beacon-dismiss"
        type="button"
        aria-label="Dismiss Pip’s hint"
        onClick={() => resetRef.current?.()}
      >
        <Icon name="close" size={16} />
      </button>
    </aside>
  );
}

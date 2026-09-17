/** Navigation guidance never changes an answer, an attempt, or learning evidence. */
export const GUIDANCE_DELAYS_MS = [10_000, 30_000] as const;

/** Shared across controller replacements; only a new activity gets a new budget. */
export type GuidanceBudget = { hintsShown: number };
export const createGuidanceBudget = (): GuidanceBudget => ({ hintsShown: 0 });

export type GuidanceClock = {
  setTimeout: (callback: () => void, delay: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

/** A full quiet period is required after every interaction or availability change. */
export function createIdleGuidance(
  onChange: (show: boolean) => void,
  clock: GuidanceClock,
  options: {
    budget?: GuidanceBudget;
    isEligible?: () => boolean;
  } = {},
) {
  const budget = options.budget ?? createGuidanceBudget();
  let enabled = false;
  let visible = true;
  let eligible = false;
  let disposed = false;
  let shown = false;
  let timer: unknown;

  function reset() {
    if (timer !== undefined) clock.clearTimeout(timer);
    timer = undefined;
    if (shown) {
      shown = false;
      onChange(false);
    }
    const delay = GUIDANCE_DELAYS_MS[budget.hintsShown];
    if (!disposed && enabled && visible && eligible && delay !== undefined) {
      timer = clock.setTimeout(() => {
        timer = undefined;
        if (!disposed && enabled && visible && eligible) {
          // A dialog or hidden control at the deadline must not spend a hint.
          if (options.isEligible && !options.isEligible()) {
            eligible = false;
            return;
          }
          budget.hintsShown += 1;
          shown = true;
          onChange(true);
        }
      }, delay);
    }
  }

  return {
    activity: reset,
    resetContext: reset,
    setEnabled(value: boolean) {
      if (enabled !== value) {
        enabled = value;
        reset();
      }
    },
    setVisible(value: boolean) {
      if (visible !== value) {
        visible = value;
        reset();
      }
    },
    setEligible(value: boolean) {
      if (eligible !== value) {
        eligible = value;
        reset();
      }
    },
    dispose() {
      disposed = true;
      reset();
    },
  };
}

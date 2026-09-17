import { useEffect, useState, type CSSProperties } from "react";
import { Button, Icon, Modal, Owl } from "./ui";
import "./tutorial.css";

export type TutorialKind =
  | "teaching-ridge"
  | "teaching-meadow"
  | "fraction"
  | "arithmetic"
  | "story";

type TutorialStep = { title: string; instruction: string; caption: string };
const teachingSteps = (ridge: boolean): TutorialStep[] => [
  {
    title: "First, give Pip an instruction.",
    instruction: ridge
      ? "Choose ‘A share of the whole’. Tap the tower arrows to pick a share. Then press ‘Use this teaching’."
      : "Choose ‘An amount for each’. Use + or − to choose the amount. Then press ‘Use this teaching’.",
    caption: ridge
      ? "In this example: 6 berries, 3 friends. One third of the basket is 2 berries."
      : "In this example: 6 berries, 3 friends. Our instruction is ‘Give 2 berries to each friend.’",
  },
  {
    title: "Next, make a prediction.",
    instruction:
      "Open ‘Choose your prediction’. Pick what you think a fair share would be. ‘I’m not sure yet’ is okay, too.",
    caption:
      "We predict 2 berries each. Your prediction does not change Pip’s instruction.",
  },
  {
    title: "Now, let Pip try your idea.",
    instruction:
      "Press ‘Let Pip try this’. Watch Pip follow your instruction, one friend at a time.",
    caption:
      "2 for Pip. 2 for Moss. 2 for Wren. The basket is empty and the shares match!",
  },
  {
    title: "Look, change, and try again.",
    instruction:
      "Same shares and an empty basket? Tap ‘Continue the climb’. If they don’t match, tap ‘Try another idea’ and change your instruction.",
    caption: ridge
      ? "Along the ridge, the basket changes. Check whether your teaching still works."
      : "In the meadow, another friend joins. Check whether your teaching still works.",
  },
];
const fractionSteps: TutorialStep[] = [
  {
    title: "Look at ‘MATCH THIS’.",
    instruction:
      "The target tells you the amount to make. In this little example, our target is three fifths.",
    caption: "Three fifths means 3 of 5 equal parts. Keep this amount in mind.",
  },
  {
    title: "Turn the fraction layer.",
    instruction:
      "Tap an arrow beside the fraction. Find a fraction worth the same amount as the target.",
    caption:
      "6/10 is another way to show three fifths. The numbers can look different and mean the same amount.",
  },
  {
    title: "Match the picture and the point.",
    instruction:
      "Use the arrows on each layer. Match the shaded amount, then the point on the number line.",
    caption:
      "6 of 10 parts shaded. A point at three fifths. All three layers now show the same amount.",
  },
  {
    title: "Light your beacon!",
    instruction:
      "Press ‘Light the beacon’. Pip checks all three layers. If one needs another look, you can turn it and try again.",
    caption:
      "When all three show the target amount, the beacon lights and the next step opens.",
  },
];
const numberSteps = (story: boolean): TutorialStep[] => [
  {
    title: story
      ? "Choose a world. Read the story."
      : "Look at your math challenge.",
    instruction: story
      ? "Pick a world and press ‘Make my adventure’. Read the little story, or tap the speaker to hear it."
      : "Read the numbers and the sign. Tap the speaker if you would like to hear the challenge.",
    caption: story
      ? "Our example: Pip finds 2 berries, then 3 more. How many berries does Pip have?"
      : "Our example: 2 + 3 means 2 things and 3 more things. There are 5 altogether.",
  },
  {
    title: "Put your answer in the box.",
    instruction:
      "Tap a number on the keypad, or type in ‘Your answer’. The backspace key removes a digit.",
    caption: "We tap 5. It appears in the answer box, ready to check.",
  },
  {
    title: "Press the arrow to check.",
    instruction:
      "Tap the arrow at the bottom right of the keypad. It checks your answer.",
    caption:
      "The arrow means ‘Check answer’. 2 + 3 = 5, so our example answer is correct.",
  },
  {
    title: "Read Pip’s feedback, then go on.",
    instruction:
      "Look at the feedback. Press the next button to keep climbing. You can ask Pip for a nudge when you need one.",
    caption: story
      ? "Go at your own pace. Stories have no timer. A nudge can help you find a new way."
      : "Go at your own pace. The bonus clock never stops your play, and your earned progress stays safe.",
  },
];

function DemoBerry({ index = 0 }: { index?: number }) {
  return (
    <svg
      className="qt-berry"
      style={{ "--berry-order": index } as CSSProperties}
      viewBox="0 0 24 26"
      aria-hidden="true"
    >
      <path
        d="M12 8c-5-5-12 1-9 8 3 8 7 8 9 8s6 0 9-8c3-7-4-13-9-8Z"
        fill="#e8a09b"
      />
      <path d="m12 9-6-5 5 1 2-4 1 5 5-2-4 6Z" fill="#b7dc92" />
      <path
        d="m7 12 1 1m7 2 1-1m-4 5 1-1"
        stroke="#6e4247"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function DemoPointer() {
  return (
    <svg className="qt-pointer" viewBox="0 0 26 32" aria-hidden="true">
      <path
        d="M3 2v25l6-6 5 10 5-3-5-9h9Z"
        fill="#fff5d7"
        stroke="#28453f"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function DemoFraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="qt-fraction">
      <b>{n}</b>
      <b>{d}</b>
    </span>
  );
}
function DemoTower({
  teaching = false,
  step,
}: {
  teaching?: boolean;
  step: number;
}) {
  const n = teaching ? 1 : 6;
  const d = teaching ? 3 : 10;
  return (
    <div className={`qt-tower ${teaching ? "qt-teaching-tower" : ""}`}>
      <div
        className={`qt-beacon ${!teaching && step === 3 ? "qt-beacon-lit" : ""}`}
      >
        <Icon name="spark" size={26} />
      </div>
      <div
        className={`qt-ring ${step === 1 || teaching ? "qt-demo-focus" : ""}`}
      >
        <span className="qt-mock-arrow">‹</span>
        <div className="qt-fraction-switch">
          {(step === 1 || teaching) && (
            <span className="qt-before">
              <DemoFraction n={teaching ? 1 : 4} d={teaching ? 2 : 10} />
            </span>
          )}
          <span className={step === 1 || teaching ? "qt-after" : ""}>
            <DemoFraction n={step === 0 && !teaching ? 4 : n} d={d} />
          </span>
        </div>
        <span className="qt-mock-arrow qt-tap-target">
          ›{(step === 1 || teaching) && <DemoPointer />}
        </span>
      </div>
      <div className={`qt-ring ${step === 2 ? "qt-demo-focus" : ""}`}>
        <span className="qt-mock-arrow">‹</span>
        <div
          className={`qt-parts ${step === 2 ? "qt-parts-changing" : ""}`}
          style={{ gridTemplateColumns: `repeat(${d}, 1fr)` }}
        >
          {Array.from({ length: d }, (_, i) => (
            <i key={i} className={i < n ? "qt-shaded" : ""} />
          ))}
        </div>
        <span className="qt-mock-arrow">›</span>
      </div>
      <div className={`qt-ring ${step === 2 ? "qt-demo-focus" : ""}`}>
        <span className="qt-mock-arrow">‹</span>
        <div className="qt-numberline">
          <small>0</small>
          <i
            className={step === 2 ? "qt-point-changing" : ""}
            style={{ left: `${(n / d) * 100}%` }}
          />
          <small>1</small>
        </div>
        <span className="qt-mock-arrow qt-tap-target">
          ›{step === 2 && <DemoPointer />}
        </span>
      </div>
    </div>
  );
}
function TeachingExample({ step, ridge }: { step: number; ridge: boolean }) {
  if (step === 0)
    return (
      <div className="qt-teach-choose">
        <span className="qt-scene-label">6 BERRIES · 3 FRIENDS</span>
        <span className="qt-method-label">
          <Icon name={ridge ? "spark" : "flag"} size={17} />
          {ridge ? "A share of the whole" : "An amount for each"}
        </span>
        {ridge ? (
          <DemoTower teaching step={0} />
        ) : (
          <div className="qt-fixed-plan">
            <span>Give</span>
            <div className="qt-stepper">
              <span>−</span>
              <strong className="qt-number-switch">
                <i className="qt-before">1</i>
                <i className="qt-after">2</i>
              </strong>
              <span className="qt-tap-target qt-demo-focus">
                +<DemoPointer />
              </span>
            </div>
            <span>berries to each friend.</span>
          </div>
        )}
        <span className="qt-example-action qt-confirm-example qt-tap-target">
          Use this teaching <Icon name="check" size={16} />
          <DemoPointer />
        </span>
      </div>
    );
  if (step === 1)
    return (
      <div className="qt-prediction-example">
        <div className="qt-owl">
          <Owl />
          <span>What would a fair share be?</span>
        </div>
        <span className="qt-scene-label">6 BERRIES · 3 FRIENDS</span>
        <div className="qt-example-select qt-tap-target qt-demo-focus">
          <span className="qt-before">Choose your prediction</span>
          <span className="qt-after">2 berries each</span>
          <b>⌄</b>
          <DemoPointer />
        </div>
        <span className="qt-example-note">Think first. Then let Pip try.</span>
      </div>
    );
  if (step === 2)
    return (
      <div className="qt-share-example">
        <span className="qt-example-action qt-tap-target qt-demo-focus">
          Let Pip try this <Icon name="play" size={17} />
          <DemoPointer />
        </span>
        <div className="qt-basket">
          <span>Basket</span>
          <div className="qt-basket-berries">
            {Array.from({ length: 6 }, (_, i) => (
              <DemoBerry index={i} key={i} />
            ))}
          </div>
          <b className="qt-empty-basket">Empty ✓</b>
        </div>
        <div className="qt-friends">
          {["Pip", "Moss", "Wren"].map((name, i) => (
            <div
              className="qt-friend"
              style={{ "--friend-order": i } as CSSProperties}
              key={name}
            >
              <Owl />
              <span>{name}</span>
              <div className="qt-bowl">
                <DemoBerry />
                <DemoBerry />
                <b>2</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="qt-teach-finish">
      <div className="qt-success-seal">
        <Icon name="check" size={28} />
      </div>
      <strong>Same shares. Empty basket.</strong>
      <div className="qt-result-bowls">
        {["Pip", "Moss", "Wren"].map((name) => (
          <div key={name}>
            <DemoBerry />
            <DemoBerry />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <span className="qt-example-action">
        Continue the climb <Icon name="arrow" size={17} />
      </span>
      <span className="qt-world-change">
        <Icon name={ridge ? "mountain" : "leaf"} size={21} />
        {ridge ? "A new basket is coming…" : "A new friend is coming…"}
      </span>
    </div>
  );
}
function FractionExample({ step }: { step: number }) {
  return (
    <div className="qt-fraction-example">
      <div className={`qt-target ${step === 0 ? "qt-demo-focus" : ""}`}>
        <span>MATCH THIS</span>
        <DemoFraction n={3} d={5} />
        <div className="qt-target-parts">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={i < 3 ? "qt-shaded" : ""} />
          ))}
        </div>
      </div>
      <DemoTower step={step} />
      {step === 3 && (
        <span className="qt-example-action qt-tap-target qt-demo-focus">
          Light the beacon <Icon name="spark" size={17} />
          <DemoPointer />
        </span>
      )}
    </div>
  );
}
function ArithmeticExample({ step, story }: { step: number; story: boolean }) {
  if (step === 3)
    return (
      <div className="qt-number-finish">
        <div className="qt-success-seal">
          <Icon name="check" size={28} />
        </div>
        <strong>That’s right!</strong>
        <p>2 + 3 = 5</p>
        <span className="qt-example-action">
          Next stepping stone <Icon name="arrow" size={18} />
        </span>
        <span className="qt-help-example">
          <Owl />A nudge is here if you need it.
        </span>
      </div>
    );
  return (
    <div className="qt-number-example">
      {story && step === 0 ? (
        <div className="qt-story-example">
          <Icon name="leaf" size={24} />
          <p>
            Pip finds <b>2 berries</b>, then <b>3 more</b>. How many altogether?
          </p>
          <span>
            <Icon name="sound" size={18} />
            Listen
          </span>
        </div>
      ) : (
        <span className="qt-equation">2 + 3 = ?</span>
      )}
      {step === 0 ? (
        <div className="qt-counting">
          <span>
            <DemoBerry />
            <DemoBerry />
          </span>
          <b>+</b>
          <span>
            <DemoBerry />
            <DemoBerry />
            <DemoBerry />
          </span>
          <strong>= 5</strong>
        </div>
      ) : (
        <>
          <div className={`qt-answer ${step === 2 ? "qt-answer-correct" : ""}`}>
            <span className="qt-before">Your answer</span>
            <strong className="qt-after">
              5{step === 2 && <Icon name="check" size={18} />}
            </strong>
          </div>
          <div className="qt-keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "→"].map(
              (key) => (
                <span
                  key={key}
                  className={
                    (step === 1 && key === "5") || (step === 2 && key === "→")
                      ? "qt-tap-target qt-demo-focus"
                      : ""
                  }
                >
                  {key}
                  {((step === 1 && key === "5") ||
                    (step === 2 && key === "→")) && <DemoPointer />}
                </span>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** A local, authored demonstration. It never reads or changes a learner's activity. */
export function QuickTutorial({
  kind,
  onClose,
  reducedMotion = false,
}: {
  kind: TutorialKind;
  onClose: () => void;
  reducedMotion?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [replay, setReplay] = useState(0);
  const teaching = kind === "teaching-ridge" || kind === "teaching-meadow";
  const steps = teaching
    ? teachingSteps(kind === "teaching-ridge")
    : kind === "fraction"
      ? fractionSteps
      : numberSteps(kind === "story");
  useEffect(() => {
    setStep(0);
    setReplay(0);
  }, [kind]);
  const current = steps[step];
  const last = step === steps.length - 1;
  function moveTo(next: number) {
    setStep(next);
    setReplay(0);
  }
  return (
    <Modal
      title={
        teaching ? "Let’s teach Pip together" : "Let’s try a little example"
      }
      onClose={onClose}
    >
      <div
        className={`quick-tutorial ${reducedMotion ? "qt-reduced-motion" : ""}`}
      >
        <div className="qt-intro">
          <span>
            <Icon name="compass" size={15} />
            Practice example — not saved
          </span>
          <b>
            {step + 1} of {steps.length}
          </b>
        </div>
        <div className="qt-step-copy" aria-live="polite" aria-atomic="true">
          <h3>{current.title}</h3>
          <p>{current.instruction}</p>
        </div>
        <figure
          className={`qt-demo qt-kind-${kind} qt-step-${step}`}
          key={`${kind}-${step}-${replay}`}
        >
          <div
            className="qt-demo-screen"
            role="img"
            aria-label={current.caption}
          >
            <div aria-hidden="true">
              {teaching ? (
                <TeachingExample
                  step={step}
                  ridge={kind === "teaching-ridge"}
                />
              ) : kind === "fraction" ? (
                <FractionExample step={step} />
              ) : (
                <ArithmeticExample step={step} story={kind === "story"} />
              )}
            </div>
          </div>
          <figcaption>{current.caption}</figcaption>
        </figure>
        <div className="qt-demonstration-controls">
          <span>
            {last
              ? "Ready to try? Tap I’m ready."
              : "Watch the example, then tap Next."}
          </span>
          <button
            type="button"
            onClick={() => setReplay((v) => v + 1)}
            aria-label="Replay this step’s demonstration"
          >
            <Icon name="refresh" size={16} />
            Replay
          </button>
        </div>
        <nav className="qt-step-navigation" aria-label="Tutorial steps">
          {steps.map((s, i) => (
            <button
              type="button"
              key={s.title}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={step === i ? "step" : undefined}
              onClick={() => moveTo(i)}
            >
              <span>{i < step ? <Icon name="check" size={12} /> : i + 1}</span>
            </button>
          ))}
        </nav>
        <div className="qt-actions">
          <Button
            secondary
            onClick={() => moveTo(step - 1)}
            disabled={step === 0}
          >
            <Icon name="back" size={17} />
            Back
          </Button>
          <Button onClick={last ? onClose : () => moveTo(step + 1)}>
            {last ? "I’m ready" : "Next step"}
            <Icon name={last ? "check" : "arrow"} size={17} />
          </Button>
        </div>
        <button className="qt-skip" type="button" onClick={onClose}>
          Skip for now
        </button>
      </div>
    </Modal>
  );
}

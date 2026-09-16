export type Fraction = { n: number; d: number };

export type TowerLevel = {
  id: string;
  target: Fraction;
  subtitle: string;
  choices: [Fraction[], Fraction[], Fraction[]];
};

export type EvidenceRecord = {
  id: string;
  kind: "tower" | "check";
  correct: boolean;
  assisted: boolean;
  attempts: number;
};

export const LEVELS: TowerLevel[] = [
  {
    id: "halves",
    target: { n: 1, d: 2 },
    subtitle: "Different pieces. The same half.",
    choices: [
      [
        { n: 1, d: 4 },
        { n: 2, d: 4 },
        { n: 3, d: 4 },
        { n: 1, d: 8 },
      ],
      [
        { n: 1, d: 6 },
        { n: 2, d: 8 },
        { n: 3, d: 6 },
        { n: 5, d: 6 },
      ],
      [
        { n: 3, d: 8 },
        { n: 5, d: 8 },
        { n: 7, d: 8 },
        { n: 4, d: 8 },
      ],
    ],
  },
  {
    id: "quarters",
    target: { n: 1, d: 4 },
    subtitle: "More equal parts. The same quarter.",
    choices: [
      [
        { n: 1, d: 2 },
        { n: 3, d: 4 },
        { n: 2, d: 8 },
        { n: 3, d: 8 },
      ],
      [
        { n: 1, d: 8 },
        { n: 3, d: 12 },
        { n: 5, d: 8 },
        { n: 7, d: 12 },
      ],
      [
        { n: 3, d: 4 },
        { n: 2, d: 4 },
        { n: 1, d: 4 },
        { n: 5, d: 8 },
      ],
    ],
  },
  {
    id: "three-quarters",
    target: { n: 3, d: 4 },
    subtitle: "Follow the amount all the way to the summit.",
    choices: [
      [
        { n: 1, d: 4 },
        { n: 2, d: 4 },
        { n: 5, d: 8 },
        { n: 6, d: 8 },
      ],
      [
        { n: 3, d: 8 },
        { n: 6, d: 12 },
        { n: 9, d: 12 },
        { n: 10, d: 12 },
      ],
      [
        { n: 2, d: 8 },
        { n: 3, d: 4 },
        { n: 4, d: 8 },
        { n: 7, d: 8 },
      ],
    ],
  },
];

export const CHECKS: {
  id: string;
  prompt: string;
  target: Fraction;
  choices: Fraction[];
  correctIndex: number;
  explanation: string;
}[] = [
  {
    id: "transfer-two-thirds",
    prompt: "Which fraction has the same value as two thirds?",
    target: { n: 2, d: 3 },
    choices: [
      { n: 2, d: 12 },
      { n: 4, d: 6 },
      { n: 3, d: 10 },
      { n: 5, d: 12 },
    ],
    correctIndex: 1,
    explanation:
      "Split each third into two equal pieces. Two filled thirds become four filled sixths; the amount stays the same.",
  },
  {
    id: "transfer-one-third",
    prompt: "Which fraction has the same value as one third?",
    target: { n: 1, d: 3 },
    choices: [
      { n: 3, d: 5 },
      { n: 5, d: 10 },
      { n: 4, d: 12 },
      { n: 7, d: 10 },
    ],
    correctIndex: 2,
    explanation:
      "Split each third into four equal pieces. One filled third becomes four filled twelfths; both mark the same point on a number line.",
  },
];

function validFraction(fraction: Fraction): boolean {
  return (
    Boolean(fraction) &&
    Number.isSafeInteger(fraction.n) &&
    Number.isSafeInteger(fraction.d) &&
    fraction.d > 0
  );
}

/** Integer cross products avoid rounding when comparing representations. */
export function equivalent(a: Fraction, b: Fraction): boolean {
  if (!validFraction(a) || !validFraction(b)) return false;
  return BigInt(a.n) * BigInt(b.d) === BigInt(b.n) * BigInt(a.d);
}

export function isTowerCorrect(level: TowerLevel, indices: number[]): boolean {
  return (
    indices.length === level.choices.length &&
    level.choices.every((row, rowIndex) => {
      const index = indices[rowIndex];
      return (
        Number.isInteger(index) &&
        index >= 0 &&
        index < row.length &&
        equivalent(row[index], level.target)
      );
    })
  );
}

/** Offer a strategy for the first mismatched representation, without naming its answer. */
export function getHint(level: TowerLevel, indices: number[]): string {
  const mismatch = level.choices.findIndex((row, rowIndex) => {
    const index = indices[rowIndex];
    return (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= row.length ||
      !equivalent(row[index], level.target)
    );
  });
  if (mismatch === 0) {
    const selected = level.choices[0][indices[0]];
    if (
      selected &&
      selected.n === level.target.n &&
      selected.d !== level.target.d
    ) {
      return "Start with the fraction ring. The same top number can describe different amounts: more equal pieces means each piece is smaller.";
    }
    return "Start with the fraction ring. Multiplying the top and bottom by the same number changes the pieces, but keeps the amount.";
  }
  if (mismatch === 1) {
    return "Look at the shaded ring. Keep the whole the same size, count its equal parts, and compare the shaded amount with the target.";
  }
  if (mismatch === 2) {
    return "Look at the number-line ring. Use the ends as anchors, then compare how far the target and the marked point are from the start.";
  }
  return "All three representations match. Think about why the number of pieces can change while the amount stays the same.";
}

/** Each item counts once; hints and retries never become independent evidence. */
export function summary(records: EvidenceRecord[]): {
  towers: number;
  independentChecks: number;
  checkCount: number;
  supported: number;
} {
  const items = new Map<
    string,
    {
      kind: EvidenceRecord["kind"];
      correct: boolean;
      supported: boolean;
    }
  >();
  for (const record of records) {
    if (
      !record.id ||
      !Number.isSafeInteger(record.attempts) ||
      record.attempts < 1
    )
      continue;
    const key = `${record.kind}:${record.id}`;
    const previous = items.get(key);
    items.set(key, {
      kind: record.kind,
      correct: Boolean(previous?.correct || record.correct),
      supported: Boolean(
        previous?.supported ||
          record.assisted ||
          record.attempts > 1 ||
          !record.correct,
      ),
    });
  }
  const result = {
    towers: 0,
    independentChecks: 0,
    checkCount: 0,
    supported: 0,
  };
  for (const item of items.values()) {
    if (item.kind === "tower" && item.correct) result.towers += 1;
    if (item.kind === "check") {
      result.checkCount += 1;
      if (item.correct && !item.supported) result.independentChecks += 1;
    }
    if (item.correct && item.supported) result.supported += 1;
  }
  return result;
}

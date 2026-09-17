import type { HomeworkSet, Slip } from "./homework";

/** Completed worksheets are observations, separate from expedition RunRecords. */
export interface HomeworkEvidence {
  id: string;
  skill_id: string;
  skill_name: string;
  level: number;
  created_at: number;
  completed_at: number | null;
  problems: HomeworkSet["problems"];
  reasons: HomeworkSet["reasons"];
  response: {
    spotted_index: number;
    reason: Slip | "none";
    fixed_answer: number;
  } | null;
  result: {
    spotted: boolean;
    explained: boolean;
    fixed: boolean;
    wrong_index: number;
    correct_answer: number;
    slip: Slip;
  };
}

export interface HomeworkEvidencePage {
  worksheets: HomeworkEvidence[];
  total: number;
  limit: number;
}

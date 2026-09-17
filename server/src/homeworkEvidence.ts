import { db } from "./db.js";
import { SKILLS } from "./skills.js";
import type { HomeworkSet } from "../../shared/homework.js";
import type {
  HomeworkEvidence,
  HomeworkEvidencePage,
} from "../../shared/homeworkEvidence.js";

const LIMIT = 100;
type Row = {
  id: string;
  skill_id: string;
  level: number;
  created_at: number;
  set_json: string;
  result: string;
};

/** Never read keys for an unfinished worksheet or manufacture missing responses. */
export function readHomeworkEvidence(learnerId: string): HomeworkEvidencePage {
  const total = (
    db
      .prepare(
        "SELECT COUNT(*) n FROM homework_sets WHERE learner_id=? AND result IS NOT NULL",
      )
      .get(learnerId) as { n: number }
  ).n;
  const rows = db
    .prepare(
      "SELECT id,skill_id,level,created_at,set_json,result FROM homework_sets WHERE learner_id=? AND result IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT ?",
    )
    .all(learnerId, LIMIT) as Row[];
  return {
    total,
    limit: LIMIT,
    worksheets: rows.map((row): HomeworkEvidence => {
      const set = JSON.parse(row.set_json) as HomeworkSet;
      const result = JSON.parse(row.result) as HomeworkEvidence["result"] & {
        response?: HomeworkEvidence["response"];
        completed_at?: number;
      };
      return {
        id: row.id,
        skill_id: row.skill_id,
        skill_name:
          SKILLS.find((skill) => skill.id === row.skill_id)?.name ??
          row.skill_id,
        level: row.level,
        created_at: row.created_at,
        completed_at: result.completed_at ?? null,
        problems: set.problems,
        reasons: set.reasons,
        response: result.response ?? null,
        result: {
          spotted: result.spotted,
          explained: result.explained,
          fixed: result.fixed,
          wrong_index: result.wrong_index,
          correct_answer: result.correct_answer,
          slip: result.slip,
        },
      };
    }),
  };
}

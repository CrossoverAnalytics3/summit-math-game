export type Skill = {
  id: string;
  name: string;
  grade: string;
  op: string;
  tip: string;
  level: number;
  run: number;
  high_score: number;
  wins: number;
  seconds: number;
};
export type Home = {
  learner: { display_name: string; age: number; daily_streak: number };
  today: string;
  comeback: { due: boolean; days_away: number; freeze_available: boolean };
  run_to_unlock: number;
  max_level: number;
  story_missions_enabled: boolean;
  guardian_consent_ai?: boolean;
  skills: Skill[];
};
export type Preferences = {
  sound: boolean;
  motion: boolean;
  contrast: boolean;
};
export type Problem = {
  id: string;
  skill_id: string;
  level: number;
  op: string;
  a: number;
  b: number;
  prompt: string;
  story?: string;
};
export type Provenance = {
  provider: string;
  prompt_version: string;
  fields_sent: string[];
  checks: { name: string; passed: boolean; detail?: string }[];
  final_source: string;
};

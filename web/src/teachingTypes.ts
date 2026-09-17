export type TeachingPage =
  | "home"
  | "routes"
  | "play"
  | "summit"
  | "journal"
  | "legacy";
export type StepGuide = {
  step: number;
  title: string;
  text: string;
  target: string | null;
  action: string;
};

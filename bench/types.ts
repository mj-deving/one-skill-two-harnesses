export type Verdict = { pass: boolean; reason: string };
export type Task = {
  id: string;
  skill: string;
  heldout: boolean;
  prompt: string;
  files: Record<string, string>;
  check: (dir: string) => Verdict | Promise<Verdict>;
};

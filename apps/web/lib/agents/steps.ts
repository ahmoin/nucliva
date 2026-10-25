// Imported by client code too, so keep this file free of imports.
export const STEPS = [
  { key: "plan", label: "Planning the files" },
  { key: "research", label: "Researching on the web" },
  { key: "voice", label: "Matching your voice" },
  { key: "doc", label: "Writing the doc" },
  { key: "sheet", label: "Building the sheet" },
  { key: "deck", label: "Building the deck" },
  { key: "link", label: "Linking the files" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export interface AgentStep {
  detail?: string;
  key: StepKey;
  label: string;
  status: "done" | "failed" | "running" | "waiting";
}

export type RunStatus = "done" | "failed" | "queued" | "running";

export interface RunFile {
  href: string;
  id: string;
  kind: "doc" | "sheet" | "slides";
  title: string;
}

export interface AgentRunView {
  createdAt: string;
  error: string | null;
  files: RunFile[];
  id: string;
  jobState: string | null;
  prompt: string;
  runner: "local" | "nebius";
  status: RunStatus;
  steps: AgentStep[];
  title: string | null;
}

export const fileHref = (kind: RunFile["kind"], id: string) =>
  ({
    doc: `/dashboard/docs/${id}`,
    sheet: `/dashboard/sheets/${id}`,
    slides: `/dashboard/presentations/${id}`,
  })[kind];

export const waitingSteps = (): AgentStep[] =>
  STEPS.map((step) => ({ ...step, status: "waiting" }));

import { RunCard } from "@/components/agent-console";
import type { AgentRunView } from "@/lib/agents/steps";

const run: AgentRunView = {
  createdAt: "2026-10-01T00:00:00.000Z",
  error: null,
  files: [
    { href: "/signup", id: "doc", kind: "doc", title: "Q3 investor update" },
    {
      href: "/signup",
      id: "sheet",
      kind: "sheet",
      title: "Q3 investor update figures",
    },
    {
      href: "/signup",
      id: "deck",
      kind: "slides",
      title: "Q3 investor update deck",
    },
  ],
  id: "preview",
  jobState: null,
  prompt: "Q3 investor update for a seed-stage SaaS startup",
  runner: "nebius",
  status: "done",
  steps: [
    {
      detail: "Q3 investor update",
      key: "plan",
      label: "Planning the files",
      status: "done",
    },
    {
      detail: "8 sources from 3 searches",
      key: "research",
      label: "Researching on the web",
      status: "done",
    },
    {
      detail: "From 8 passages of your writing",
      key: "voice",
      label: "Matching your voice",
      status: "done",
    },
    { detail: "640 words", key: "doc", label: "Writing the doc", status: "done" },
    { detail: "12 rows", key: "sheet", label: "Building the sheet", status: "done" },
    { detail: "7 slides", key: "deck", label: "Building the deck", status: "done" },
    {
      detail: "Waiting for you to accept",
      key: "link",
      label: "Linking the files",
      status: "done",
    },
  ],
  title: "Q3 investor update",
};

export function SuitePreview() {
  return <RunCard run={run} />;
}

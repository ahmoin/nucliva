"use client";

import {
  CheckIcon,
  CircleIcon,
  CloudIcon,
  FileTextIcon,
  PresentationChartIcon,
  RobotIcon,
  TableIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type OrbState, ThinkingOrb } from "thinking-orbs";
import { EmptyState } from "@/components/empty-state";
import { TourCount } from "@/components/tour-count";
import type {
  AgentRunView,
  AgentStep,
  RunFile,
  StepKey,
} from "@/lib/agents/steps";

const POLL_EVERY = 2500;

const starters = [
  "Q3 investor update for a seed-stage SaaS startup",
  "Competitor brief: Notion vs Coda vs Craft",
  "Launch plan for our new usage-based pricing",
];

const orbs: Record<StepKey, OrbState> = {
  deck: "shaping",
  doc: "composing",
  link: "connecting",
  plan: "solving",
  research: "searching",
  sheet: "weaving",
  voice: "listening",
};

const fileIcons = {
  doc: FileTextIcon,
  sheet: TableIcon,
  slides: PresentationChartIcon,
};

const fileLabels = { doc: "Doc", sheet: "Sheet", slides: "Deck" };

const isOpen = (run: AgentRunView) =>
  run.status === "queued" || run.status === "running";

const jobWaits: Record<string, string> = {
  IMAGE_PULLING: "Loading the agent onto it",
  PROVISIONING: "Finding a Nebius machine",
  STARTING: "Starting the machine",
};

function StepRow({ step }: { step: AgentStep }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center">
        {step.status === "running" ? (
          <ThinkingOrb aria-hidden="true" size={20} state={orbs[step.key]} />
        ) : null}
        {step.status === "done" ? (
          <CheckIcon className="size-4 text-primary" weight="bold" />
        ) : null}
        {step.status === "failed" ? (
          <XIcon className="size-4 text-destructive" weight="bold" />
        ) : null}
        {step.status === "waiting" ? (
          <CircleIcon className="size-3 text-muted-foreground/50" />
        ) : null}
      </span>
      <div className="flex min-w-0 flex-col">
        <span
          className={
            step.status === "waiting" ? "text-muted-foreground" : "text-foreground"
          }
        >
          {step.label}
        </span>
        {step.detail ? (
          <span className="truncate text-muted-foreground text-xs">
            {step.detail}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function FileLink({ file }: { file: RunFile }) {
  const Icon = fileIcons[file.kind];

  return (
    <Button
      className="justify-start normal-case tracking-normal"
      nativeButton={false}
      render={<Link href={file.href} />}
      size="sm"
      variant="outline"
    >
      <Icon />
      <span className="truncate">{file.title}</span>
      <span className="text-muted-foreground">{fileLabels[file.kind]}</span>
    </Button>
  );
}

export function RunCard({ run }: { run: AgentRunView }) {
  const waiting =
    run.status === "queued" && run.jobState ? jobWaits[run.jobState] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="normal-case tracking-tight">
          {run.title ?? run.prompt}
        </CardTitle>
        <CardDescription className="line-clamp-2">{run.prompt}</CardDescription>
        <CardAction>
          <Badge variant="outline">
            {run.runner === "nebius" ? <CloudIcon /> : null}
            {run.runner === "nebius" ? "Nebius Serverless" : "Nucliva server"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {waiting ? (
          <p className="flex items-center gap-3 text-muted-foreground text-sm">
            <ThinkingOrb aria-hidden="true" size={20} state="connecting" />
            {waiting}
          </p>
        ) : null}
        <ol className="flex flex-col gap-3 text-sm">
          {run.steps.map((step) => (
            <StepRow key={step.key} step={step} />
          ))}
        </ol>
        {run.error ? (
          <p className="flex items-center gap-2 text-destructive text-sm">
            <WarningIcon />
            {run.error}
          </p>
        ) : null}
      </CardContent>
      {run.files.length > 0 ? (
        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap">
          {run.files.map((file) => (
            <FileLink file={file} key={file.id} />
          ))}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function AgentConsole({ initialRuns }: { initialRuns: AgentRunView[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [prompt, setPrompt] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openIds = runs
    .filter(isOpen)
    .map((run) => run.id)
    .join(",");

  useEffect(() => {
    if (!openIds) {
      return;
    }

    const timer = setInterval(async () => {
      const updates = await Promise.all(
        openIds.split(",").map(async (id) => {
          try {
            const response = await fetch(`/api/agents/${id}`);

            return response.ok ? ((await response.json()) as AgentRunView) : null;
          } catch {
            return null;
          }
        })
      );

      setRuns((previous) =>
        previous.map(
          (run) => updates.find((update) => update?.id === run.id) ?? run
        )
      );
    }, POLL_EVERY);

    return () => clearInterval(timer);
  }, [openIds]);

  const start = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const text = prompt.trim();

      if (!text || starting) {
        return;
      }

      setStarting(true);
      setError(null);

      try {
        const response = await fetch("/api/agents", {
          body: JSON.stringify({ prompt: text }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = (await response.json()) as { error?: string; id?: string };

        if (!(response.ok && data.id)) {
          throw new Error(data.error ?? "Could not start the agent.");
        }

        const created = await fetch(`/api/agents/${data.id}`);

        if (created.ok) {
          const run = (await created.json()) as AgentRunView;

          setRuns((previous) => [run, ...previous]);
        }

        setPrompt("");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not start the agent."
        );
      } finally {
        setStarting(false);
      }
    },
    [prompt, starting]
  );

  return (
    <div className="flex flex-col gap-6">
      <TourCount runs={runs.length} />
      <Card data-tour="new-suite">
        <CardHeader>
          <CardTitle>New suite</CardTitle>
          <CardDescription>
            Say what you need. The agent plans it, searches the web with Tavily,
            and writes a linked doc, sheet and deck with the same facts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={start}>
            <Textarea
              aria-label="What should the agent make?"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Q3 investor update"
              value={prompt}
            />
            <div className="flex flex-wrap gap-2">
              {starters.map((starter) => (
                <Button
                  className="normal-case tracking-normal"
                  key={starter}
                  onClick={() => setPrompt(starter)}
                  size="xs"
                  type="button"
                  variant="secondary"
                >
                  {starter}
                </Button>
              ))}
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button
              className="self-end"
              disabled={!prompt.trim() || starting}
              type="submit"
            >
              {starting ? "Starting..." : "Run agent"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {runs.length > 0 ? (
        <div className="grid gap-4 @4xl:grid-cols-2">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Runs you start show up here, with each step as it happens."
          icon={RobotIcon}
          title="No runs yet"
        />
      )}
    </div>
  );
}

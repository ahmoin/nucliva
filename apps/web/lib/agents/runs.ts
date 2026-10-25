import { db } from "@workspace/db";
import { agentRuns, documents } from "@workspace/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import {
  ENDED_STATES,
  agentJobState,
} from "@/lib/agents/nebius-jobs";
import {
  type AgentRunView,
  type AgentStep,
  fileHref,
  type RunFile,
  waitingSteps,
} from "@/lib/agents/steps";

type Run = typeof agentRuns.$inferSelect;

async function filesOf(runIds: string[]) {
  if (runIds.length === 0) {
    return new Map<string, RunFile[]>();
  }

  const rows = await db
    .select({
      id: documents.id,
      kind: documents.kind,
      runId: documents.runId,
      title: documents.title,
    })
    .from(documents)
    .where(and(inArray(documents.runId, runIds), isNull(documents.deletedAt)));
  const byRun = new Map<string, RunFile[]>();
  const order = { doc: 0, note: 0, sheet: 1, slides: 2 };

  for (const row of rows.sort((a, b) => order[a.kind] - order[b.kind])) {
    if (!row.runId || row.kind === "note") {
      continue;
    }

    byRun.set(row.runId, [
      ...(byRun.get(row.runId) ?? []),
      { href: fileHref(row.kind, row.id), id: row.id, kind: row.kind, title: row.title },
    ]);
  }

  return byRun;
}

const view = (
  run: Run,
  files: RunFile[],
  jobState: string | null = null
): AgentRunView => ({
  createdAt: run.createdAt.toISOString(),
  error: run.error,
  files,
  id: run.id,
  jobState,
  prompt: run.prompt,
  runner: run.runner,
  status: run.status,
  steps:
    (run.steps as AgentStep[]).length > 0
      ? (run.steps as AgentStep[])
      : waitingSteps(),
  title: run.title,
});

export async function listRuns(userId: string, limit = 20) {
  const runs = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.userId, userId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(limit);
  const files = await filesOf(runs.map((run) => run.id));

  return runs.map((run) => view(run, files.get(run.id) ?? []));
}

export async function getRun(userId: string, id: string) {
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(and(eq(agentRuns.id, id), eq(agentRuns.userId, userId)))
    .limit(1);

  if (!run) {
    return null;
  }

  let current = run;
  let jobState: string | null = null;
  const open = run.status === "queued" || run.status === "running";

  if (open && run.runner === "nebius" && run.jobId) {
    jobState = await agentJobState(run.jobId).catch(() => null);

    if (jobState && ENDED_STATES.has(jobState)) {
      const [failed] = await db
        .update(agentRuns)
        .set({
          error:
            jobState === "COMPLETED"
              ? "The agent stopped before it finished."
              : `The Nebius job ended with ${jobState.toLowerCase()}.`,
          status: "failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentRuns.id, run.id),
            inArray(agentRuns.status, ["queued", "running"])
          )
        )
        .returning();
      // No row updated means the run finished meanwhile, so re-read it.
      const [latest] = failed
        ? [failed]
        : await db
            .select()
            .from(agentRuns)
            .where(eq(agentRuns.id, run.id))
            .limit(1);

      current = latest ?? run;
    }
  }

  const files = await filesOf([run.id]);

  return view(current, files.get(run.id) ?? [], jobState);
}

export async function siblingsOf(userId: string, runId: string | null) {
  if (!runId) {
    return [];
  }

  const [run] = await db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(and(eq(agentRuns.id, runId), eq(agentRuns.userId, userId)))
    .limit(1);

  return run ? ((await filesOf([runId])).get(runId) ?? []) : [];
}

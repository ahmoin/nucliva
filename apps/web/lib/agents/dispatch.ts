import { db } from "@workspace/db";
import { agentRuns } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import {
  createAgentJob,
  nebiusJobsConfigured,
} from "@/lib/agents/nebius-jobs";
import { runSuite } from "@/lib/agents/suite";

export async function dispatchRun(runId: string) {
  if (nebiusJobsConfigured()) {
    try {
      const jobId = await createAgentJob(runId);

      await db
        .update(agentRuns)
        .set({ jobId, runner: "nebius", updatedAt: new Date() })
        .where(eq(agentRuns.id, runId));

      return;
    } catch (error) {
      console.error("Nebius job failed to start, running here:", error);
    }
  }

  after(() => runSuite(runId));
}

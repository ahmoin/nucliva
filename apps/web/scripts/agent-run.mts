// What a Nebius Serverless job runs: one suite agent run, then it stops. The
// run to do is in RUN_ID, and the keys it needs are in the environment.
//
//   RUN_ID=<id> tsx scripts/agent-run.mts      from apps/web
import { runSuite } from "@/lib/agents/suite";

const runId = process.env.RUN_ID ?? process.argv[2];

if (!runId) {
  console.error("RUN_ID is not set.");
  process.exit(1);
}

const finished = await runSuite(runId);

// The database pool would keep the process open.
process.exit(finished ? 0 : 1);

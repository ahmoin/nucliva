import { db } from "@workspace/db";
import { agentRuns } from "@workspace/db/schema";
import { headers } from "next/headers";
import { dispatchRun } from "@/lib/agents/dispatch";
import { listRuns } from "@/lib/agents/runs";
import { waitingSteps } from "@/lib/agents/steps";
import { auth } from "@/lib/auth/server";
import { limitGuest } from "@/lib/rate-limit";

// A run that is not sent to Nebius goes on here after the response, for as
// long as the platform lets a function live.
export const maxDuration = 300;

const MAX_PROMPT = 2000;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ runs: await listRuns(session.user.id) });
}

// Starts a suite agent: a doc, a sheet and a deck made together.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = limitGuest(session, "agent", 2);

  if (limited) {
    return limited;
  }

  const body = await request.json().catch(() => null);
  const prompt =
    typeof body?.prompt === "string"
      ? body.prompt.trim().slice(0, MAX_PROMPT)
      : "";

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const [run] = await db
    .insert(agentRuns)
    .values({ prompt, steps: waitingSteps(), userId: session.user.id })
    .returning({ id: agentRuns.id });

  if (!run) {
    return Response.json({ error: "Could not start" }, { status: 500 });
  }

  await dispatchRun(run.id);

  return Response.json({ id: run.id }, { status: 201 });
}

import { headers } from "next/headers";
import { getRun } from "@/lib/agents/runs";
import { auth } from "@/lib/auth/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await getRun(session.user.id, (await params).id);

  if (!run) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(run);
}

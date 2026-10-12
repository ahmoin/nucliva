import { headers } from "next/headers";
import { wantsCitations, wantsResearch } from "@/lib/ai/research-intent";
import { suggestEdits, type Turn } from "@/lib/ai/style-engine";
import type { Source } from "@/lib/ai/tavily";
import { auth } from "@/lib/auth/server";
import { limitGuest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = limitGuest(session, "draft", 20);

  if (limited) {
    return limited;
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  // A request that asks for research is grounded in a web search, unless the
  // caller says one way or the other. A caller that has already searched, as
  // the editor does to show progress, sends what it found.
  const research =
    typeof body?.research === "boolean" ? body.research : wantsResearch(prompt);
  const sources: Source[] | undefined = Array.isArray(body?.sources)
    ? body.sources.filter(
        (source: Partial<Source>) =>
          typeof source?.url === "string" &&
          typeof source.title === "string" &&
          typeof source.content === "string"
      )
    : undefined;
  const blocks: string[] = Array.isArray(body?.blocks)
    ? body.blocks.filter((block: unknown) => typeof block === "string")
    : [];
  const history: Turn[] = Array.isArray(body?.history)
    ? body.history.filter(
        (turn: Partial<Turn>) =>
          (turn?.role === "user" || turn?.role === "assistant") &&
          typeof turn.text === "string"
      )
    : [];
  const result = await suggestEdits({
    blocks,
    cite: wantsCitations(prompt),
    history,
    prompt,
    research,
    sources,
    userId: session.user.id,
  });

  return Response.json(result);
}

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { searchWeb } from "@/lib/tavily";

// The search a research draft is written from. It is its own request so the
// editor can show what was found while the draft is still being written.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    return Response.json({ error: null, sources: await searchWeb(query) });
  } catch (error) {
    console.error("research failed:", error);

    return Response.json({
      error: "Web search is unavailable, so this draft has no sources.",
      sources: [],
    });
  }
}

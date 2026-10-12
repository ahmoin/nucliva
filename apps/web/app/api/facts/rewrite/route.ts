import { headers } from "next/headers";
import { rewriteSentence } from "@/lib/ai/read-facts";
import { auth } from "@/lib/auth/server";
import { limitGuest } from "@/lib/rate-limit";

const MAX_SENTENCE = 800;

// Makes one sentence true again after a fact it leans on has changed. As with
// reading facts, the text is never logged.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = limitGuest(session, "facts", 80);

  if (limited) {
    return limited;
  }

  const body = await request.json().catch(() => null);
  const text = (value: unknown, max: number) =>
    typeof value === "string" && value.length <= max ? value.trim() : "";
  const sentence = text(body?.sentence, MAX_SENTENCE);
  const label = text(body?.label, 120);
  const from = text(body?.from, 80);
  const to = text(body?.to, 80);

  if (!(sentence && label && from && to)) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    return Response.json({
      sentence: await rewriteSentence({ from, label, sentence, to }),
    });
  } catch (error) {
    console.error(
      "facts rewrite failed:",
      error instanceof Error ? error.name : "unknown"
    );

    return Response.json({ error: "Could not rewrite" }, { status: 502 });
  }
}

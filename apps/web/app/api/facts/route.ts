import { headers } from "next/headers";
import { extractFacts } from "@/lib/ai/read-facts";
import { auth } from "@/lib/auth/server";
import type { Fact } from "@/lib/editor/facts";
import { limitGuest } from "@/lib/rate-limit";

const MAX_PARAGRAPH = 3000;
const MAX_FACTS = 60;

const isFact = (value: unknown): value is Fact => {
  const fact = value as Partial<Fact> | null;

  return (
    typeof fact?.id === "string" &&
    typeof fact.label === "string" &&
    typeof fact.unit === "string" &&
    (typeof fact.value === "number" || typeof fact.value === "string")
  );
};

// Never log the paragraph or the full error, only the error name.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // High: every opened doc reads all its paragraphs, and a short read is cheap.
  const limited = limitGuest(session, "facts", 400);

  if (limited) {
    return limited;
  }

  const body = await request.json().catch(() => null);
  const paragraph =
    typeof body?.paragraph === "string" ? body.paragraph.trim() : "";

  if (!paragraph || paragraph.length > MAX_PARAGRAPH) {
    return Response.json({ error: "paragraph is required" }, { status: 400 });
  }

  const table: Fact[] = Array.isArray(body?.table)
    ? body.table.filter(isFact).slice(0, MAX_FACTS)
    : [];

  try {
    return Response.json(await extractFacts({ paragraph, table }));
  } catch (error) {
    console.error(
      "facts failed:",
      error instanceof Error ? error.name : "unknown"
    );

    return Response.json({ error: "Could not read facts" }, { status: 502 });
  }
}

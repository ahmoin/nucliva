import { db } from "@workspace/db";
import { styleSamples } from "@workspace/db/schema";
import { headers } from "next/headers";
import { ingestText } from "@/lib/ai/embeddings";
import { auth } from "@/lib/auth/server";
import { limitGuest } from "@/lib/rate-limit";

const MAX_SAMPLE = 20_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = limitGuest(session, "embeddings", 5);

  if (limited) {
    return limited;
  }

  const body = await request.json().catch(() => null);
  const content =
    typeof body?.content === "string"
      ? body.content.trim().slice(0, MAX_SAMPLE)
      : "";

  if (!content) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const [sample] = await db
    .insert(styleSamples)
    .values({ content, userId: session.user.id })
    .returning({ id: styleSamples.id });

  await ingestText({ kind: "style", text: content, userId: session.user.id });

  return Response.json(sample, { status: 201 });
}

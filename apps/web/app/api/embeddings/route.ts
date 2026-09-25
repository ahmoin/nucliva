import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ingestText } from "@/lib/embeddings";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const documentId =
    typeof body?.documentId === "string" ? body.documentId : undefined;

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  if (documentId) {
    const [document] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.userId, session.user.id))
      );

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }
  }

  const chunks = await ingestText({
    documentId,
    kind: body?.kind === "style" ? "style" : "context",
    text,
    userId: session.user.id,
  });

  return Response.json({ chunks });
}

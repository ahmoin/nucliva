import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [original] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .limit(1);

  if (!original) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [copy] = await db
    .insert(documents)
    .values({
      content: original.content,
      kind: original.kind,
      title: `${original.title} (copy)`.slice(0, 500),
      userId: session.user.id,
    })
    .returning({ id: documents.id });

  return Response.json(copy, { status: 201 });
}

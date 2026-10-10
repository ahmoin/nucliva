import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  starred: z.boolean().optional(),
  title: z.string().min(1).max(500).optional(),
  trashed: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { content, starred, title, trashed } = parsed.data;
  const edited = content !== undefined || title !== undefined;
  const { id } = await params;
  const [updated] = await db
    .update(documents)
    .set({
      ...(content !== undefined && { content }),
      ...(starred !== undefined && { starredAt: starred ? new Date() : null }),
      ...(title !== undefined && { title }),
      ...(trashed !== undefined && { deletedAt: trashed ? new Date() : null }),
      ...(edited && { updatedAt: new Date() }),
    })
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .returning({ id: documents.id, updatedAt: documents.updatedAt });

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .returning({ id: documents.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

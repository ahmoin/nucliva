import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const kind =
    body?.kind === "slides" || body?.kind === "sheet" ? body.kind : "doc";
  const titles = {
    doc: "Untitled",
    sheet: "Untitled sheet",
    slides: "Untitled presentation",
  };

  const [created] = await db
    .insert(documents)
    .values({ kind, title: titles[kind as keyof typeof titles], userId: session.user.id })
    .returning({ id: documents.id });

  return Response.json(created, { status: 201 });
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(documents)
    .where(
      and(
        eq(documents.userId, session.user.id),
        isNotNull(documents.deletedAt)
      )
    );

  return new Response(null, { status: 204 });
}

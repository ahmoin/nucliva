import { db } from "@workspace/db";
import { integrations, knowledgeSources } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/lib/auth/server";
import { isConnectorId } from "@/lib/knowledge/connectors";
import { syncIntegration } from "@/lib/knowledge/sync";

export const maxDuration = 300;

const sessionFor = async () =>
  auth.api.getSession({ headers: await headers() });

// Syncs again, in the background.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await sessionFor();
  const { provider } = await params;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConnectorId(provider)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const userId = session.user.id;

  after(() => syncIntegration(userId, provider));

  return new Response(null, { status: 202 });
}

// Disconnects the app, and takes out what it brought in.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await sessionFor();
  const { provider } = await params;

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isConnectorId(provider)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(integrations)
    .where(
      and(
        eq(integrations.userId, session.user.id),
        eq(integrations.provider, provider)
      )
    );
  await db
    .delete(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.userId, session.user.id),
        eq(knowledgeSources.provider, provider)
      )
    );

  return new Response(null, { status: 204 });
}

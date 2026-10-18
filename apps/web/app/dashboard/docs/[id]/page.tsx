import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DocumentEditor } from "@/components/document-editor";
import { SandboxBanner } from "@/components/sandbox-banner";
import { SuiteLinks } from "@/components/suite-links";
import { siblingsOf } from "@/lib/agents/runs";
import type { PendingDoc } from "@/lib/agents/suite";
import { auth } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { id } = await params;

  if (!session) {
    notFound();
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .limit(1);

  if (!doc) {
    notFound();
  }

  return (
    <AppShell title="Docs">
      {session.user.isAnonymous ? <SandboxBanner /> : null}
      <SuiteLinks
        current={doc.id}
        files={await siblingsOf(session.user.id, doc.runId)}
      />
      <DocumentEditor
        content={doc.content as Record<string, unknown>}
        id={doc.id}
        suggested={doc.pending as PendingDoc | null}
        title={doc.title}
        updatedAt={doc.updatedAt.getTime()}
      />
    </AppShell>
  );
}

import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SheetEditor } from "@/components/sheet-editor";
import { SuiteLinks } from "@/components/suite-links";
import { siblingsOf } from "@/lib/agents/runs";
import { getUserId } from "@/lib/db/documents";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  const { id } = await params;

  const [doc] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.userId, userId),
        eq(documents.kind, "sheet")
      )
    )
    .limit(1);

  if (!doc) {
    notFound();
  }

  type Saved = {
    sheets?: React.ComponentProps<typeof SheetEditor>["sheets"];
  };
  const content = doc.content as Saved;
  const pending = doc.pending as Saved | null;

  return (
    <AppShell title="Sheets">
      <SuiteLinks
        current={doc.id}
        files={await siblingsOf(userId, doc.runId)}
      />
      <SheetEditor
        id={doc.id}
        sheets={content.sheets ?? null}
        suggested={pending?.sheets ?? null}
        title={doc.title}
      />
    </AppShell>
  );
}

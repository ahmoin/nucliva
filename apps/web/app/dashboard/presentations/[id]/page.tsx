import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { type Slide, SlidesEditor } from "@/components/slides-editor";
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
        eq(documents.kind, "slides")
      )
    )
    .limit(1);

  if (!doc) {
    notFound();
  }

  const content = doc.content as { slides?: Slide[] };
  const pending = doc.pending as { slides?: Slide[] } | null;

  return (
    <AppShell title="Presentations">
      <SuiteLinks
        current={doc.id}
        files={await siblingsOf(userId, doc.runId)}
      />
      <SlidesEditor
        id={doc.id}
        initialSlides={content.slides ?? []}
        suggested={pending?.slides ?? null}
        title={doc.title}
      />
    </AppShell>
  );
}

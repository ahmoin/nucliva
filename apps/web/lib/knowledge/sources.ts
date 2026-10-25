import { db } from "@workspace/db";
import { knowledgeSources } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { ingestText } from "@/lib/ai/embeddings";

const MAX_TEXT = 60_000;

export type Provider = (typeof knowledgeSources.$inferInsert)["provider"];

export interface SourceItem {
  externalId: string;
  text: string;
  title: string;
  url?: string | undefined;
}

export async function saveSource(
  userId: string,
  provider: Provider,
  item: SourceItem
) {
  const text = item.text.trim().slice(0, MAX_TEXT);

  if (!text) {
    return 0;
  }

  // Its chunks cascade-delete with the row.
  await db
    .delete(knowledgeSources)
    .where(
      and(
        eq(knowledgeSources.userId, userId),
        eq(knowledgeSources.provider, provider),
        eq(knowledgeSources.externalId, item.externalId)
      )
    );

  const [source] = await db
    .insert(knowledgeSources)
    .values({
      externalId: item.externalId,
      provider,
      title: item.title.slice(0, 300) || "Untitled",
      url: item.url,
      userId,
    })
    .returning({ id: knowledgeSources.id });

  if (!source) {
    return 0;
  }

  return ingestText({
    kind: "context",
    sourceId: source.id,
    text: `${item.title}\n\n${text}`,
    userId,
  });
}

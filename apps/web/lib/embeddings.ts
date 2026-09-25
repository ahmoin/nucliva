import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { db } from "@workspace/db";
import { vectorEmbeddings } from "@workspace/db/schema";
import { and, cosineDistance, eq } from "drizzle-orm";
import { NEBIUS_BASE_URL } from "@/lib/nebius";

const EMBEDDING_DIMENSIONS = 1536;

const splitter = new RecursiveCharacterTextSplitter({
  chunkOverlap: 150,
  chunkSize: 1000,
});

const getEmbeddings = () =>
  new OpenAIEmbeddings({
    apiKey: process.env.NEBIUS_API_KEY,
    configuration: { baseURL: NEBIUS_BASE_URL },
    dimensions: EMBEDDING_DIMENSIONS,
    model: "Qwen/Qwen3-Embedding-8B",
  });

export async function ingestText({
  documentId,
  kind,
  text,
  userId,
}: {
  documentId?: string;
  kind: (typeof vectorEmbeddings.$inferInsert)["kind"];
  text: string;
  userId: string;
}) {
  const chunks = await splitter.splitText(text);

  if (chunks.length === 0) {
    return 0;
  }

  const vectors = await getEmbeddings().embedDocuments(chunks);

  const rows = chunks.flatMap((chunk, index) => {
    const embedding = vectors[index];
    return embedding ? [{ chunk, documentId, embedding, kind, userId }] : [];
  });

  await db.insert(vectorEmbeddings).values(rows);

  return rows.length;
}

export async function findSimilarChunks({
  kind,
  limit = 8,
  query,
  userId,
}: {
  kind: (typeof vectorEmbeddings.$inferSelect)["kind"];
  limit?: number;
  query: string;
  userId: string;
}) {
  const queryEmbedding = await getEmbeddings().embedQuery(
    `Instruct: Given a topic, retrieve passages written by the same author\nQuery: ${query}`
  );

  const rows = await db
    .select({ chunk: vectorEmbeddings.chunk })
    .from(vectorEmbeddings)
    .where(
      and(eq(vectorEmbeddings.userId, userId), eq(vectorEmbeddings.kind, kind))
    )
    .orderBy(cosineDistance(vectorEmbeddings.embedding, queryEmbedding))
    .limit(limit);

  return rows.map((row) => row.chunk);
}

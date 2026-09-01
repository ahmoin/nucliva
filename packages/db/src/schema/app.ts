import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const userId = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const documents = pgTable("documents", {
  id: id(),
  userId: userId(),
  title: text("title").notNull().default("Untitled"),
  kind: text("kind", { enum: ["doc", "slides", "note", "sheet"] })
    .notNull()
    .default("doc"),
  content: jsonb("content").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const styleSamples = pgTable("style_samples", {
  id: id(),
  userId: userId(),
  source: text("source", { enum: ["email", "document", "note", "other"] })
    .notNull()
    .default("other"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vectorEmbeddings = pgTable(
  "vector_embeddings",
  {
    id: id(),
    userId: userId(),
    documentId: text("document_id").references(() => documents.id, {
      onDelete: "cascade",
    }),
    kind: text("kind", { enum: ["context", "style"] })
      .notNull()
      .default("context"),
    chunk: text("chunk").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("vector_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("vector_embeddings_user_idx").on(table.userId),
  ]
);

export const integrations = pgTable("integrations", {
  id: id(),
  userId: userId(),
  provider: text("provider", {
    enum: ["google_drive", "notion", "slack", "local"],
  }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

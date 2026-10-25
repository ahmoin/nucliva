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

// A request to an agent that makes a set of linked files, and how far it got.
export const agentRuns = pgTable("agent_runs", {
  id: id(),
  userId: userId(),
  prompt: text("prompt").notNull(),
  title: text("title"),
  status: text("status", { enum: ["queued", "running", "done", "failed"] })
    .notNull()
    .default("queued"),
  // Where it runs: a Nebius Serverless job, or the web server itself.
  runner: text("runner", { enum: ["nebius", "local"] })
    .notNull()
    .default("local"),
  jobId: text("job_id"),
  steps: jsonb("steps").notNull().default(sql`'[]'::jsonb`),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: id(),
  userId: userId(),
  title: text("title").notNull().default("Untitled"),
  kind: text("kind", { enum: ["doc", "slides", "note", "sheet"] })
    .notNull()
    .default("doc"),
  content: jsonb("content").notNull().default(sql`'{}'::jsonb`),
  // The files an agent made together share its run.
  runId: text("run_id").references(() => agentRuns.id, {
    onDelete: "set null",
  }),
  // What an agent suggests for the file, waiting to be accepted.
  pending: jsonb("pending"),
  starredAt: timestamp("starred_at"),
  deletedAt: timestamp("deleted_at"),
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

// Something brought into the knowledge base from outside: a file that was
// uploaded, or a page, file or channel from a connected app.
export const knowledgeSources = pgTable(
  "knowledge_sources",
  {
    id: id(),
    userId: userId(),
    provider: text("provider", {
      enum: ["google_drive", "notion", "slack", "local"],
    }).notNull(),
    // Its ID in the app it came from, so a sync updates it instead of adding
    // it again.
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("knowledge_sources_user_idx").on(table.userId)]
);

export const vectorEmbeddings = pgTable(
  "vector_embeddings",
  {
    id: id(),
    userId: userId(),
    documentId: text("document_id").references(() => documents.id, {
      onDelete: "cascade",
    }),
    sourceId: text("source_id").references(() => knowledgeSources.id, {
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

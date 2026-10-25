import { db } from "@workspace/db";
import { integrations } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import {
  type ConnectorId,
  connectors,
  type Tokens,
} from "@/lib/knowledge/connectors";
import { saveSource } from "@/lib/knowledge/sources";

export interface IntegrationMetadata {
  count?: number;
  expiresAt?: number;
  name?: string;
  status: "Connected" | "Syncing" | "Sync failed";
  syncedAt?: number;
}

const find = (userId: string, provider: ConnectorId) =>
  db
    .select()
    .from(integrations)
    .where(
      and(eq(integrations.userId, userId), eq(integrations.provider, provider))
    )
    .limit(1);

async function setMetadata(
  id: string,
  metadata: IntegrationMetadata,
  tokens?: Tokens
) {
  await db
    .update(integrations)
    .set({
      metadata,
      updatedAt: new Date(),
      ...(tokens && {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
      }),
    })
    .where(eq(integrations.id, id));
}

export async function saveConnection(
  userId: string,
  provider: ConnectorId,
  tokens: Tokens
) {
  await db
    .delete(integrations)
    .where(
      and(eq(integrations.userId, userId), eq(integrations.provider, provider))
    );
  await db.insert(integrations).values({
    accessToken: tokens.accessToken,
    metadata: {
      expiresAt: tokens.expiresAt,
      name: tokens.name,
      status: "Syncing",
    } satisfies IntegrationMetadata,
    provider,
    refreshToken: tokens.refreshToken ?? null,
    userId,
  });
}

export async function syncIntegration(userId: string, provider: ConnectorId) {
  const [row] = await find(userId, provider);

  if (!row?.accessToken) {
    return;
  }

  const connector = connectors[provider];
  const metadata = row.metadata as IntegrationMetadata;
  let tokens: Tokens = {
    accessToken: row.accessToken,
    expiresAt: metadata.expiresAt,
    name: metadata.name,
    refreshToken: row.refreshToken ?? undefined,
  };

  await setMetadata(row.id, { ...metadata, status: "Syncing" });

  try {
    if (connector.refresh && tokens.expiresAt && tokens.expiresAt < Date.now()) {
      tokens = await connector.refresh(tokens);
    }

    const items = await connector.sync(tokens);
    let count = 0;

    // Sequential on purpose, so the embedding API is not flooded.
    for (const item of items) {
      if ((await saveSource(userId, provider, item)) > 0) {
        count += 1;
      }
    }

    await setMetadata(
      row.id,
      {
        count,
        expiresAt: tokens.expiresAt,
        name: tokens.name,
        status: "Connected",
        syncedAt: Date.now(),
      },
      tokens
    );
  } catch (error) {
    console.error(`${provider} sync failed:`, error);
    await setMetadata(row.id, { ...metadata, status: "Sync failed" });
  }
}

import { db } from "@workspace/db";
import { documents, styleSamples } from "@workspace/db/schema";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

const fileKinds = {
  doc: "doc",
  note: "doc",
  sheet: "sheet",
  slides: "presentation",
} as const;

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });

export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session.user.id;
}

export async function listDocuments(
  userId: string,
  options: {
    kind?: "doc" | "sheet" | "slides";
    limit?: number;
    starred?: boolean;
    trashed?: boolean;
  } = {}
) {
  const rows = await db
    .select({
      deletedAt: documents.deletedAt,
      id: documents.id,
      kind: documents.kind,
      starredAt: documents.starredAt,
      title: documents.title,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        options.kind ? eq(documents.kind, options.kind) : undefined,
        options.trashed
          ? isNotNull(documents.deletedAt)
          : isNull(documents.deletedAt),
        options.starred ? isNotNull(documents.starredAt) : undefined
      )
    )
    .orderBy(desc(options.trashed ? documents.deletedAt : documents.updatedAt))
    .limit(options.limit ?? 5000);

  return rows.map((row) => ({
    href: {
      doc: `/dashboard/docs/${row.id}`,
      note: undefined,
      sheet: `/dashboard/sheets/${row.id}`,
      slides: `/dashboard/presentations/${row.id}`,
    }[row.kind],
    id: row.id,
    kind: fileKinds[row.kind],
    modified: formatDate(
      options.trashed ? (row.deletedAt ?? row.updatedAt) : row.updatedAt
    ),
    name: row.title,
    owner: "You",
    starred: row.starredAt !== null,
    updatedAt: row.updatedAt,
  }));
}

export async function countStyleSamples(userId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(styleSamples)
    .where(eq(styleSamples.userId, userId));

  return row?.total ?? 0;
}

import { DatabaseIcon } from "@phosphor-icons/react/ssr";
import { db } from "@workspace/db";
import {
  documents,
  integrations,
  knowledgeSources,
  vectorEmbeddings,
} from "@workspace/db/schema";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { count, desc, eq, max } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import {
  AddSourceButton,
  type ConnectorView,
  KnowledgeConnectors,
} from "@/components/knowledge-connectors";
import { PageHeader } from "@/components/page-header";
import { formatDate, getUserId } from "@/lib/db/documents";
import { connectors } from "@/lib/knowledge/connectors";
import type { IntegrationMetadata } from "@/lib/knowledge/sync";

const providers = [
  {
    description: "Import your recent docs, slides and sheets.",
    name: "Google Drive",
    provider: "google_drive",
  },
  {
    description: "Import the pages you share with Nucliva.",
    name: "Notion",
    provider: "notion",
  },
  {
    description: "Import recent messages from channels you are in.",
    name: "Slack",
    provider: "slack",
  },
  {
    description: "Upload PDFs, text and Markdown from your computer.",
    name: "Local files",
    provider: "local",
  },
] as const;

const providerLabels = {
  document: "File",
  google_drive: "Google Drive",
  local: "Upload",
  notion: "Notion",
  slack: "Slack",
} as const;

export default async function Page() {
  const userId = await getUserId();
  const connected = await db
    .select()
    .from(integrations)
    .where(eq(integrations.userId, userId));
  const indexedFiles = await db
    .select({
      chunks: count(vectorEmbeddings.id),
      id: documents.id,
      name: documents.title,
      updated: max(vectorEmbeddings.createdAt),
    })
    .from(vectorEmbeddings)
    .innerJoin(documents, eq(vectorEmbeddings.documentId, documents.id))
    .where(eq(vectorEmbeddings.userId, userId))
    .groupBy(documents.id);
  const imported = await db
    .select({
      chunks: count(vectorEmbeddings.id),
      id: knowledgeSources.id,
      name: knowledgeSources.title,
      provider: knowledgeSources.provider,
      updated: max(knowledgeSources.updatedAt),
      url: knowledgeSources.url,
    })
    .from(knowledgeSources)
    .leftJoin(vectorEmbeddings, eq(vectorEmbeddings.sourceId, knowledgeSources.id))
    .where(eq(knowledgeSources.userId, userId))
    .groupBy(knowledgeSources.id)
    .orderBy(desc(max(knowledgeSources.updatedAt)));
  const sources = [
    ...imported,
    ...indexedFiles.map((file) => ({
      ...file,
      provider: "document" as const,
      url: null,
    })),
  ].sort((a, b) => (b.updated?.getTime() ?? 0) - (a.updated?.getTime() ?? 0));

  const views: ConnectorView[] = providers.map((entry) => {
    const row = connected.find((item) => item.provider === entry.provider);
    const metadata = (row?.metadata ?? {}) as Partial<IntegrationMetadata>;
    const localCount = imported.filter((item) => item.provider === "local").length;
    let detail: string | null = null;

    if (entry.provider === "local") {
      detail =
        localCount > 0
          ? `${localCount} ${localCount === 1 ? "file" : "files"}`
          : null;
    } else if (row && metadata.syncedAt) {
      detail = `${metadata.count ?? 0} imported${metadata.name ? ` from ${metadata.name}` : ""}`;
    }

    return {
      configured:
        entry.provider === "local" ? true : connectors[entry.provider].configured(),
      description: entry.description,
      detail,
      id: entry.provider,
      name: entry.name,
      status:
        entry.provider === "local"
          ? "Available"
          : row
            ? (metadata.status ?? "Connected")
            : "Not connected",
    };
  });

  return (
    <AppShell title="Knowledge Base">
      <PageHeader
        actions={<AddSourceButton />}
        description="Connect the places your knowledge lives so drafts can draw on it."
        title="Knowledge Base"
      />
      <KnowledgeConnectors connectors={views} />
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
          Indexed sources
        </h2>
        {sources.length === 0 ? (
          <EmptyState
            description="Sources you upload or import show up here with their chunk counts."
            icon={DatabaseIcon}
            title="Nothing indexed yet"
          />
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden w-36 @2xl:table-cell">
                  From
                </TableHead>
                <TableHead className="w-24">Chunks</TableHead>
                <TableHead className="hidden w-[20%] @2xl:table-cell">
                  Updated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="truncate font-medium" title={source.name}>
                    {source.url ? (
                      <a
                        className="hover:underline"
                        href={source.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.name}
                      </a>
                    ) : (
                      source.name
                    )}
                  </TableCell>
                  <TableCell className="hidden @2xl:table-cell">
                    <Badge variant="secondary">
                      {providerLabels[source.provider]}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground">
                    {source.chunks.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="hidden truncate text-muted-foreground @2xl:table-cell">
                    {source.updated ? formatDate(source.updated) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </AppShell>
  );
}

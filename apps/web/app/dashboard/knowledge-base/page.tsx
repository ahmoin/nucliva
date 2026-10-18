import { DatabaseIcon, UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { db } from "@workspace/db";
import {
  documents,
  integrations,
  vectorEmbeddings,
} from "@workspace/db/schema";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
import { PageHeader } from "@/components/page-header";
import { formatDate, getUserId } from "@/lib/db/documents";

const providers = [
  {
    description: "Import docs, slides and sheets.",
    name: "Google Drive",
    provider: "google_drive",
  },
  {
    description: "Import pages and databases.",
    name: "Notion",
    provider: "notion",
  },
  {
    description: "Search channels and threads.",
    name: "Slack",
    provider: "slack",
  },
  {
    description: "Upload PDFs, text and markdown from your computer.",
    name: "Local files",
    provider: "local",
  },
] as const;

interface ConnectorMetadata {
  description?: string;
  name?: string;
  status?: string;
}

export default async function Page() {
  const userId = await getUserId();
  const connected = await db
    .select()
    .from(integrations)
    .where(eq(integrations.userId, userId));
  const sources = await db
    .select({
      chunks: count(vectorEmbeddings.id),
      id: documents.id,
      name: documents.title,
      updated: max(vectorEmbeddings.createdAt),
    })
    .from(vectorEmbeddings)
    .innerJoin(documents, eq(vectorEmbeddings.documentId, documents.id))
    .where(eq(vectorEmbeddings.userId, userId))
    .groupBy(documents.id)
    .orderBy(desc(max(vectorEmbeddings.createdAt)));

  const connectors = providers.map((entry) => {
    const row = connected.find((item) => item.provider === entry.provider);
    const metadata = (row?.metadata ?? {}) as ConnectorMetadata;
    const fallbackStatus = entry.provider === "local" ? "Available" : "Not connected";

    return {
      description: metadata.description ?? entry.description,
      id: entry.provider,
      name: metadata.name ?? entry.name,
      status: row ? (metadata.status ?? "Connected") : fallbackStatus,
    };
  });

  return (
    <AppShell title="Knowledge Base">
      <PageHeader
        actions={
          <Button>
            <UploadSimpleIcon />
            Add source
          </Button>
        }
        description="Connect the places your knowledge lives so drafts can draw on it."
        title="Knowledge Base"
      />
      <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        {connectors.map((connector) => (
          <Card key={connector.id} size="sm">
            <CardHeader>
              <CardTitle
                className="line-clamp-2 break-words text-base"
                title={connector.name}
              >
                {connector.name}
              </CardTitle>
              <CardDescription
                className="line-clamp-3 break-words"
                title={connector.description}
              >
                {connector.description}
              </CardDescription>
            </CardHeader>
            <div className="flex min-w-0 flex-col items-start gap-3 px-(--card-spacing)">
              <Badge
                className="max-w-full"
                title={connector.status}
                variant={
                  connector.status === "Connected" ? "default" : "secondary"
                }
              >
                <span className="truncate">{connector.status}</span>
              </Badge>
              <Button size="sm" variant="outline">
                {connector.status === "Connected" ? "Manage" : "Connect"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
          Indexed sources
        </h2>
        {sources.length === 0 ? (
          <EmptyState
            description="Sources you index will show up here with their chunk counts."
            icon={DatabaseIcon}
            title="Nothing indexed yet"
          />
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[52%]">Name</TableHead>
                <TableHead className="w-28">Chunks</TableHead>
                <TableHead className="w-[22%]">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell
                    className="truncate font-medium"
                    title={source.name}
                  >
                    {source.name}
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground">
                    {source.chunks.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground">
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

import { UploadSimpleIcon } from "@phosphor-icons/react/ssr";
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
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { connectors, indexedSources } from "@/lib/sample-data";

export default function Page() {
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[38%]">Name</TableHead>
              <TableHead className="w-[26%]">Source</TableHead>
              <TableHead className="w-28">Chunks</TableHead>
              <TableHead className="w-[22%]">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indexedSources.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="truncate font-medium" title={source.name}>
                  {source.name}
                </TableCell>
                <TableCell
                  className="truncate text-muted-foreground"
                  title={source.source}
                >
                  {source.source}
                </TableCell>
                <TableCell className="truncate text-muted-foreground">
                  {source.chunks.toLocaleString("en-US")}
                </TableCell>
                <TableCell
                  className="truncate text-muted-foreground"
                  title={source.updated}
                >
                  {source.updated}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </AppShell>
  );
}

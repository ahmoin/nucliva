import { NotePencilIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import { db } from "@workspace/db";
import { styleSamples } from "@workspace/db/schema";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@workspace/ui/components/textarea";
import { desc, eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatDate, getUserId } from "@/lib/documents";

const sourceLabels = {
  document: "Document",
  email: "Email",
  note: "Note",
  other: "Other",
} as const;

const firstLine = (content: string) =>
  content
    .split("\n")
    .find((line) => line.trim())
    ?.trim()
    .slice(0, 200) ?? "Untitled";

const countWords = (content: string) =>
  content.trim() ? content.trim().split(/\s+/).length : 0;

export default async function Page() {
  const samples = await db
    .select()
    .from(styleSamples)
    .where(eq(styleSamples.userId, await getUserId()))
    .orderBy(desc(styleSamples.createdAt));

  return (
    <AppShell title="Style Profile">
      <PageHeader
        description="Nucliva learns how you write from your samples, then drafts in that voice."
        title="Style Profile"
      />
      <Card>
        <CardHeader>
          <CardTitle>Add a writing sample</CardTitle>
          <CardDescription>
            Paste an email, essay or note you wrote. More samples make the style
            more accurate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            aria-label="Writing sample"
            placeholder="Paste something you wrote..."
            rows={6}
          />
          <div>
            <Button>
              <SparkleIcon />
              Analyze style
            </Button>
          </div>
        </CardContent>
      </Card>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
          Writing samples
        </h2>
        {samples.length === 0 ? (
          <EmptyState
            description="Add a few things you have written to teach Nucliva your voice."
            icon={NotePencilIcon}
            title="No writing samples yet"
          />
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[46%]">Title</TableHead>
                <TableHead className="w-[26%]">Source</TableHead>
                <TableHead className="w-28">Words</TableHead>
                <TableHead className="w-[22%]">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell
                    className="truncate font-medium"
                    title={firstLine(sample.content)}
                  >
                    {firstLine(sample.content)}
                  </TableCell>
                  <TableCell className="overflow-hidden">
                    <Badge className="max-w-full" variant="secondary">
                      {sourceLabels[sample.source]}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground">
                    {countWords(sample.content).toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="truncate text-muted-foreground">
                    {formatDate(sample.createdAt)}
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

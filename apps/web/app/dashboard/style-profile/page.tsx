import { SparkleIcon } from "@phosphor-icons/react/ssr";
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
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { toneMarkers, writingSamples } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Style Profile">
      <PageHeader
        description="Nucliva learns how you write from your samples, then drafts in that voice."
        title="Style Profile"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {toneMarkers.map((marker) => (
          <Card key={marker.id} size="sm">
            <CardHeader>
              <CardDescription>{marker.title}</CardDescription>
              <CardTitle
                className="line-clamp-3 break-words"
                title={marker.value}
              >
                {marker.value}
              </CardTitle>
            </CardHeader>
            <CardContent
              className="line-clamp-4 break-words text-muted-foreground text-sm"
              title={marker.description}
            >
              {marker.description}
            </CardContent>
          </Card>
        ))}
      </div>
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
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[38%]">Title</TableHead>
              <TableHead className="w-[26%]">Source</TableHead>
              <TableHead className="w-28">Words</TableHead>
              <TableHead className="w-[22%]">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {writingSamples.map((sample) => (
              <TableRow key={sample.id}>
                <TableCell
                  className="truncate font-medium"
                  title={sample.title}
                >
                  {sample.title}
                </TableCell>
                <TableCell className="overflow-hidden">
                  <Badge className="max-w-full" variant="secondary">
                    <span className="truncate" title={sample.source}>
                      {sample.source}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="truncate text-muted-foreground">
                  {sample.words.toLocaleString("en-US")}
                </TableCell>
                <TableCell
                  className="truncate text-muted-foreground"
                  title={sample.added}
                >
                  {sample.added}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </AppShell>
  );
}

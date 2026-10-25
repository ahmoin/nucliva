import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatDate } from "@/lib/db/documents";

const sourceLabels = {
  document: "Document",
  email: "Email",
  note: "Note",
  other: "Other",
} as const;

export interface StyleSampleRow {
  content: string;
  createdAt: Date;
  id: string;
  source: keyof typeof sourceLabels;
}

const firstLine = (content: string) =>
  content
    .split("\n")
    .find((line) => line.trim())
    ?.trim()
    .slice(0, 200) ?? "Untitled";

const countWords = (content: string) =>
  content.trim() ? content.trim().split(/\s+/).length : 0;

export function StyleSampleTable({ samples }: { samples: StyleSampleRow[] }) {
  return (
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
  );
}

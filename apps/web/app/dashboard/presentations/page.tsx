import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

const presentations = [
  {
    id: "d1",
    modified: "Today, 8:12 AM",
    slides: 12,
    title: "Q4 review",
  },
  {
    id: "d2",
    modified:
      "September 19, 2025 at 11:59:59 PM Coordinated Universal Time, last edited by Christopher Alexander Montgomery III",
    slides: 1204,
    title:
      "Global sales kickoff: regional breakouts, quota changes, comp plan updates, territory assignments and the full Q1 enablement calendar",
  },
  {
    id: "d3",
    modified: "—",
    slides: 0,
    title: "Untitled",
  },
  {
    id: "d4",
    modified: "Sep 09",
    slides: 5,
    title:
      "Supercalifragilisticexpialidocious_Product_Roadmap_H2_FINAL_v27_use_this_one",
  },
  {
    id: "d5",
    modified: "Aug 30",
    slides: 10,
    title: "顧客事例：エンタープライズ向け導入プロジェクトの成果と今後の展望",
  },
  {
    id: "d6",
    modified: "Aug 22",
    slides: 7,
    title: "Team offsite recap",
  },
];

export default function Page() {
  return (
    <AppShell title="Presentations">
      <PageHeader
        actions={
          <Button>
            <PlusIcon />
            New presentation
          </Button>
        }
        description="Turn raw notes into polished slides in seconds."
        title="Presentations"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {presentations.map((presentation) => (
          <Card key={presentation.id} size="sm">
            <div className="mx-(--card-spacing) flex aspect-video items-center justify-center bg-muted text-muted-foreground text-xs uppercase tracking-widest">
              {presentation.slides.toLocaleString("en-US")} slides
            </div>
            <CardHeader>
              <CardTitle
                className="line-clamp-2 break-words text-base"
                title={presentation.title}
              >
                {presentation.title}
              </CardTitle>
              <CardDescription className="flex min-w-0 items-center gap-2">
                <Badge variant="secondary">Slides</Badge>
                <span className="truncate" title={presentation.modified}>
                  {presentation.modified}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

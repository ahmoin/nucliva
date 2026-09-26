import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { projects } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Projects">
      <PageHeader
        actions={
          <Button>
            <PlusIcon />
            New project
          </Button>
        }
        description="Group docs, slides and sheets that belong together."
        title="Projects"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle
                className="line-clamp-2 break-words"
                title={project.name}
              >
                {project.name}
              </CardTitle>
              <CardDescription
                className="line-clamp-3 break-words"
                title={project.description}
              >
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Badge variant="secondary">
                  {project.docs.toLocaleString("en-US")} docs
                </Badge>
                <Badge variant="secondary">
                  {project.slides.toLocaleString("en-US")} slides
                </Badge>
                <Badge variant="secondary">
                  {project.sheets.toLocaleString("en-US")} sheets
                </Badge>
              </div>
              <span
                className="truncate text-muted-foreground text-xs"
                title={project.updated}
              >
                {project.updated}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

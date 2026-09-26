import {
  FileTextIcon,
  PresentationChartIcon,
  SparkleIcon,
  TableIcon,
} from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Textarea } from "@workspace/ui/components/textarea";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { files, toneMarkers } from "@/lib/sample-data";

const quickActions = [
  {
    description: "Write with AI in your own voice.",
    href: "/dashboard/docs",
    icon: FileTextIcon,
    title: "New doc",
  },
  {
    description: "Turn notes into slides.",
    href: "/dashboard/presentations",
    icon: PresentationChartIcon,
    title: "New presentation",
  },
  {
    description: "Organize data and research.",
    href: "/dashboard/sheets",
    icon: TableIcon,
    title: "New sheet",
  },
];

export default function Page() {
  return (
    <AppShell title="Home">
      <PageHeader
        description="Pick up where you left off, or start something new."
        title="Home"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.href} size="sm">
            <CardHeader>
              <action.icon className="mb-2 size-6" />
              <CardTitle>{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
              <CardAction>
                <Button
                  nativeButton={false}
                  render={<Link href={action.href} />}
                  size="sm"
                  variant="outline"
                >
                  Create
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent files</CardTitle>
            <CardDescription>What you worked on lately.</CardDescription>
            <CardAction>
              <Button
                nativeButton={false}
                render={<Link href="/dashboard/recent" />}
                size="sm"
                variant="ghost"
              >
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FileTable items={files.slice(0, 5)} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft in your voice</CardTitle>
              <CardDescription>
                Describe what you need and Nucliva writes it like you would.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                aria-label="What should we write?"
                placeholder="Write a short update about the launch..."
                rows={4}
              />
              <Button>
                <SparkleIcon />
                Generate draft
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your style</CardTitle>
              <CardDescription>
                Learned from your writing samples.
              </CardDescription>
              <CardAction>
                <Button
                  nativeButton={false}
                  render={<Link href="/dashboard/style-profile" />}
                  size="sm"
                  variant="ghost"
                >
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {toneMarkers.map((marker) => (
                <div
                  className="flex min-w-0 items-center justify-between gap-4"
                  key={marker.id}
                >
                  <span className="shrink-0 text-muted-foreground">
                    {marker.title}
                  </span>
                  <span className="truncate font-medium" title={marker.value}>
                    {marker.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

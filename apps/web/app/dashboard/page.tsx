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
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { QuickActionCard } from "@/components/quick-action-card";
import {
  countStyleSamples,
  getUserId,
  listDocuments,
} from "@/lib/db/documents";

const quickActions = [
  {
    description: "Write with AI in your own voice.",
    icon: FileTextIcon,
    kind: "doc" as const,
    title: "New doc",
  },
  {
    description: "Turn notes into slides.",
    icon: PresentationChartIcon,
    kind: "slides" as const,
    title: "New presentation",
  },
  {
    description: "Organize data and research.",
    icon: TableIcon,
    kind: "sheet" as const,
    title: "New sheet",
  },
];

export default async function Page() {
  const userId = await getUserId();
  const recent = await listDocuments(userId, { limit: 5 });
  const sampleCount = await countStyleSamples(userId);

  return (
    <AppShell title="Home">
      <PageHeader
        description="Pick up where you left off, or start something new."
        title="Home"
      />
      <div className="grid gap-4 @3xl:grid-cols-3">
        {quickActions.map((action) => (
          <QuickActionCard
            description={action.description}
            icon={<action.icon className="mb-2 size-6" />}
            key={action.title}
            kind={action.kind}
            title={action.title}
          />
        ))}
      </div>
      <div className="grid gap-4 @5xl:grid-cols-3">
        <Card className="min-w-0 @5xl:col-span-2">
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
            {recent.length === 0 ? (
              <EmptyState
                description="Files you create show up here."
                icon={FileTextIcon}
                title="No files yet"
              />
            ) : (
              <FileTable items={recent} />
            )}
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
            <CardContent className="text-muted-foreground text-sm">
              {sampleCount === 0
                ? "No writing samples yet. Add a few to teach Nucliva your voice."
                : `${sampleCount.toLocaleString("en-US")} writing ${sampleCount === 1 ? "sample" : "samples"} added.`}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

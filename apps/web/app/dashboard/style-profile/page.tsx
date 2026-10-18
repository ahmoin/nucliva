import { NotePencilIcon } from "@phosphor-icons/react/ssr";
import { db } from "@workspace/db";
import { styleSamples } from "@workspace/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { desc, eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StyleSampleForm } from "@/components/style-sample-form";
import { StyleSampleTable } from "@/components/style-sample-table";
import { TourCount } from "@/components/tour-count";
import { getUserId } from "@/lib/db/documents";

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
      <Card data-tour="sample">
        <CardHeader>
          <CardTitle>Add a writing sample</CardTitle>
          <CardDescription>
            Paste an email, essay or note you wrote. More samples make the style
            more accurate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StyleSampleForm />
        </CardContent>
      </Card>
      <TourCount samples={samples.length} />
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
          <StyleSampleTable samples={samples} />
        )}
      </section>
    </AppShell>
  );
}

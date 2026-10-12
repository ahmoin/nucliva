import { PresentationChartIcon } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { NewDocButton } from "@/components/new-doc-button";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

export default async function Page() {
  const presentations = await listDocuments(await getUserId(), {
    kind: "slides",
  });

  return (
    <AppShell title="Presentations">
      <PageHeader
        actions={<NewDocButton kind="slides" label="New presentation" />}
        description="Turn raw notes into polished slides in seconds."
        title="Presentations"
      />
      {presentations.length === 0 ? (
        <EmptyState
          description="Create a presentation to turn your notes into slides."
          icon={PresentationChartIcon}
          title="No presentations yet"
        />
      ) : (
        <FileTable items={presentations} />
      )}
    </AppShell>
  );
}

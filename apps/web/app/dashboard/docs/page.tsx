import { FileTextIcon } from "@phosphor-icons/react/ssr";
import { Input } from "@workspace/ui/components/input";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { NewDocButton } from "@/components/new-doc-button";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

export default async function Page() {
  const docs = await listDocuments(await getUserId(), { kind: "doc" });

  return (
    <AppShell title="Docs">
      <PageHeader
        actions={<NewDocButton />}
        description="Write and edit documents with AI in your own voice."
        title="Docs"
      />
      <Input
        aria-label="Search docs"
        className="max-w-sm"
        placeholder="Search docs..."
        type="search"
      />
      {docs.length === 0 ? (
        <EmptyState
          description="Create a doc to start writing in your own voice."
          icon={FileTextIcon}
          title="No docs yet"
        />
      ) : (
        <FileTable items={docs} />
      )}
    </AppShell>
  );
}

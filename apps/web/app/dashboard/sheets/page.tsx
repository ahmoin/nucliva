import { TableIcon } from "@phosphor-icons/react/ssr";
import { Input } from "@workspace/ui/components/input";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { NewDocButton } from "@/components/new-doc-button";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/documents";

export default async function Page() {
  const sheets = await listDocuments(await getUserId(), { kind: "sheet" });

  return (
    <AppShell title="Sheets">
      <PageHeader
        actions={<NewDocButton kind="sheet" label="New sheet" />}
        description="Organize data, research and plans in one place."
        title="Sheets"
      />
      <Input
        aria-label="Search sheets"
        className="max-w-sm"
        placeholder="Search sheets..."
        type="search"
      />
      {sheets.length === 0 ? (
        <EmptyState
          description="Create a sheet to organize data and research."
          icon={TableIcon}
          title="No sheets yet"
        />
      ) : (
        <FileTable items={sheets} />
      )}
    </AppShell>
  );
}

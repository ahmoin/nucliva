import { TrashIcon } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { EmptyTrashButton } from "@/components/empty-trash-button";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

export default async function Page() {
  const trashed = await listDocuments(await getUserId(), { trashed: true });

  return (
    <AppShell title="Trash">
      <PageHeader
        actions={trashed.length > 0 ? <EmptyTrashButton /> : null}
        description="Files in the trash are deleted forever after 30 days."
        title="Trash"
      />
      {trashed.length === 0 ? (
        <EmptyState
          description="Files you delete stay here for 30 days."
          icon={TrashIcon}
          title="Trash is empty"
        />
      ) : (
        <FileTable items={trashed} variant="trash" />
      )}
    </AppShell>
  );
}

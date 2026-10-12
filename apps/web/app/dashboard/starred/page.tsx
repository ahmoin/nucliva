import { StarIcon } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

export default async function Page() {
  const starred = await listDocuments(await getUserId(), { starred: true });

  return (
    <AppShell title="Starred">
      <PageHeader
        description="Quick access to the files you care about most."
        title="Starred"
      />
      {starred.length === 0 ? (
        <EmptyState
          description="Star a file to find it here quickly."
          icon={StarIcon}
          title="No starred files"
        />
      ) : (
        <FileTable items={starred} starredOnly />
      )}
    </AppShell>
  );
}

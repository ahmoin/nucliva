import { TrashIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { trashedFiles } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Trash">
      <PageHeader
        actions={
          <Button variant="destructive">
            <TrashIcon />
            Empty trash
          </Button>
        }
        description="Files in the trash are deleted forever after 30 days."
        title="Trash"
      />
      <FileTable items={trashedFiles} variant="trash" />
    </AppShell>
  );
}

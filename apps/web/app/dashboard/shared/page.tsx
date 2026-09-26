import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { sharedFiles } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Shared with me">
      <PageHeader
        description="Files other people have shared with you."
        title="Shared with me"
      />
      <FileTable items={sharedFiles} variant="shared" />
    </AppShell>
  );
}

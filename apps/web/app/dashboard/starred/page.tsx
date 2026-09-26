import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { files } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Starred">
      <PageHeader
        description="Quick access to the files you care about most."
        title="Starred"
      />
      <FileTable items={files.filter((file) => file.starred)} />
    </AppShell>
  );
}

import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { files } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Sheets">
      <PageHeader
        actions={
          <Button>
            <PlusIcon />
            New sheet
          </Button>
        }
        description="Organize data, research and plans in one place."
        title="Sheets"
      />
      <Input
        aria-label="Search sheets"
        className="max-w-sm"
        placeholder="Search sheets..."
        type="search"
      />
      <FileTable items={files.filter((file) => file.kind === "sheet")} />
    </AppShell>
  );
}

import { PlusIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { files } from "@/lib/sample-data";

export default function Page() {
  return (
    <AppShell title="Docs">
      <PageHeader
        actions={
          <Button>
            <PlusIcon />
            New doc
          </Button>
        }
        description="Write and edit documents with AI in your own voice."
        title="Docs"
      />
      <Input
        aria-label="Search docs"
        className="max-w-sm"
        placeholder="Search docs..."
        type="search"
      />
      <FileTable items={files.filter((file) => file.kind === "doc")} />
    </AppShell>
  );
}

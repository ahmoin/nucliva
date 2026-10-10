import { FolderIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <AppShell title="Projects">
      <PageHeader
        actions={
          <Button>
            <PlusIcon />
            New project
          </Button>
        }
        description="Group docs, slides and sheets that belong together."
        title="Projects"
      />
      <EmptyState
        description="Create a project to keep related files together."
        icon={FolderIcon}
        title="No projects yet"
      />
    </AppShell>
  );
}

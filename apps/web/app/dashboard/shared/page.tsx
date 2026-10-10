import { ShareNetworkIcon } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <AppShell title="Shared with me">
      <PageHeader
        description="Files other people have shared with you."
        title="Shared with me"
      />
      <EmptyState
        description="Files other people share with you will show up here."
        icon={ShareNetworkIcon}
        title="Nothing shared with you"
      />
    </AppShell>
  );
}

import { AgentConsole } from "@/components/agent-console";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { listRuns } from "@/lib/agents/runs";
import { getUserId } from "@/lib/db/documents";

export default async function Page() {
  const runs = await listRuns(await getUserId());

  return (
    <AppShell title="Agents">
      <PageHeader
        description="Ask once and an agent researches, then writes a doc, a sheet and a deck together, in your voice. They arrive as suggestions you accept."
        title="Suite agents"
      />
      <AgentConsole initialRuns={runs} />
    </AppShell>
  );
}

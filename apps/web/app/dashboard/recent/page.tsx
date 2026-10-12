import { ClockIcon } from "@phosphor-icons/react/ssr";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

const DAY = 86_400_000;

const startOfUtcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export default async function Page() {
  const files = await listDocuments(await getUserId(), { limit: 100 });
  const today = startOfUtcDay(new Date());
  const groups = [
    {
      items: files.filter((file) => startOfUtcDay(file.updatedAt) >= today),
      title: "Today",
    },
    {
      items: files.filter((file) => {
        const day = startOfUtcDay(file.updatedAt);

        return day >= today - DAY && day < today;
      }),
      title: "Yesterday",
    },
    {
      items: files.filter((file) => startOfUtcDay(file.updatedAt) < today - DAY),
      title: "Earlier",
    },
  ].filter((group) => group.items.length > 0);

  return (
    <AppShell title="Recent">
      <PageHeader
        description="Files you opened or edited lately."
        title="Recent"
      />
      {groups.length === 0 ? (
        <EmptyState
          description="Files you open or edit show up here."
          icon={ClockIcon}
          title="Nothing recent"
        />
      ) : (
        groups.map((group) => (
          <section className="flex flex-col gap-2" key={group.title}>
            <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
              {group.title}
            </h2>
            <FileTable items={group.items} />
          </section>
        ))
      )}
    </AppShell>
  );
}

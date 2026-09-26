import { AppShell } from "@/components/app-shell";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { files } from "@/lib/sample-data";

const groups = [
  { items: files.slice(0, 2), title: "Today" },
  { items: files.slice(2, 4), title: "Yesterday" },
  { items: files.slice(4, 104), title: "Earlier" },
];

export default function Page() {
  return (
    <AppShell title="Recent">
      <PageHeader
        description="Files you opened or edited lately."
        title="Recent"
      />
      {groups.map((group) => (
        <section className="flex flex-col gap-2" key={group.title}>
          <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {group.title}
          </h2>
          <FileTable items={group.items} />
        </section>
      ))}
    </AppShell>
  );
}

import { FolderOpenIcon, UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FileTable } from "@/components/file-table";
import { PageHeader } from "@/components/page-header";
import { getUserId, listDocuments } from "@/lib/db/documents";

export default async function Page() {
  const files = await listDocuments(await getUserId());

  return (
    <AppShell title="My Files">
      <PageHeader
        actions={
          <Button variant="outline">
            <UploadSimpleIcon />
            Upload
          </Button>
        }
        description="Everything you have created or uploaded."
        title="My Files"
      />
      {files.length === 0 ? (
        <EmptyState
          description="Docs, presentations and sheets you create show up here."
          icon={FolderOpenIcon}
          title="No files yet"
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="doc">Docs</TabsTrigger>
            <TabsTrigger value="presentation">Presentations</TabsTrigger>
            <TabsTrigger value="sheet">Sheets</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <FileTable items={files} />
          </TabsContent>
          <TabsContent value="doc">
            <FileTable items={files.filter((file) => file.kind === "doc")} />
          </TabsContent>
          <TabsContent value="presentation">
            <FileTable
              items={files.filter((file) => file.kind === "presentation")}
            />
          </TabsContent>
          <TabsContent value="sheet">
            <FileTable items={files.filter((file) => file.kind === "sheet")} />
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}

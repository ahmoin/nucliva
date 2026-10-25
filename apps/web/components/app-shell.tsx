import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Omnibar } from "@/components/omnibar";
import { SandboxTour } from "@/components/sandbox-tour";

export function AppShell({
  children,
  title,
}: {
  children?: React.ReactNode;
  title: string;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* min-w-0 stops a wide toolbar from widening the whole page. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div
            className="ml-2 flex min-w-0 flex-1 items-center gap-3 overflow-x-auto"
            id="header-slot"
          />
        </header>
        <div className="@container flex min-w-0 flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
      <Omnibar />
      <SandboxTour />
    </SidebarProvider>
  );
}

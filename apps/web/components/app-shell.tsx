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
      {/* A flex item will not shrink below the width of its content unless it is told it may. Without min-w-0 here, a wide toolbar makes the whole page wider than the screen instead of scrolling inside the header. */}
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
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
      <Omnibar />
    </SidebarProvider>
  );
}

"use client";

import { PlusIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";
import { Wordmark } from "@/components/logo";
import { NavUser } from "@/components/nav-user";
import { authClient } from "@/lib/auth-client";
import {
  collectionItems,
  mainItems,
  newItems,
  workspaceItems,
} from "@/lib/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} size="lg">
              <Wordmark className="h-6! w-auto!" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="px-2 pt-2 pb-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton
                        className="group/new justify-center bg-primary font-semibold text-primary-foreground uppercase tracking-widest shadow-[0_0_24px_-6px_var(--primary)] transition-[box-shadow,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] hover:bg-primary/90 hover:text-primary-foreground hover:shadow-[0_0_32px_-4px_var(--primary)] aria-expanded:bg-primary aria-expanded:text-primary-foreground"
                        size="sm"
                      />
                    }
                  >
                    <PlusIcon
                      className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/new:rotate-90 group-aria-expanded/new:rotate-45"
                      weight="bold"
                    />
                    <span>New</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-48"
                    side={isMobile ? "bottom" : "right"}
                    sideOffset={4}
                  >
                    {newItems.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        onClick={() => router.push(item.href)}
                      >
                        <item.icon />
                        {item.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {collectionItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {session ? (
          <NavUser
            user={{
              avatar: session.user.image ?? "",
              email: session.user.email,
              name: session.user.name,
            }}
          />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              {isPending ? (
                <div className="flex h-12 items-center gap-2 px-2">
                  <Skeleton className="size-8" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ) : (
                <SidebarMenuButton render={<Link href="/login" />} size="lg">
                  Log in
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

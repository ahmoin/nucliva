"use client";

import { PlusIcon } from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import Link from "next/link";
import type * as React from "react";
import { Calendars } from "@/components/calendars";
import { DatePicker } from "@/components/date-picker";
import { NavUser } from "@/components/nav-user";
import { authClient } from "@/lib/auth-client";

// This is sample data.
const data = {
  calendars: [
    {
      items: ["Personal", "Work", "Family"],
      name: "My Calendars",
    },
    {
      items: ["Holidays", "Birthdays"],
      name: "Favorites",
    },
    {
      items: ["Travel", "Reminders", "Deadlines"],
      name: "Other",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.calendars} />
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
                <SidebarMenuSkeleton showIcon />
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

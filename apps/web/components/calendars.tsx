"use client";

import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import * as React from "react";

export function Calendars({
  calendars,
}: {
  calendars: {
    name: string;
    items: string[];
  }[];
}) {
  return (
    <>
      {calendars.map((calendar, index) => (
        <React.Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name}>
            <Collapsible
              className="group/collapsible"
              defaultOpen={index === 0}
            >
              <SidebarGroupLabel
                className="group/label w-full text-sidebar-foreground text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                render={<CollapsibleTrigger />}
              >
                {calendar.name}{" "}
                <CaretRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {calendar.items.map((item, index) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton>
                          <div
                            className="group/calendar-item flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-primary"
                            data-active={index < 2}
                          >
                            <CheckIcon className="hidden size-3 group-data-[active=true]/calendar-item:block" />
                          </div>
                          {item}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </React.Fragment>
      ))}
    </>
  );
}

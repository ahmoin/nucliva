import { Calendar } from "@workspace/ui/components/calendar";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import * as React from "react";

export function DatePicker() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12)
  );
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        <Calendar
          captionLayout="dropdown"
          className="bg-transparent [--cell-size:2.1rem]"
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

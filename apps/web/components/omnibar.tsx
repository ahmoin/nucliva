"use client";

import { UserIcon } from "@phosphor-icons/react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collectionItems,
  mainItems,
  newItems,
  workspaceItems,
} from "@/lib/navigation";

export function Omnibar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      className="data-closed:animate-none data-open:animate-none"
      onOpenChange={setOpen}
      open={open}
    >
      <CommandInput placeholder="Search or jump to..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {[
            ...mainItems,
            ...collectionItems,
            ...newItems,
            ...workspaceItems,
          ].map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => go("/dashboard/profile")}>
            <UserIcon />
            Profile
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

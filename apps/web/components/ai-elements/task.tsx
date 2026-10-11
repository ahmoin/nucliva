"use client";

import { CaretDownIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";

// The Task element from AI Elements: a step of work with what it found or did
// folded under it.
export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 border bg-secondary px-1.5 py-0.5 text-foreground text-xs",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div">;

export const TaskItem = ({ children, className, ...props }: TaskItemProps) => (
  <div className={cn("text-muted-foreground text-sm", className)} {...props}>
    {children}
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}: TaskTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "group flex w-full cursor-pointer items-center gap-2 text-left text-muted-foreground text-sm transition-colors hover:text-foreground",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        <MagnifyingGlassIcon className="size-4 shrink-0" />
        <p className="text-sm">{title}</p>
        <CaretDownIcon className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180" />
      </>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "text-popover-foreground outline-none data-open:fade-in-0 data-open:slide-in-from-top-2 data-open:animate-in",
      className
    )}
    {...props}
  >
    <div className="mt-3 space-y-2 border-muted border-l-2 pl-4">
      {children}
    </div>
  </CollapsibleContent>
);

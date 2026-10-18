"use client";

import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";

// What an agent made for a sheet or a deck is shown in place, and is only
// saved once it is kept.
export function PendingReview({
  busy,
  onDiscard,
  onKeep,
  what,
}: {
  busy: boolean;
  onDiscard: () => void;
  onKeep: () => void;
  what: string;
}) {
  return (
    <div
      className="motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 flex flex-wrap items-center gap-3 border border-primary/40 bg-primary/5 px-4 py-3 text-sm motion-safe:animate-in motion-safe:duration-200"
      role="status"
    >
      <SparkleIcon className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">The agent suggested this {what}.</span>{" "}
        <span className="text-muted-foreground">
          Change anything you like, then keep it or throw it away.
        </span>
      </p>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={onDiscard} size="sm" variant="outline">
          Reject
        </Button>
        <Button disabled={busy} onClick={onKeep} size="sm">
          Accept
        </Button>
      </div>
    </div>
  );
}

"use client";

import { ArrowRightIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

// Opens a ready-made workspace for a solution, with no sign up: the visitor
// lands in a document of notes with the request for that solution waiting.
export function TrySandboxButton({
  category,
  example,
}: {
  category: string;
  example: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/sandbox", {
        body: JSON.stringify({ category, example }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!(response.ok && data?.url)) {
        setError(data?.error ?? "Could not start the sandbox. Try again.");
        setBusy(false);

        return;
      }

      router.push(data.url);
    } catch {
      setError("Could not start the sandbox. Try again.");
      setBusy(false);
    }
  }, [category, example, router]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="h-11 px-6"
        disabled={busy}
        onClick={start}
        size="lg"
      >
        {busy ? "Setting up your workspace" : "Try it now"}
        {busy ? (
          <CircleNotchIcon className="animate-spin" />
        ) : (
          <ArrowRightIcon />
        )}
      </Button>
      <p className="text-muted-foreground text-xs">
        {error ?? "No sign up needed. Your own workspace, ready in a second."}
      </p>
    </div>
  );
}

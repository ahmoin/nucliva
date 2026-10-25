"use client";

import { ArrowRightIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function TrySandboxButton({
  category,
  example,
  hint = true,
  label = "Try it now",
  variant = "default",
}: {
  category: string;
  example: string;
  hint?: boolean;
  label?: string;
  variant?: "default" | "outline";
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

  const caption = busy ? "Setting up your workspace" : label;
  const note =
    error ??
    (hint ? "No sign up needed. Your own workspace, ready in a second." : null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="h-11 px-6"
        disabled={busy}
        onClick={start}
        size="lg"
        variant={variant}
      >
        {caption}
        {busy ? (
          <CircleNotchIcon className="animate-spin" />
        ) : (
          <ArrowRightIcon />
        )}
      </Button>
      {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
    </div>
  );
}

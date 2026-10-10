"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export const documentRoutes = {
  doc: "/dashboard/docs",
  sheet: "/dashboard/sheets",
  slides: "/dashboard/presentations",
};

export function NewDocButton({
  kind = "doc",
  label = "New doc",
}: {
  kind?: "doc" | "sheet" | "slides";
  label?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = useCallback(async () => {
    setCreating(true);

    try {
      const response = await fetch("/api/documents", {
        body: JSON.stringify({ kind }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not create document");
      }

      const { id }: { id: string } = await response.json();

      router.push(`${documentRoutes[kind]}/${id}`);
    } catch {
      setCreating(false);
    }
  }, [kind, router]);

  return (
    <Button disabled={creating} onClick={create}>
      <PlusIcon />
      {label}
    </Button>
  );
}

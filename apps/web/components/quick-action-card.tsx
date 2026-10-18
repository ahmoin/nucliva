"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { documentRoutes } from "@/components/new-doc-button";

export function QuickActionCard({
  description,
  icon,
  kind,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  kind: "doc" | "sheet" | "slides";
  title: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = useCallback(async () => {
    if (creating) {
      return;
    }

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
  }, [creating, kind, router]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      create();
    },
    [create]
  );

  return (
    <Card className="min-w-0 cursor-pointer" onClick={create} size="sm">
      <CardHeader>
        {icon}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button
          disabled={creating}
          onClick={handleButtonClick}
          size="sm"
          variant="outline"
        >
          {creating ? "Creating..." : "Create"}
        </Button>
      </CardFooter>
    </Card>
  );
}

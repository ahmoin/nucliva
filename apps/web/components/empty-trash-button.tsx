"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function EmptyTrashButton() {
  const router = useRouter();
  const [emptying, setEmptying] = useState(false);

  const empty = useCallback(async () => {
    setEmptying(true);
    await fetch("/api/documents", { method: "DELETE" });
    router.refresh();
    setEmptying(false);
  }, [router]);

  return (
    <Button disabled={emptying} onClick={empty} variant="destructive">
      <TrashIcon />
      Empty trash
    </Button>
  );
}

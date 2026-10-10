"use client";

import { Kbd } from "@workspace/ui/components/kbd";
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const isTyping = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
  );
};

export function Hotkeys({ keys }: { keys: Record<string, string> }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat ||
        isTyping(event.target)
      ) {
        return;
      }

      const target = keys[event.key.toLowerCase()];

      if (!target) {
        return;
      }

      event.preventDefault();

      if (target.startsWith("#")) {
        document
          .querySelector(target)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      router.push(target);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keys, router]);

  return null;
}

export function KeyHint({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <Kbd
      className={cn(
        "ml-1 h-5 min-w-5 bg-current/15 text-[10px] text-current [@media(pointer:coarse)]:hidden",
        className
      )}
    >
      {children}
    </Kbd>
  );
}

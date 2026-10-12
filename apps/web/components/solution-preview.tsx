import { cn } from "@workspace/ui/lib/utils";
import type { Kind } from "@/lib/content/solutions";

const line = "h-1.5 bg-foreground/15";
const added = "bg-emerald-500/60";
const removed =
  "relative bg-red-500/40 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-red-500";

// What asking Nucliva looks like: the words someone typed, and under them the
// start of the file that comes back, with the changes it made marked in green
// and red like the suggestions in the editor.
export function SolutionPreview({
  className,
  kind,
  prompt,
}: {
  className?: string;
  kind: Kind;
  prompt?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-16/10 overflow-hidden border-b bg-muted/40",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,var(--primary),transparent_60%)] opacity-[0.07]" />
      <div className="absolute inset-x-3 top-3 flex items-center gap-2 border bg-background/90 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        <span className="truncate">{prompt ?? "Write this for me"}</span>
      </div>
      <div className="absolute inset-x-6 top-14 bottom-0 flex flex-col gap-2 border-x border-t bg-background p-3 shadow-sm transition-transform duration-300 ease-out group-hover:-translate-y-1">
        {kind === "Doc" ? (
          <>
            <div className="h-2 w-2/3 bg-primary/70" />
            <div className={cn(line, "w-full")} />
            <div className="flex gap-1">
              <div className={cn(line, "w-1/3")} />
              <div className={cn("h-1.5 w-1/4", added)} />
              <div className={cn(line, "w-1/5")} />
            </div>
            <div className="flex gap-1">
              <div className={cn(line, "w-1/4")} />
              <div className={cn("h-1.5 w-1/5", removed)} />
              <div className={cn("h-1.5 w-1/4", added)} />
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn(line, "w-3/4")} />
              <span className="font-mono text-[8px] text-primary">[1]</span>
            </div>
            <div className="mt-1 h-2 w-1/2 bg-foreground/25" />
            <div className={cn(line, "w-5/6")} />
          </>
        ) : null}
        {kind === "Slides" ? (
          <>
            <div className="h-2.5 w-1/2 bg-primary/70" />
            <div className={cn(line, "w-2/3")} />
            <div className="mt-auto flex items-end gap-1.5">
              <div className="h-4 w-4 bg-primary/30" />
              <div className="h-7 w-4 bg-primary/50" />
              <div className="h-5 w-4 bg-primary/40" />
              <div className={cn("h-9 w-4", added)} />
              <div className={cn("ml-auto h-1.5 w-1/4", removed)} />
            </div>
          </>
        ) : null}
        {kind === "Sheet" ? (
          <div className="grid grid-cols-4 gap-px border bg-border">
            {Array.from({ length: 16 }, (_, index) => (
              <div
                className={cn(
                  "h-3.5 bg-background",
                  index < 4 && "bg-primary/20",
                  index >= 8 && index < 12 && "bg-emerald-500/20",
                  index === 6 && "bg-red-500/25"
                )}
                // biome-ignore lint/suspicious/noArrayIndexKey: the cells are all alike
                key={index}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

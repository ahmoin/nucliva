import { cn } from "@workspace/ui/lib/utils";
import { LogoMark } from "@/components/logo";

// The Nucliva "chip". It starts dim and small and reacts to the nearest
// ancestor with `group` and `data-active="true"`: it scales up, the logo goes
// to full color and a light travels around its edge.
export function Chip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-square scale-[0.85] overflow-hidden p-[1.5px] transition-transform duration-500 ease-out group-data-[active=true]:scale-100 group-data-[active=true]:shadow-[0_24px_40px_-12px_color-mix(in_oklab,var(--primary)_35%,transparent)]",
        className
      )}
    >
      <div className="absolute -inset-1/2 bg-[conic-gradient(from_0deg,transparent_60%,color-mix(in_oklab,var(--primary)_80%,transparent)_85%,transparent)] opacity-0 transition-opacity duration-1000 group-data-[active=true]:opacity-100 motion-safe:animate-[spin_8s_linear_infinite]" />
      <div className="relative flex size-full items-center justify-center border bg-card bg-gradient-to-br from-foreground/[0.08] via-transparent to-primary/[0.06] shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--foreground)_14%,transparent)] transition-colors duration-500 group-data-[active=true]:border-transparent">
        <LogoMark className="size-1/2 opacity-30 grayscale transition-all duration-300 group-data-[active=true]:opacity-100 group-data-[active=true]:drop-shadow-[0_0_14px_color-mix(in_oklab,var(--primary)_60%,transparent)] group-data-[active=true]:grayscale-0" />
      </div>
    </div>
  );
}

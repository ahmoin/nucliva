"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chip } from "@/components/chip";

const leftLanes = [90, 200, 310];

const lanePath = (y: number) => `M0 ${y} C 260 ${y}, 340 200, 600 200`;

// The lights come in from the left, reach the chip and nothing comes out the
// other side, because the page they were looking for does not exist.
export function NotFoundScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => setPulse((current) => !current), 1800);

    return () => clearInterval(id);
  }, []);

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current as HTMLDivElement | null;

      if (!el) {
        return;
      }

      const rect = el.getBoundingClientRect();

      el.style.setProperty("--x", `${event.clientX - rect.left}px`);
      el.style.setProperty("--y", `${event.clientY - rect.top}px`);
    },
    []
  );

  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      className="group relative w-full max-w-5xl select-none"
      data-active={hovered || pulse}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerMove={handleMove}
      ref={ref}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 [background:radial-gradient(360px_circle_at_var(--x,50%)_var(--y,50%),color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)] group-hover:opacity-100" />
      <svg
        aria-hidden
        className="absolute inset-0 size-full [mask-image:linear-gradient(to_right,transparent,#000_18%,#000_82%,transparent)]"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Lines that lead to a chip and stop</title>
        {leftLanes.map((y) => (
          <path
            className="stroke-foreground/15"
            d={lanePath(y)}
            key={y}
            strokeWidth="1"
          />
        ))}
        {leftLanes.map((y) => (
          <path
            className="stroke-foreground/15"
            d={`M600 200 C 860 200, 940 ${y}, 1200 ${y}`}
            key={`out-${y}`}
            strokeWidth="1"
          />
        ))}
        <circle
          className="fill-primary drop-shadow-[0_0_6px_var(--primary)] motion-reduce:hidden"
          r="3.5"
        >
          <animateMotion
            calcMode="spline"
            dur="3.6s"
            keySplines="0.16 1 0.3 1"
            keyTimes="0;1"
            path={lanePath(90)}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            dur="3.6s"
            keyTimes="0;0.08;0.7;1"
            repeatCount="indefinite"
            values="0;1;1;0"
          />
        </circle>
      </svg>
      <div className="relative flex items-center justify-center bg-linear-to-b from-foreground to-foreground/25 bg-clip-text font-bold font-heading text-[clamp(7rem,26vw,20rem)] text-transparent leading-none tracking-tighter">
        <span>4</span>
        <span className="mx-[0.04em] inline-flex size-[0.67em] items-center justify-center">
          <Chip className="size-full" />
        </span>
        <span>4</span>
      </div>
    </div>
  );
}

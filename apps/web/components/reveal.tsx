"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

// Fades and lifts every `[data-reveal]` child (or the wrapper itself when
// there are none) into place, staggered, once the block scrolls into view.
export function Reveal({
  children,
  className,
  id,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current as HTMLDivElement | null;

    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const marked = Array.from(root.querySelectorAll("[data-reveal]"));
    const targets = marked.length > 0 ? marked : [root];

    gsap.set(targets, { opacity: 0, y: 24 });

    const tween = gsap.to(targets, {
      duration: 1,
      ease: "expo.out",
      opacity: 1,
      scrollTrigger: { once: true, start: "top 85%", trigger: root },
      stagger,
      y: 0,
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [stagger]);

  return (
    <div className={className} id={id} ref={ref}>
      {children}
    </div>
  );
}

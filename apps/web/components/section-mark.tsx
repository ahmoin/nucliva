"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

// Where each light comes from (below the mark) and where it settles.
const lanes = {
  center: { d: "M38.5 80.77V-20", rest: 0.62 },
  left: {
    d: "M22.63 80.77V38.79C22.63 25.38 17.37 12.52 8 3.03L-20 -20",
    rest: 0.55,
  },
  right: {
    d: "M54.37 80.77V38.79C54.37 25.38 59.63 12.52 69 3.03L90 -20",
    rest: 0.5,
  },
};

// A small three-line mark that sits above a section title. Each section lights
// a different line: when the mark scrolls into view a light rises up that line
// and settles part way along it.
export function SectionMark({
  lane = "left",
}: {
  lane?: "left" | "center" | "right";
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { d, rest } = lanes[lane];

  useEffect(() => {
    const svg = ref.current as SVGSVGElement | null;
    const path = svg?.querySelector<SVGPathElement>("[data-travel]");
    const grad = svg?.querySelector<SVGRadialGradientElement>("[data-grad]");
    const dot = svg?.querySelector<SVGCircleElement>("[data-dot]");
    const halo = svg?.querySelector<SVGCircleElement>("[data-halo]");
    const lit = svg?.querySelector<SVGPathElement>("[data-lit]");

    if (!(svg && path && grad && dot && halo && lit)) {
      return;
    }

    const length = path.getTotalLength();
    const state = { p: 0 };
    const glow = [dot, halo, lit];

    const render = () => {
      const { x, y } = path.getPointAtLength(state.p * length);

      for (const circle of [dot, halo]) {
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
      }
      grad.setAttribute("cx", String(x));
      grad.setAttribute("cy", String(y));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      state.p = rest;
      render();
      return;
    }

    render();
    gsap.set(glow, { opacity: 0 });

    const tl = gsap
      .timeline({
        scrollTrigger: { once: true, start: "top 85%", trigger: svg },
      })
      .to(glow, { duration: 0.5, opacity: 1 }, 0)
      .to(
        state,
        { duration: 2, ease: "expo.out", onUpdate: render, p: rest },
        0
      );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [rest]);

  return (
    <svg
      aria-hidden
      className="h-[61px] w-[70px] overflow-visible"
      fill="none"
      ref={ref}
      viewBox="3.5 0 70 61"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Decorative lines</title>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="section-mark-lines"
          x1="38.5"
          x2="38.5"
          y1="0.77"
          y2="60.77"
        >
          <stop
            offset="0"
            style={{ stopColor: "var(--foreground)", stopOpacity: 0 }}
          />
          <stop
            offset="0.5"
            style={{ stopColor: "var(--foreground)", stopOpacity: 0.35 }}
          />
          <stop
            offset="1"
            style={{ stopColor: "var(--foreground)", stopOpacity: 0 }}
          />
        </linearGradient>
        <radialGradient
          data-grad
          gradientUnits="userSpaceOnUse"
          id={`section-mark-lit-${lane}`}
          r="34"
        >
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop
            offset="0.45"
            style={{ stopColor: "var(--primary)", stopOpacity: 0.4 }}
          />
          <stop
            offset="1"
            style={{ stopColor: "var(--primary)", stopOpacity: 0 }}
          />
        </radialGradient>
      </defs>
      <path
        d="M38.5 0.77V60.52M22.63 60.77V38.79C22.63 25.38 17.37 12.52 8 3.03M54.37 60.77V38.79C54.37 25.38 59.63 12.52 69 3.03"
        stroke="url(#section-mark-lines)"
        strokeWidth="2"
      />
      <path d={d} data-travel stroke="none" />
      <path
        d={d}
        data-lit
        stroke={`url(#section-mark-lit-${lane})`}
        strokeWidth="2"
      />
      <circle className="fill-primary/15" data-halo r="9" />
      <circle className="fill-primary" data-dot r="2.5" />
    </svg>
  );
}

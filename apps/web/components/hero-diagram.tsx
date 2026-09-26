"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { Chip } from "@/components/chip";

gsap.registerPlugin(ScrollTrigger);

const CHIP_LEFT = 545;
const CHIP_RIGHT = 655;
const CENTER_Y = 180;
const LANE = 11;

const inputs = [
  { label: "voice-samples.md", y: 1 },
  { label: "tavily.com", y: 92 },
  { label: "old-essay.docx", y: 143 },
  { label: "notes.txt", y: 180 },
  { label: "nebius.com", y: 217 },
  { label: "blog-post.html", y: 268 },
  { label: "emails.mbox", y: 359 },
];

const outputs = [
  { label: "Doc", y: 95 },
  { label: "Slides", y: 180 },
  { label: "Sheet", y: 265 },
];

// The bundle of parallel lanes next to the chip fans out toward the edge.
const inputPath = (y: number, index: number) => {
  const lane = CENTER_Y + (index - 3) * LANE;

  return `M0 ${y} C 170 ${y}, 220 ${lane}, 360 ${lane} L ${CHIP_LEFT} ${lane}`;
};

const outputPath = (y: number, index: number) => {
  const lane = CENTER_Y + (index - 1) * LANE;

  return `M${CHIP_RIGHT} ${lane} L 840 ${lane} C 980 ${lane}, 1030 ${y}, 1200 ${y}`;
};

// A node is one line with a soft light travelling along it. GSAP tweens a
// plain number (`state.p`, 0 to 1) and `render` derives everything from it:
// the dot, its halo, the lit part of the line (a radial gradient centred on
// the dot) and the label. No per-frame React state.
function createNode(group: SVGGElement) {
  const base = group.querySelector<SVGPathElement>("[data-base]");
  const grad = group.querySelector<SVGRadialGradientElement>("[data-grad]");
  const dot = group.querySelector<SVGCircleElement>("[data-dot]");
  const halo = group.querySelector<SVGCircleElement>("[data-halo]");
  const label = group.querySelector<SVGTextElement>("[data-label]");
  const lit = group.querySelector<SVGPathElement>("[data-lit]");

  if (!(base && grad && dot && halo && label && lit)) {
    return null;
  }

  const length = base.getTotalLength();
  const state = { p: 0 };
  const glow = [dot, halo, lit];

  const render = () => {
    const { x, y } = base.getPointAtLength(state.p * length);

    for (const circle of [dot, halo]) {
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
    }
    grad.setAttribute("cx", String(x));
    grad.setAttribute("cy", String(y));
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y + 12));
  };

  const reset = () => {
    state.p = 0;
    render();
  };

  gsap.set([...glow, label], { opacity: 0 });
  render();

  return { glow, label, render, reset, state };
}

type Node = NonNullable<ReturnType<typeof createNode>>;

const travel = (node: Node, p: number, duration: number, ease: string) => ({
  duration,
  ease,
  onUpdate: node.render,
  p,
});

// Fast start that decelerates (expo.out) toward ~55% of the line, a beat with
// the label showing, then an accelerating pull (power3.in) into the chip.
function inbound(node: Node) {
  return gsap
    .timeline()
    .call(node.reset, [], 0)
    .to(node.glow, { duration: 0.3, opacity: 1 }, 0)
    .to(node.state, travel(node, 0.5 + Math.random() * 0.1, 1, "expo.out"), 0)
    .to(node.label, { duration: 0.3, opacity: 1 }, 0.2)
    .to(node.state, travel(node, 1, 1.2, "power3.in"), 1.2)
    .to(node.label, { duration: 0.2, opacity: 0 }, 1.6)
    .to(node.glow, { duration: 0.3, opacity: 0 }, 1.9);
}

// Leaves the chip fast, coasts with its label, then accelerates off the edge.
function outbound(node: Node, index: number) {
  return gsap
    .timeline()
    .call(node.reset, [], 0)
    .to(node.glow, { duration: 0.3, opacity: 1 }, 0)
    .to(
      node.state,
      travel(node, (0.7 / 3) * (index + 1) + 0.05, 1.5, "expo.out"),
      0
    )
    .to(node.label, { duration: 0.3, opacity: 1 }, 0.4)
    .to(node.state, travel(node, 1, 1.5, "power3.in"), 2)
    .to(node.label, { duration: 0.2, opacity: 0 }, 2.5)
    .to(node.glow, { duration: 0.3, opacity: 0 }, 3.2);
}

function pickThree(count: number) {
  const indexes = Array.from({ length: count }, (_, index) => index);

  return gsap.utils.shuffle(indexes).slice(0, 3);
}

function Lane({
  d,
  id,
  kind,
  label,
}: {
  d: string;
  id: string;
  kind: "in" | "out";
  label: string;
}) {
  return (
    <g data-kind={kind}>
      <defs>
        <radialGradient
          data-grad
          gradientUnits="userSpaceOnUse"
          id={`lit-${id}`}
          r="90"
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
      <path className="stroke-foreground/15" d={d} data-base strokeWidth="1" />
      <path d={d} data-lit stroke={`url(#lit-${id})`} strokeWidth="1.6" />
      <circle className="fill-primary/15" data-halo r="13" />
      <circle className="fill-primary" data-dot r="3" />
      <text
        className="fill-muted-foreground stroke-[5px] stroke-background font-sans [paint-order:stroke]"
        data-label
        fontSize="11"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

export function HeroDiagram() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current as HTMLDivElement | null;

    if (!root) {
      return;
    }

    const toNodes = (selector: string) =>
      Array.from(root.querySelectorAll<SVGGElement>(selector))
        .map((group) => createNode(group))
        .filter((node): node is Node => node !== null);

    const inNodes = toNodes('[data-kind="in"]');
    const outNodes = toNodes('[data-kind="out"]');
    const setActive = (active: boolean) => {
      root.dataset.active = String(active);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }

    let timeline: gsap.core.Timeline | undefined;

    const play = () => {
      const tl = gsap.timeline({ onComplete: play });

      for (const [order, index] of pickThree(inNodes.length).entries()) {
        const node = inNodes[index];

        if (node) {
          tl.add(inbound(node), order * 0.2);
        }
      }

      tl.call(setActive, [true], ">-0.2").addLabel("showOutput");

      for (const [index, node] of outNodes.entries()) {
        tl.add(outbound(node, index), `showOutput+=${0.1 * index}`);
      }

      tl.call(setActive, [false], ">-0.6").to({}, { duration: 0.4 });
      timeline = tl;
    };

    const trigger = ScrollTrigger.create({
      once: true,
      onEnter: play,
      start: "center 100%",
      trigger: root,
    });

    return () => {
      trigger.kill();
      timeline?.kill();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="group pointer-events-none relative mx-auto aspect-[10/3] w-full max-w-6xl select-none [mask-image:linear-gradient(to_right,transparent,#000_14%,#000_86%,transparent)]"
      data-active="false"
      ref={rootRef}
    >
      <div className="absolute top-1/2 left-1/2 h-4/5 w-3/5 -translate-x-1/2 -translate-y-1/2 bg-primary/25 opacity-30 blur-3xl transition-opacity duration-1000 [mask-image:radial-gradient(ellipse_at_center,#000_15%,transparent_70%)] group-data-[active=true]:opacity-100" />
      <svg
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
        viewBox="0 0 1200 360"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>
          Sources flow into Nucliva and come out as docs, slides and sheets
        </title>
        {inputs.map((input, index) => (
          <Lane
            d={inputPath(input.y, index)}
            id={`in-${input.label}`}
            key={input.label}
            kind="in"
            label={input.label}
          />
        ))}
        {outputs.map((output, index) => (
          <Lane
            d={outputPath(output.y, index)}
            id={`out-${output.label}`}
            key={output.label}
            kind="out"
            label={output.label}
          />
        ))}
      </svg>
      <Chip className="absolute top-1/2 left-1/2 w-[11%] -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

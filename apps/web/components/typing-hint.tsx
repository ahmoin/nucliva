"use client";

import { useEffect, useState } from "react";

const requests = [
  "an investor update from my notes",
  "a pitch deck for a seed round",
  "a study guide for my biology exam",
  "a client report with sources",
  "a press release for our launch",
  "a content calendar for next quarter",
];

interface Typing {
  deleting: boolean;
  index: number;
  length: number;
}

const WRITE_MS = 55;
const ERASE_MS = 24;
const HOLD_MS = 1600;
const GAP_MS = 350;

const next = (state: Typing): Typing => {
  const full = (requests[state.index] ?? "").length;

  if (!state.deleting) {
    return state.length >= full
      ? { ...state, deleting: true }
      : { ...state, length: state.length + 1 };
  }

  return state.length <= 0
    ? { deleting: false, index: (state.index + 1) % requests.length, length: 0 }
    : { ...state, length: state.length - 1 };
};

const delayFor = (state: Typing) => {
  const full = (requests[state.index] ?? "").length;

  if (state.deleting) {
    return state.length <= 0 ? GAP_MS : ERASE_MS;
  }

  return state.length >= full ? HOLD_MS : WRITE_MS;
};

export function TypingHint({ className }: { className?: string }) {
  const [state, setState] = useState<Typing>({
    deleting: false,
    index: 0,
    length: 0,
  });
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (still) {
      return;
    }

    const timer = setTimeout(() => setState(next), delayFor(state));

    return () => clearTimeout(timer);
  }, [state, still]);

  const request = requests[still ? 0 : state.index] ?? "";

  return (
    <span aria-hidden className={className}>
      Write {still ? request : request.slice(0, state.length)}
      <span className="ml-0.5 inline-block h-[1.1em] w-px translate-y-[0.2em] bg-primary motion-safe:animate-pulse" />
    </span>
  );
}

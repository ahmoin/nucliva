"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  QuestionIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type TourState,
  tour,
  useTourState,
} from "@/components/sandbox-tour-store";
import { authClient } from "@/lib/auth/client";

// A walk through the sandbox that the person does, not reads. Everything but
// the thing to use is dimmed and cannot be clicked, each step waits until it
// has been done, and the later steps send them around the rest of the app. It
// can be skipped, closed and opened again, so nobody is ever stuck in it.

const STORAGE_KEY = "nucliva-tour";
const DOCUMENT = /^\/dashboard\/(docs|sheets|presentations)\/[^/]+$/;
const SHEET_OR_DECK = /\/dashboard\/(sheets|presentations)\//;
const PADDING = 8;
const ADVANCE_AFTER = 900;
const POLL_EVERY = 200;

interface Context extends TourState {
  // The last document the person had open, which is not another document.
  lastDoc: string;
  path: string;
  // What things were like when this step began.
  start: { changes: number; path: string; ripple: number; step: number };
}

type Target = string | ((context: Context) => DOMRect | null);

interface Step {
  // Something to press in the card, for a step with nothing on the page to use.
  action?: { label: string; run: () => void };
  // What to do, shown with a mark that turns into a tick when it is done.
  ask?: string;
  body: string;
  // Whether the step has been done. A step without this has a Next button.
  done?: (context: Context) => boolean;
  target?: Target;
  title: string;
}

const visible = (box: DOMRect | null | undefined) =>
  box && box.width > 0 && box.height > 0 ? box : null;

const rectOf = (selector: string) =>
  visible(document.querySelector(selector)?.getBoundingClientRect());

// A file in the list of files that is not the one they have been writing in.
function otherFile(context: Context) {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      'table a[href^="/dashboard/"]'
    ),
  ];
  const link =
    links.find((item) => SHEET_OR_DECK.test(item.getAttribute("href") ?? "")) ??
    links.find((item) => item.getAttribute("href") !== context.lastDoc);

  return visible(link?.closest("tr")?.getBoundingClientRect());
}

const steps: Step[] = [
  {
    body: "A real workspace for this line of work: files, a deck, a sheet and writing samples. There are five things worth trying, and it takes about two minutes. You do each one, and Nucliva waits for you.",
    title: "Welcome to the sandbox",
  },
  {
    ask: "Press Enter to send it",
    body: "Your request is already typed in. Nucliva writes it from the notes above, in the voice of the writing samples in this workspace.",
    done: ({ changes, start }) => changes > start.changes,
    target: '[aria-label="What should we write?"]',
    title: "Ask Nucliva",
  },
  {
    ask: "Click Accept All",
    body: "Every change is in your document in green and red. Nothing goes in until you say so, and you can take each one or all of them.",
    done: ({ changes, start }) => changes < start.changes,
    target: 'button[data-accept="true"]:not([data-change])',
    title: "You decide what goes in",
  },
  {
    action: {
      label: "Add the example",
      run: () => tour.addExample?.(),
    },
    ask: "Click the button to add it",
    body: "Nucliva keeps facts in step across a document. Here is one number written three different ways. Add it, then change it.",
    done: ({ example }) => example,
    title: "Now the clever part",
  },
  {
    ask: "Change the first number, then wait a moment",
    body: "In the first line, change $4,200,000 to $4,500,000. Nucliva needs a few seconds to read the lines before it can follow your change.",
    done: ({ ripple, start }) => ripple > start.ripple,
    target: () => visible(tour.exampleBox?.()),
    title: "Change a number",
  },
  {
    ask: "Press Tab to take the next one",
    body: "The other two lines now suggest the new amount, each in its own style: $4.5M stays short and 4.5 million dollars stays long. Tab takes them one by one, and Esc turns them all down.",
    done: ({ ripple, start }) => ripple < start.ripple,
    target: () => visible(tour.exampleBox?.()),
    title: "It found the others",
  },
  {
    ask: "Open My Files",
    body: "This sandbox came with dozens of files: documents, a sheet and a deck. They are all in My Files.",
    done: ({ path }) => path === "/dashboard/my-files",
    target: 'a[href="/dashboard/my-files"]',
    title: "Look around the workspace",
  },
  {
    ask: "Click a file to open it",
    body: "Open the sheet or the deck, or any document. They are real: the sheet is a spreadsheet and the deck is a slide editor.",
    done: ({ path, start }) => DOCUMENT.test(path) && path !== start.path,
    target: otherFile,
    title: "Open another file",
  },
  {
    ask: "Open Style Profile",
    body: "This is where Nucliva's voice comes from: the writing samples it matches. Add your own and every draft sounds more like you.",
    done: ({ path }) => path === "/dashboard/style-profile",
    target: 'a[href="/dashboard/style-profile"]',
    title: "See where the voice comes from",
  },
  {
    ask: "Open Knowledge Base",
    body: "And this is what it can draw on besides the web: the sources indexed from your workspace.",
    done: ({ path }) => path === "/dashboard/knowledge-base",
    target: 'a[href="/dashboard/knowledge-base"]',
    title: "What it knows",
  },
  {
    body: "You asked, reviewed, kept a fact in step and looked around. Everything here is yours to keep: sign up and it all moves to your account.",
    title: "That is the loop",
  },
];

interface Box {
  height: number;
  left: number;
  top: number;
  vh: number;
  vw: number;
  width: number;
}

const toBox = (rect: DOMRect): Box => ({
  height: rect.height + PADDING * 2,
  left: rect.left - PADDING,
  top: rect.top - PADDING,
  vh: window.innerHeight,
  vw: window.innerWidth,
  width: rect.width + PADDING * 2,
});

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5 &&
    a.vw === b.vw &&
    a.vh === b.vh);

// Where the thing a step points at is on the screen, kept up to date as the
// page moves and as the thing turns up. It is brought into view once.
function useBox(step: Step, context: Context, active: boolean) {
  const [box, setBox] = useState<Box | null>(null);
  const latest = useRef(context);
  const { target } = step;

  latest.current = context;

  useEffect(() => {
    if (!(target && active)) {
      setBox(null);

      return;
    }

    let scrolled = false;

    const measure = () => {
      const rect =
        typeof target === "string" ? rectOf(target) : target(latest.current);

      if (rect && !scrolled && typeof target === "string") {
        scrolled = true;
        document
          .querySelector(target)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const next = rect ? toBox(rect) : null;

      setBox((previous) => (sameBox(previous, next) ? previous : next));
    };

    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    const poll = setInterval(measure, POLL_EVERY);

    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      clearInterval(poll);
    };
  }, [active, target]);

  return box;
}

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as {
      done?: boolean;
      step?: number;
    } | null;

    return {
      done: saved?.done === true,
      step: Math.min(Math.max(0, saved?.step ?? 0), steps.length - 1),
    };
  } catch {
    return { done: false, step: 0 };
  }
};

const remember = (value: { done: boolean; step: number }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // The tour still works. It just comes back next time.
  }
};

const dim = "bg-black/65";
const move =
  "transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

// Everything is dimmed except the thing to use, which has a ring around it. The
// dimmed part takes clicks, so that only the highlighted thing can be used.
function Spotlight({
  blocking,
  box,
  onBlocked,
}: {
  blocking: boolean;
  box: Box | null;
  onBlocked: () => void;
}) {
  const catches = blocking ? "" : "pointer-events-none";

  if (!box) {
    return (
      <div
        aria-hidden
        className={cn(
          "motion-safe:fade-in-0 fixed inset-0 z-[60] motion-safe:animate-in motion-safe:duration-300",
          dim,
          catches
        )}
        onPointerDown={onBlocked}
      />
    );
  }

  const right = box.left + box.width;
  const bottom = box.top + box.height;
  const panel = (style: React.CSSProperties) => (
    <div
      aria-hidden
      className={cn("fixed z-[60]", dim, move, catches)}
      onPointerDown={onBlocked}
      style={style}
    />
  );

  return (
    <>
      {panel({ height: Math.max(0, box.top), left: 0, top: 0, width: box.vw })}
      {panel({
        height: Math.max(0, box.vh - bottom),
        left: 0,
        top: bottom,
        width: box.vw,
      })}
      {panel({
        height: box.height,
        left: 0,
        top: box.top,
        width: Math.max(0, box.left),
      })}
      {panel({
        height: box.height,
        left: right,
        top: box.top,
        width: Math.max(0, box.vw - right),
      })}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed z-[61] border-2 border-primary shadow-[0_0_24px_2px_color-mix(in_oklab,var(--primary)_55%,transparent)]",
          move
        )}
        style={{
          height: box.height,
          left: box.left,
          top: box.top,
          width: box.width,
        }}
      >
        <span className="absolute -inset-1 border border-primary/60 motion-safe:animate-pulse" />
      </div>
    </>
  );
}

// How far along the tour is, as a row of bars.
function Progress({ index }: { index: number }) {
  return (
    <div aria-hidden className="flex flex-1 gap-1">
      {steps.map((item, at) => (
        <span
          className={cn(
            "h-1 flex-1 transition-colors duration-300",
            at <= index ? "bg-primary" : "bg-muted-foreground/25"
          )}
          key={item.title}
        />
      ))}
    </div>
  );
}

// What to do, with a pulsing mark that becomes a tick once it is done.
function AskRow({ ask, complete }: { ask: string; complete: boolean }) {
  const caption = complete ? "Done" : ask;

  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2.5 border px-3 py-2.5 text-sm transition-colors duration-300",
        complete
          ? "border-primary bg-primary/10 text-foreground"
          : "text-muted-foreground"
      )}
    >
      {complete ? (
        <CheckIcon className="size-4 shrink-0 text-primary" weight="bold" />
      ) : (
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full bg-primary opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2.5 bg-primary" />
        </span>
      )}
      <span>{caption}</span>
    </div>
  );
}

function CardActions({
  complete,
  index,
  onBack,
  onNext,
  onSkip,
  step,
}: {
  complete: boolean;
  index: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  step: Step;
}) {
  const last = index === steps.length - 1;
  const gated = Boolean(step.done);

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      {gated && !complete ? (
        <button
          className="text-muted-foreground text-xs underline-offset-2 transition-colors hover:text-foreground hover:underline"
          onClick={onSkip}
          type="button"
        >
          Skip this step
        </button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        {index > 0 && !complete ? (
          <Button onClick={onBack} size="sm" variant="ghost">
            Back
          </Button>
        ) : null}
        {gated ? null : (
          <Button onClick={onNext} size="sm">
            {last ? "Done" : "Start"}
            {last ? null : <ArrowRightIcon />}
          </Button>
        )}
      </div>
    </div>
  );
}

function TourCard({
  complete,
  index,
  nudge,
  onBack,
  onClose,
  onNext,
  onSkip,
  step,
  top,
}: {
  complete: boolean;
  index: number;
  nudge: number;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  onSkip: () => void;
  step: Step;
  // Whether the card is at the top of the screen, out of the way of the thing
  // being pointed at.
  top: boolean;
}) {
  return (
    <section
      aria-label="Sandbox tour"
      className={cn(
        "motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 fixed right-6 z-[70] flex w-[min(23rem,calc(100vw-3rem))] flex-col gap-4 border bg-popover p-5 text-popover-foreground shadow-2xl motion-safe:animate-in motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]",
        top ? "top-20" : "bottom-6"
      )}
      key={index}
    >
      <div className={nudge > 0 ? "motion-safe:animate-nudge" : ""} key={nudge}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Progress index={index} />
          <button
            aria-label="Close the tour"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            Step {index + 1} of {steps.length}
          </span>
          <h2 className="font-semibold text-lg tracking-tight">{step.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.body}
          </p>
        </div>
        {step.action && !complete ? (
          <Button className="mt-4 w-full" onClick={step.action.run}>
            {step.action.label}
          </Button>
        ) : null}
        {step.ask ? <AskRow ask={step.ask} complete={complete} /> : null}
        {index === steps.length - 1 ? (
          <p className="mt-4 text-muted-foreground text-xs">
            <Link className="text-foreground underline" href="/signup">
              Sign up
            </Link>{" "}
            to keep everything you made here.
          </p>
        ) : null}
        <CardActions
          complete={complete}
          index={index}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          step={step}
        />
      </div>
    </section>
  );
}

function Tour() {
  const path = usePathname();
  const state = useTourState();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [start, setStart] = useState({
    changes: 0,
    path: "",
    ripple: 0,
    step: -1,
  });
  const [nudge, setNudge] = useState(0);
  const lastDoc = useRef("");
  const latest = useRef({ path, state });
  const step = steps[index] as Step;

  latest.current = { path, state };

  // Where they left off, if they have been here before.
  useEffect(() => {
    const saved = read();

    setIndex(saved.step);
    setOpen(!saved.done);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      remember({ done: !open, step: index });
    }
  }, [index, open, ready]);

  useEffect(() => {
    if (DOCUMENT.test(path)) {
      lastDoc.current = path;
    }
  }, [path]);

  // What things were like when the step began, to tell when it has been done.
  useEffect(() => {
    setStart({
      changes: latest.current.state.changes,
      path: latest.current.path,
      ripple: latest.current.state.ripple,
      step: index,
    });
  }, [index]);

  const context: Context = {
    ...state,
    lastDoc: lastDoc.current,
    path,
    start,
  };
  const box = useBox(step, context, open && ready);
  const complete =
    open && start.step === index && Boolean(step.done?.(context));
  // A step that points at something that is not there is not a trap.
  const blocking = open && !(step.target && !box);

  const next = useCallback(
    () => setIndex((at) => Math.min(at + 1, steps.length - 1)),
    []
  );
  const back = useCallback(() => setIndex((at) => Math.max(at - 1, 0)), []);
  const close = useCallback(() => setOpen(false), []);
  const reopen = useCallback(() => {
    setIndex(0);
    setOpen(true);
  }, []);
  const finish = useCallback(() => {
    if (index === steps.length - 1) {
      setOpen(false);
    } else {
      next();
    }
  }, [index, next]);
  const flash = useCallback(() => setNudge((count) => count + 1), []);

  // A step that has been done moves on by itself, after a moment to see it.
  useEffect(() => {
    if (!complete) {
      return;
    }

    const timer = setTimeout(next, ADVANCE_AFTER);

    return () => clearTimeout(timer);
  }, [complete, next]);

  if (!ready) {
    return null;
  }

  if (!open) {
    return (
      <Button
        aria-label="Take the tour"
        className="fixed right-4 bottom-4 z-50 gap-1.5 bg-background shadow-md"
        onClick={reopen}
        size="sm"
        variant="outline"
      >
        <QuestionIcon />
        Tour
      </Button>
    );
  }

  return (
    <>
      <Spotlight blocking={blocking} box={box} onBlocked={flash} />
      <TourCard
        complete={complete}
        index={index}
        nudge={nudge}
        onBack={back}
        onClose={close}
        onNext={finish}
        onSkip={next}
        step={step}
        top={box ? box.top + box.height / 2 > box.vh / 2 : false}
      />
    </>
  );
}

// The tour is for someone trying the sandbox as a guest.
export function SandboxTour() {
  const { data } = authClient.useSession();
  const user = data?.user as { isAnonymous?: boolean | null } | undefined;

  return user?.isAnonymous === true ? <Tour /> : null;
}

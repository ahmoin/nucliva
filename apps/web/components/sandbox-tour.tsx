"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  QuestionIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { BorderBeam } from "border-beam";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type OrbState, ThinkingOrb } from "thinking-orbs";
import {
  type TourState,
  tour,
  useTourState,
} from "@/components/sandbox-tour-store";
import { authClient } from "@/lib/auth/client";

const SANDBOX_KEY = "nucliva-tour";
const WELCOME_KEY = "nucliva-welcome-tour";
const NEW_FOR = 14 * 24 * 60 * 60 * 1000;
const DOCUMENT = /^\/dashboard\/(docs|sheets|presentations)\/[^/]+$/;
const SHEET_OR_DECK = /\/dashboard\/(sheets|presentations)\//;
const PADDING = 8;
const ADVANCE_AFTER = 900;
const POLL_EVERY = 200;

interface Context extends TourState {
  lastDoc: string;
  path: string;
  start: Omit<TourState, "example" | "exampleReady"> & {
    doc: string;
    path: string;
    step: number;
  };
}

type Target = string | ((context: Context) => DOMRect | null);

interface Step {
  action?: { label: string; run: () => void };
  ask?: string;
  body: string;
  done?: (context: Context) => boolean;
  focus?: string;
  hero?: OrbState;
  signup?: boolean;
  orb?: OrbState;
  target?: Target;
  title: string;
}

const visible = (box: DOMRect | null | undefined) =>
  box && box.width > 0 && box.height > 0 ? box : null;

const rectOf = (selector: string) =>
  visible(document.querySelector(selector)?.getBoundingClientRect());

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

const PROMPT = '[aria-label="What should we write?"]';

function around(boxes: (DOMRect | null | undefined)[]) {
  const found = boxes.filter((box): box is DOMRect => Boolean(visible(box)));

  if (found.length === 0) {
    return null;
  }

  const left = Math.min(...found.map((box) => box.left));
  const top = Math.min(...found.map((box) => box.top));
  const right = Math.max(...found.map((box) => box.right));
  const bottom = Math.max(...found.map((box) => box.bottom));

  return new DOMRect(left, top, right - left, bottom - top);
}

const draftBar = () => {
  const bar = document.querySelector(PROMPT)?.closest(".sticky");

  return around([
    bar?.getBoundingClientRect(),
    bar?.querySelector(".bottom-full")?.getBoundingClientRect(),
  ]);
};

const reviewArea = () =>
  around([
    draftBar(),
    ...[
      ...document.querySelectorAll("[data-suggestion], [data-suggestion-text]"),
    ].map((element) => element.getBoundingClientRect()),
  ]);

const sidebarLink = (href: string) => () =>
  rectOf(`a[href="${href}"]`) ?? rectOf('[data-sidebar="trigger"]');

const agentsStep: Step = {
  ask: "Open Agents",
  body: "Ask once, and an agent researches the web, then writes a doc, a sheet and a deck together, all in your voice and with the same numbers. It works in the background on Nebius, and the files arrive as suggestions you accept.",
  done: ({ path }) => path === "/dashboard/agents",
  orb: "connecting",
  target: sidebarLink("/dashboard/agents"),
  title: "Hand off a whole project",
};

const runAgentStep: Step = {
  ask: "Click an example, then click Run agent",
  body: "Pick one of the examples under the box, or write your own, and run it. You will see each step as it happens: planning, research, your voice, then the three files. It takes a few minutes, so carry on with the tour and come back to Agents for the files.",
  done: ({ runs, start }) => runs > start.runs,
  focus: '[aria-label="What should the agent make?"]',
  orb: "solving",
  target: '[data-tour="new-suite"]',
  title: "Run an agent",
};

const sandboxSteps: Step[] = [
  {
    body: "A real workspace for this line of work: files, a deck, a sheet and writing samples. There are a few things worth trying, and it takes about three minutes. You do each one, and Nucliva waits for you.",
    hero: "weaving",
    title: "Welcome to the sandbox",
  },
  {
    ask: "Send it with the arrow button",
    body: "Your request is already typed in. Send it, and Nucliva writes it from the notes above, in the voice of the writing samples in this workspace. On a keyboard, Enter works too.",
    done: ({ changes, start }) => changes > start.changes,
    focus: PROMPT,
    orb: "composing",
    target: draftBar,
    title: "Ask Nucliva",
  },
  {
    ask: "Click Accept All, or accept or reject each change",
    body: "Every change is in your document in green and red, and the chat tells you what it did. Nothing goes in until you say so, and you can take each one or all of them. Each change has its own Accept and Reject in the page margin, or step through them with the arrows in the chat. Drag this card by its top if it is in the way.",
    done: ({ changes, start }) => changes < start.changes,
    orb: "weaving",
    target: reviewArea,
    title: "You decide what goes in",
  },
  {
    action: {
      label: "Add the example",
      run: () => tour.addExample?.(),
    },
    ask: "Click the button, then give Nucliva a few seconds to read it",
    body: "Nucliva keeps facts in step across a document. Here is one number written three different ways. Add it, and once Nucliva has read the lines, change it.",
    done: ({ example, exampleReady }) => example && exampleReady,
    orb: "breathing",
    title: "Now the clever part",
  },
  {
    ask: "Change the first number, then wait a moment",
    body: "In the first line, change $4,200,000 to $4,500,000. Type over it or select it and type the new amount, then click away or wait a moment.",
    done: ({ rippled, start }) => rippled > start.rippled,
    orb: "solving",
    target: () => visible(tour.exampleBox?.()),
    title: "Change a number",
  },
  {
    ask: "Open the ripple log in the toolbar",
    body: "The other two lines changed on their own, each in its own style: $4.5M stays short and 4.5 million dollars stays long. There is nothing to accept. Every ripple goes in the log, where one click puts it back.",
    done: ({ logOpens, start }) => logOpens > start.logOpens,
    orb: "connecting",
    target: '[data-tour="ripple-log"]',
    title: "It changed the others",
  },
  {
    ask: "Open My Files",
    body: "This sandbox came with dozens of files: documents, a sheet and a deck. They are all in My Files.",
    done: ({ path }) => path === "/dashboard/my-files",
    orb: "searching",
    target: sidebarLink("/dashboard/my-files"),
    title: "Look around the workspace",
  },
  {
    ask: "Click the sheet, the deck or another document in the list",
    body: "Every file here opens in its own editor: a sheet is a real spreadsheet and a deck is a slide editor. Pick one from the list to see it.",
    done: ({ path, start }) => DOCUMENT.test(path) && path !== start.doc,
    orb: "working",
    target: (context) =>
      otherFile(context) ?? sidebarLink("/dashboard/my-files")(),
    title: "Open another file",
  },
  agentsStep,
  runAgentStep,
  {
    ask: "Open Style Profile",
    body: "This is where Nucliva's voice comes from: the writing samples it matches. Add your own and every draft sounds more like you.",
    done: ({ path }) => path === "/dashboard/style-profile",
    orb: "listening",
    target: sidebarLink("/dashboard/style-profile"),
    title: "See where the voice comes from",
  },
  {
    ask: "Open Knowledge Base",
    body: "And this is what it can draw on besides the web: the sources indexed from your workspace.",
    done: ({ path }) => path === "/dashboard/knowledge-base",
    orb: "shaping",
    target: sidebarLink("/dashboard/knowledge-base"),
    title: "What it knows",
  },
  {
    body: "You asked, reviewed, kept a fact in step and looked around. Everything here is yours to keep: sign up and it all moves to your account.",
    hero: "breathing",
    signup: true,
    title: "That is the loop",
  },
];

async function startDoc() {
  const response = await fetch("/api/documents", {
    body: JSON.stringify({ kind: "doc" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    return;
  }

  const { id }: { id: string } = await response.json();
  const prompt = encodeURIComponent(
    "Write a short note to my team about what I am working on this week"
  );

  window.location.assign(`/dashboard/docs/${id}?prompt=${prompt}`);
}

const welcomeSteps: Step[] = [
  {
    body: "Nucliva writes in your voice and keeps your facts straight. This takes about three minutes: you set up your voice, try an agent, then write something. You do each step, and Nucliva waits for you.",
    hero: "weaving",
    title: "Welcome to Nucliva",
  },
  {
    ask: "Open Style Profile",
    body: "Everything Nucliva writes is matched to how you write. It learns that from samples of your own writing.",
    done: ({ path }) => path === "/dashboard/style-profile",
    orb: "listening",
    target: sidebarLink("/dashboard/style-profile"),
    title: "Teach it your voice",
  },
  {
    ask: "Paste something you wrote, then click Analyze style",
    body: "An email, a post or a report you wrote works well. The more you add, the closer drafts sound to you. Skip this for now if you have nothing to hand.",
    done: ({ samples, start }) => samples > start.samples,
    focus: '[aria-label="Writing sample"]',
    orb: "listening",
    target: '[data-tour="sample"]',
    title: "Add a writing sample",
  },
  agentsStep,
  runAgentStep,
  {
    action: { label: "Create a doc", run: startDoc },
    ask: "Click the button to make a doc",
    body: "Now write something yourself. This makes a new doc with a first request typed in for you.",
    done: ({ path }) => DOCUMENT.test(path),
    orb: "working",
    title: "Write in a doc",
  },
  {
    ...(sandboxSteps[1] as Step),
    body: "A first request is typed in for you, and you can change it. Send it, and Nucliva writes it in your voice. On a keyboard, Enter works too.",
  },
  sandboxSteps[2] as Step,
  sandboxSteps[3] as Step,
  sandboxSteps[4] as Step,
  sandboxSteps[5] as Step,
  {
    body: "You taught it your voice, handed off a project and kept a fact in step. The Tour button in the corner brings this back any time.",
    hero: "breathing",
    title: "You are set up",
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

    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const changes = new MutationObserver(soon);

    measure();
    changes.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    const poll = setInterval(measure, POLL_EVERY);

    return () => {
      cancelAnimationFrame(frame);
      changes.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      clearInterval(poll);
    };
  }, [active, target]);

  return box;
}

const read = (key: string, count: number) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
      done?: boolean;
      step?: number;
    } | null;

    return {
      done: saved?.done === true,
      step: Math.min(Math.max(0, saved?.step ?? 0), count - 1),
    };
  } catch {
    return { done: false, step: 0 };
  }
};

const remember = (key: string, value: { done: boolean; step: number }) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the tour still works.
  }
};

const SANDBOX_AT_KEY = "nucliva-sandbox-at";
const FROM_SANDBOX_WITHIN = 2 * 60 * 60 * 1000;

const markSandbox = () => {
  try {
    localStorage.setItem(SANDBOX_AT_KEY, String(Date.now()));
  } catch {
    // Storage can be blocked; a sign up then gets the welcome tour too.
  }
};

const cameFromSandbox = (createdAt: number) => {
  try {
    const at = Number(localStorage.getItem(SANDBOX_AT_KEY));

    return at > 0 && Math.abs(createdAt - at) < FROM_SANDBOX_WITHIN;
  } catch {
    return false;
  }
};

const Steps = createContext<Step[]>([]);

const dim = "bg-black/65";
const move =
  "transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function Spotlight({
  blocking,
  box,
  onBlocked,
  reduced,
}: {
  blocking: boolean;
  box: Box | null;
  onBlocked: () => void;
  reduced: boolean;
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
          "pointer-events-none fixed z-[61] shadow-[0_0_32px_4px_color-mix(in_oklab,var(--primary)_40%,transparent)]",
          move
        )}
        style={{
          height: box.height,
          left: box.left,
          top: box.top,
          width: box.width,
        }}
      >
        <BorderBeam
          active={!reduced}
          className="size-full"
          colorVariant="colorful"
          size="md"
          theme="dark"
        >
          <div
            className="size-full border-2 border-primary/80"
            style={{ borderRadius: 2 }}
          />
        </BorderBeam>
      </div>
    </>
  );
}

function Progress({ index }: { index: number }) {
  const steps = useContext(Steps);

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

function AskRow({
  ask,
  complete,
  orb,
}: {
  ask: string;
  complete: boolean;
  orb: OrbState;
}) {
  const caption = complete ? "Done" : ask;

  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-2.5 border px-3 py-2 text-sm transition-colors duration-300",
        complete
          ? "border-primary bg-primary/10 text-foreground"
          : "text-muted-foreground"
      )}
    >
      {complete ? (
        <CheckIcon
          className="motion-safe:zoom-in-50 size-5 shrink-0 text-primary motion-safe:animate-in motion-safe:duration-300"
          weight="bold"
        />
      ) : (
        <ThinkingOrb
          aria-hidden="true"
          className="shrink-0"
          size={20}
          state={orb}
          theme="dark"
        />
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
  const steps = useContext(Steps);
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
  top: boolean;
}) {
  const steps = useContext(Steps);
  const card = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const grab = useRef<{
    box: DOMRect;
    from: { x: number; y: number };
    offset: { x: number; y: number };
  } | null>(null);

  const onGrabStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    const box = card.current?.getBoundingClientRect();

    if (!box) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = {
      box,
      from: { x: event.clientX, y: event.clientY },
      offset,
    };
  };

  const onGrabMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = grab.current;

    if (!start) {
      return;
    }

    const dx = Math.min(
      Math.max(event.clientX - start.from.x, -start.box.left),
      window.innerWidth - start.box.right
    );
    const dy = Math.min(
      Math.max(event.clientY - start.from.y, -start.box.top),
      window.innerHeight - start.box.bottom
    );

    setOffset({ x: start.offset.x + dx, y: start.offset.y + dy });
  };

  const onGrabEnd = () => {
    grab.current = null;
  };

  return (
    <section
      aria-label="Sandbox tour"
      className={cn(
        "motion-safe:slide-in-from-bottom-4 motion-safe:fade-in-0 fixed right-6 z-[70] flex w-[min(23rem,calc(100vw-3rem))] flex-col gap-4 border bg-popover p-5 text-popover-foreground shadow-2xl motion-safe:animate-in motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]",
        top ? "top-20" : "bottom-6"
      )}
      ref={card}
      style={{ translate: `${offset.x}px ${offset.y}px` }}
    >
      <div className={nudge > 0 ? "motion-safe:animate-nudge" : ""} key={nudge}>
        <div
          className="-mx-5 -mt-5 mb-4 flex cursor-grab touch-none items-center justify-between gap-3 px-5 pt-5 pb-1 active:cursor-grabbing"
          onPointerCancel={onGrabEnd}
          onPointerDown={onGrabStart}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabEnd}
        >
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
          {step.hero ? (
            <ThinkingOrb
              aria-hidden="true"
              className="mb-1"
              size={64}
              state={step.hero}
              theme="dark"
            />
          ) : null}
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
        {step.ask ? (
          <AskRow
            ask={step.ask}
            complete={complete}
            orb={step.orb ?? "breathing"}
          />
        ) : null}
        {step.signup ? (
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

function Tour({
  storageKey,
  steps,
}: {
  storageKey: string;
  steps: Step[];
}) {
  const path = usePathname();
  const state = useTourState();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [start, setStart] = useState<Context["start"]>({
    changes: 0,
    doc: "",
    path: "",
    logOpens: 0,
    ripple: 0,
    rippled: 0,
    runs: 0,
    samples: 0,
    step: -1,
  });
  const [nudge, setNudge] = useState(0);
  const lastDoc = useRef("");
  const focused = useRef(-1);
  const reduced = usePrefersReducedMotion();
  const latest = useRef({ path, state });
  const step = steps[index] as Step;

  latest.current = { path, state };

  useEffect(() => {
    const saved = read(storageKey, steps.length);

    setIndex(saved.step);
    setOpen(!saved.done);
    setReady(true);
  }, [steps.length, storageKey]);

  useEffect(() => {
    if (ready) {
      remember(storageKey, { done: !open, step: index });
    }
  }, [index, open, ready, storageKey]);

  useEffect(() => {
    if (path.startsWith("/dashboard/docs/") && DOCUMENT.test(path)) {
      lastDoc.current = path;
    }
  }, [path]);

  useEffect(() => {
    setStart({
      changes: latest.current.state.changes,
      doc: lastDoc.current,
      path: latest.current.path,
      logOpens: latest.current.state.logOpens,
      ripple: latest.current.state.ripple,
      rippled: latest.current.state.rippled,
      runs: latest.current.state.runs,
      samples: latest.current.state.samples,
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
  const blocking = open && !(step.target && !box);

  useEffect(() => {
    const field = step.focus;

    if (!(open && field && box) || focused.current === index) {
      return;
    }

    focused.current = index;

    if (window.matchMedia("(pointer: fine)").matches) {
      document
        .querySelector<HTMLElement>(field)
        ?.focus({ preventScroll: true });
    }
  }, [box, index, open, step.focus]);

  const next = useCallback(
    () => setIndex((at) => Math.min(at + 1, steps.length - 1)),
    [steps.length]
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
  }, [index, next, steps.length]);
  const flash = useCallback(() => setNudge((count) => count + 1), []);

  // Reset per step: the card remounts per step and would replay the shake.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the step changes
  useEffect(() => setNudge(0), [index]);

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
    <Steps.Provider value={steps}>
      <Spotlight
        blocking={blocking}
        box={box}
        onBlocked={flash}
        reduced={reduced}
      />
      <TourCard
        complete={complete}
        index={index}
        key={index}
        nudge={nudge}
        onBack={back}
        onClose={close}
        onNext={finish}
        onSkip={next}
        step={step}
        top={box ? box.top + box.height / 2 > box.vh / 2 : false}
      />
    </Steps.Provider>
  );
}

export function SandboxTour() {
  const { data } = authClient.useSession();
  const [fromSandbox, setFromSandbox] = useState<boolean | null>(null);
  const user = data?.user as
    | { createdAt?: Date | string; isAnonymous?: boolean | null }
    | undefined;
  const guest = user?.isAnonymous === true;
  const createdAt = user?.createdAt ? new Date(user.createdAt).getTime() : 0;

  useEffect(() => {
    if (!user) {
      return;
    }

    if (guest) {
      markSandbox();
    }

    setFromSandbox(cameFromSandbox(createdAt));
  }, [createdAt, guest, user]);

  if (!user || fromSandbox === null) {
    return null;
  }

  if (guest) {
    return <Tour steps={sandboxSteps} storageKey={SANDBOX_KEY} />;
  }

  return !fromSandbox && Date.now() - createdAt < NEW_FOR ? (
    <Tour steps={welcomeSteps} storageKey={WELCOME_KEY} />
  ) : null;
}

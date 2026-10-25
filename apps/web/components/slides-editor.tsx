"use client";

import {
  CopyIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Designer,
  DesignerFrame,
  type DesignerLayer,
  DesignerStaticFrame,
  createLayer,
} from "@/components/designer/designer";
import { DesignerProperties } from "@/components/designer/designer-properties";
import { DesignerToolbar } from "@/components/designer/designer-toolbar";
import { PendingReview } from "@/components/pending-review";

export interface Slide {
  id: string;
  layers: DesignerLayer[];
}

const FRAME = { height: 540, width: 960 };

type SaveStatus = "error" | "saved" | "saving";

const statusLabel: Record<SaveStatus, string> = {
  error: "Could not save",
  saved: "Saved",
  saving: "Saving...",
};

export function createSlide(title = "Click to add a title"): Slide {
  return {
    id: crypto.randomUUID(),
    layers: [
      createLayer("text", FRAME, {
        cssVars: {
          "--font-size": "56px",
          "--font-weight": "700",
          "--height": "80px",
          "--width": "800px",
          "--x": "80px",
          "--y": "200px",
        },
        name: "Title",
        value: title,
      }),
    ],
  };
}

function Presenter({
  onClose,
  slides,
}: {
  onClose: () => void;
  slides: Slide[];
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(960);

  useEffect(() => {
    const fit = () =>
      setWidth(
        Math.min(window.innerWidth, (window.innerHeight * 16) / 9)
      );

    fit();
    window.addEventListener("resize", fit);

    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(event.key)) {
        setIndex((current) => Math.min(current + 1, slides.length - 1));
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        setIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, slides.length]);

  const slide = slides[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}
      role="presentation"
    >
      {slide ? (
        <DesignerStaticFrame
          frameSize={FRAME}
          layers={slide.layers}
          width={width}
        />
      ) : null}
      <span className="absolute right-4 bottom-4 text-white/60 text-xs tabular-nums">
        {index + 1} / {slides.length}
      </span>
    </div>
  );
}

export function SlidesEditor({
  id,
  initialSlides,
  suggested,
  title: initialTitle,
}: {
  id: string;
  initialSlides: Slide[];
  suggested?: Slide[] | null;
  title: string;
}) {
  const [slides, setSlides] = useState(() => {
    const shown = suggested && suggested.length > 0 ? suggested : initialSlides;

    return shown.length > 0 ? shown : [createSlide()];
  });
  const [reviewing, setReviewing] = useState(Boolean(suggested?.length));
  const [settling, setSettling] = useState(false);
  const [active, setActive] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [presenting, setPresenting] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = slides[Math.min(active, slides.length - 1)];

  useEffect(() => {
    setSlot(document.getElementById("header-slot"));
  }, []);

  const schedule = useCallback(
    (patch: Record<string, unknown>) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("saving");

      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(async () => {
        const body = pending.current;

        pending.current = {};

        try {
          const response = await fetch(`/api/documents/${id}`, {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          });

          setStatus(response.ok ? "saved" : "error");
        } catch {
          setStatus("error");
        }
      }, 500);
    },
    [id]
  );

  const update = useCallback(
    (next: Slide[]) => {
      setSlides(next);

      if (!reviewing) {
        schedule({ content: { slides: next } });
      }
    },
    [reviewing, schedule]
  );

  const settle = async (keep: boolean) => {
    setSettling(true);

    try {
      const response = await fetch(`/api/documents/${id}`, {
        body: JSON.stringify(
          keep ? { content: { slides }, pending: null } : { pending: null }
        ),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Could not save");
      }

      setReviewing(false);

      if (!keep) {
        setSlides(initialSlides.length > 0 ? initialSlides : [createSlide()]);
        setActive(0);
      }
    } catch {
      setStatus("error");
    } finally {
      setSettling(false);
    }
  };

  const addSlide = () => {
    const next = [...slides, createSlide()];

    update(next);
    setActive(next.length - 1);
  };

  const duplicateSlide = () => {
    if (!current) {
      return;
    }

    const copy: Slide = {
      id: crypto.randomUUID(),
      layers: current.layers.map((layer) => ({
        ...layer,
        id: crypto.randomUUID(),
      })),
    };
    const at = slides.indexOf(current) + 1;

    update([...slides.slice(0, at), copy, ...slides.slice(at)]);
    setActive(at);
  };

  const deleteSlide = () => {
    if (slides.length === 1 || !current) {
      return;
    }

    const next = slides.filter((slide) => slide.id !== current.id);

    update(next);
    setActive(Math.max(0, Math.min(active, next.length - 1)));
  };

  if (!current) {
    return null;
  }

  return (
    <Designer
      frameSize={FRAME}
      key={current.id}
      layers={current.layers}
      onLayersChange={(layers) =>
        update(
          slides.map((slide) =>
            slide.id === current.id ? { ...slide, layers } : slide
          )
        )
      }
    >
      {slot
        ? createPortal(
            <>
              <Input
                aria-label="Presentation title"
                className="h-9 w-56 shrink-0 border-none bg-transparent px-0 font-semibold text-sm shadow-none focus-visible:ring-0"
                onChange={(event) => {
                  setTitle(event.target.value);

                  if (event.target.value.trim()) {
                    schedule({ title: event.target.value });
                  }
                }}
                placeholder="Untitled presentation"
                value={title}
              />
              <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                {statusLabel[status]}
              </span>
              <Button onClick={() => setPresenting(true)} size="sm">
                <PlayIcon />
                Present
              </Button>
            </>,
            slot
          )
        : null}
      {presenting ? (
        <Presenter onClose={() => setPresenting(false)} slides={slides} />
      ) : null}
      {reviewing ? (
        <div className="mb-4">
          <PendingReview
            busy={settling}
            onDiscard={() => settle(false)}
            onKeep={() => settle(true)}
            what="deck"
          />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)_280px]">
        <aside className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <Button
              aria-label="Add slide"
              onClick={addSlide}
              size="icon-sm"
              variant="outline"
            >
              <PlusIcon />
            </Button>
            <Button
              aria-label="Duplicate slide"
              onClick={duplicateSlide}
              size="icon-sm"
              variant="outline"
            >
              <CopyIcon />
            </Button>
            <Button
              aria-label="Delete slide"
              disabled={slides.length === 1}
              onClick={deleteSlide}
              size="icon-sm"
              variant="outline"
            >
              <TrashIcon />
            </Button>
          </div>
          <ol className="flex flex-col gap-3">
            {slides.map((slide, index) => (
              <li key={slide.id}>
                <button
                  aria-label={`Go to slide ${index + 1}`}
                  className={cn(
                    "flex w-full items-start gap-2 text-left",
                    slide.id === current.id ? "opacity-100" : "opacity-60 hover:opacity-100"
                  )}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="w-4 shrink-0 pt-1 text-muted-foreground text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "block ring-1 ring-foreground/10",
                      slide.id === current.id && "ring-2 ring-primary"
                    )}
                  >
                    <DesignerStaticFrame
                      frameSize={FRAME}
                      layers={slide.layers}
                      width={144}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
        <div className="flex min-w-0 flex-col gap-4">
          <DesignerFrame />
          <DesignerToolbar />
        </div>
        <aside className="min-w-0 lg:border-l lg:pl-4">
          <DesignerProperties />
        </aside>
      </div>
    </Designer>
  );
}

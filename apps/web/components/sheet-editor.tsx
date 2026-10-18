"use client";

import "@fortune-sheet/react/dist/index.css";
import { Input } from "@workspace/ui/components/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PendingReview } from "@/components/pending-review";

type WorkbookModule = typeof import("@fortune-sheet/react");
type Sheets = NonNullable<
  React.ComponentProps<WorkbookModule["Workbook"]>["data"]
>;
type SaveStatus = "error" | "saved" | "saving";

const statusLabel: Record<SaveStatus, string> = {
  error: "Could not save",
  saved: "Saved",
  saving: "Saving...",
};

const blank = (sheets: Sheets | null): Sheets =>
  sheets && sheets.length > 0 ? sheets : [{ celldata: [], name: "Sheet1" }];

export function SheetEditor({
  id,
  sheets,
  suggested,
  title: initialTitle,
}: {
  id: string;
  sheets: Sheets | null;
  // A sheet an agent made, shown until it is accepted or rejected.
  suggested?: Sheets | null;
  title: string;
}) {
  const [module, setModule] = useState<WorkbookModule | null>(null);
  const [initial, setInitial] = useState<Sheets>(blank(suggested ?? sheets));
  const [reviewing, setReviewing] = useState(Boolean(suggested));
  const [settling, setSettling] = useState(false);
  // The workbook only reads its data once, so a rejected sheet is a new one.
  const [generation, setGeneration] = useState(0);
  const reviewed = useRef<Sheets | null>(suggested ?? null);
  const workbook = useRef<import("@fortune-sheet/react").WorkbookInstance>(null);
  const lastSaved = useRef(JSON.stringify(suggested ?? sheets ?? null));
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("header-slot"));
    import("@fortune-sheet/react").then(setModule);
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
      }, 800);
    },
    [id]
  );

  const handleChange = useCallback(
    (data: Sheets) => {
      const api = workbook.current;

      if (!api) {
        return;
      }

      const next = data.map((sheet) => {
        const { calcChain, data: matrix, luckysheet_select_save, ...rest } = sheet;

        return { ...rest, celldata: api.dataToCelldata(matrix) };
      });
      const serialized = JSON.stringify(next);

      if (serialized === lastSaved.current) {
        return;
      }

      lastSaved.current = serialized;

      // A suggestion being looked over is saved only when it is accepted.
      if (reviewing) {
        reviewed.current = next;

        return;
      }

      schedule({ content: { sheets: next } });
    },
    [reviewing, schedule]
  );

  const settle = useCallback(
    async (keep: boolean) => {
      setSettling(true);

      try {
        const response = await fetch(`/api/documents/${id}`, {
          body: JSON.stringify(
            keep
              ? { content: { sheets: reviewed.current }, pending: null }
              : { pending: null }
          ),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error("Could not save");
        }

        setReviewing(false);

        if (!keep) {
          lastSaved.current = JSON.stringify(sheets ?? null);
          setInitial(blank(sheets));
          setGeneration((count) => count + 1);
        }
      } catch {
        setStatus("error");
      } finally {
        setSettling(false);
      }
    },
    [id, sheets]
  );

  const Workbook = module?.Workbook;

  return (
    <>
      {slot
        ? createPortal(
            <>
              <Input
                aria-label="Sheet title"
                className="h-9 w-56 shrink-0 border-none bg-transparent px-0 font-semibold text-sm shadow-none focus-visible:ring-0"
                onChange={(event) => {
                  setTitle(event.target.value);

                  if (event.target.value.trim()) {
                    schedule({ title: event.target.value });
                  }
                }}
                placeholder="Untitled sheet"
                value={title}
              />
              <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                {statusLabel[status]}
              </span>
            </>,
            slot
          )
        : null}
      {reviewing ? (
        <PendingReview
          busy={settling}
          onDiscard={() => settle(false)}
          onKeep={() => settle(true)}
          what="sheet"
        />
      ) : null}
      <div className="h-[calc(100svh-8rem)] min-h-[480px] w-full overflow-hidden border">
        {Workbook ? (
          <Workbook
            data={initial}
            key={generation}
            onChange={handleChange}
            ref={workbook}
          />
        ) : null}
      </div>
    </>
  );
}

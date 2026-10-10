"use client";

import "@fortune-sheet/react/dist/index.css";
import { Input } from "@workspace/ui/components/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

export function SheetEditor({
  id,
  sheets,
  title: initialTitle,
}: {
  id: string;
  sheets: Sheets | null;
  title: string;
}) {
  const [module, setModule] = useState<WorkbookModule | null>(null);
  const [initial] = useState<Sheets>(
    sheets && sheets.length > 0 ? sheets : [{ celldata: [], name: "Sheet1" }]
  );
  const workbook = useRef<import("@fortune-sheet/react").WorkbookInstance>(null);
  const lastSaved = useRef(JSON.stringify(sheets ?? null));
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
      schedule({ content: { sheets: next } });
    },
    [schedule]
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
      <div className="h-[calc(100svh-8rem)] min-h-[480px] w-full overflow-hidden border">
        {Workbook ? (
          <Workbook data={initial} onChange={handleChange} ref={workbook} />
        ) : null}
      </div>
    </>
  );
}

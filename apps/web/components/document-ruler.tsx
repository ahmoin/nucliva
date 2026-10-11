"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  $getRoot,
  $getSelection,
  $getState,
  $isRangeSelection,
  $setState,
} from "lexical";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PAGE_HEIGHT, PAGE_WIDTH } from "@/components/document-pages";
import {
  $blockOf,
  $selectedBlocks,
  firstLineState,
  type Margins,
  marginsState,
  TAB_STOP_TYPES,
  type TabStop,
  tabStopsState,
  useMargins,
} from "@/components/document-styles";

// A mark every eighth of an inch, and a number every inch from the left margin.
const EIGHTH = 12;
const INCH = 96;
// Handles snap to a sixteenth of an inch.
const SNAP = 6;
// The text between the margins never gets narrower than two inches.
const MIN_TEXT_WIDTH = 2 * INCH;

// A tab stop dropped this far above or below the ruler is taken away.
const REMOVE_DISTANCE = 24;

const snap = (value: number) => Math.round(value / SNAP) * SNAP;
const inches = (pixels: number) => (pixels / INCH).toFixed(2);
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Where the pointer is on the page, whatever the zoom. Handles sit directly in
// the ruler, which starts at the left edge of the page.
function pageX(event: PointerEvent<HTMLButtonElement>, scale: number) {
  const ruler = event.currentTarget.parentElement?.getBoundingClientRect();

  return (event.clientX - (ruler?.left ?? 0)) / scale;
}

interface HandleProps {
  children: ReactNode;
  label: string;
  // Called with where the handle was dragged to, in page pixels, and whether
  // that is the first move of this drag.
  onMove: (x: number, fresh: boolean) => void;
  // Called when the handle is let go well away from the ruler, which is how a
  // handle that can be removed is removed.
  onRemove?: () => void;
  // What the tooltip says while the handle is dragged, in inches.
  readout: string;
  scale: number;
  // Which edge of the ruler the handle sits on.
  side: "bottom" | "top";
  x: number;
}

// Something on the ruler that is dragged sideways.
function Handle({
  children,
  label,
  onMove,
  onRemove,
  readout,
  scale,
  side,
  x,
}: HandleProps) {
  const drag = useRef<{ fresh: boolean; grab: number } | null>(null);

  const [dragging, setDragging] = useState(false);

  const start = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { fresh: true, grab: pageX(event, scale) - x };
      setDragging(true);
    },
    [scale, x]
  );
  const move = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!drag.current) {
        return;
      }

      onMove(pageX(event, scale) - drag.current.grab, drag.current.fresh);
      drag.current.fresh = false;
    },
    [onMove, scale]
  );
  const end = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);
  const release = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const ruler = event.currentTarget.parentElement?.getBoundingClientRect();

      if (
        drag.current &&
        onRemove &&
        ruler &&
        (event.clientY > ruler.bottom + REMOVE_DISTANCE ||
          event.clientY < ruler.top - REMOVE_DISTANCE)
      ) {
        onRemove();
      }

      end();
    },
    [end, onRemove]
  );
  // Pressing a handle must not take the caret out of the document.
  const keepFocus = useCallback(
    (event: React.MouseEvent) => event.preventDefault(),
    []
  );

  return (
    <>
      <button
        aria-label={label}
        className={`absolute z-10 flex h-3 w-5 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center text-primary ${side === "top" ? "top-0" : "bottom-0"}`}
        onMouseDown={keepFocus}
        onPointerCancel={end}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={release}
        style={{ left: x * scale }}
        title={dragging ? undefined : label}
        type="button"
      >
        {children}
      </button>
      {dragging ? (
        <>
          {/* A line down the page shows what the handle lines up with. */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-full z-10 w-px bg-primary/60"
            style={{ height: PAGE_HEIGHT * scale, left: x * scale }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap bg-foreground px-2 py-1 font-mono text-background text-xs"
            style={{ left: x * scale }}
          >
            {readout}
          </span>
        </>
      ) : null}
    </>
  );
}

// An L for a left stop, a backwards L for a right one, and an upside-down T
// for a centre one. The upright is the stop.
const tabStopShapes: Record<TabStop["type"], string> = {
  center: "M6 2v8M2 10h8",
  left: "M4 2v8h6",
  right: "M8 2v8H2",
};

const menuItemClass = "font-normal text-sm normal-case tracking-normal";

interface TabStopHandleProps {
  index: number;
  // The left margin, which stops are measured from.
  margin: number;
  onMove: (index: number, x: number, fresh: boolean) => void;
  onRemove: (index: number) => void;
  scale: number;
  stop: TabStop;
}

// One tab stop: an L whose upright is the stop, with the text running to the
// right of it for a left stop and to the left of it for a right one.
function TabStopHandle({
  index,
  margin,
  onMove,
  onRemove,
  scale,
  stop,
}: TabStopHandleProps) {
  const move = useCallback(
    (x: number, fresh: boolean) => onMove(index, x, fresh),
    [index, onMove]
  );
  const remove = useCallback(() => onRemove(index), [index, onRemove]);

  return (
    <Handle
      label={`${stop.type[0]?.toUpperCase()}${stop.type.slice(1)} tab stop`}
      onMove={move}
      onRemove={remove}
      readout={inches(stop.x)}
      scale={scale}
      side="bottom"
      x={margin + stop.x}
    >
      <svg
        aria-hidden
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 12 12"
      >
        <path d={tabStopShapes[stop.type]} />
      </svg>
    </Handle>
  );
}

// The paragraphs the first-line handle is for: the ones selected, or the first
// of the document while there is no caret yet.
function $currentBlocks() {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    return [...$selectedBlocks(selection)];
  }

  const first = $getRoot().getFirstDescendant();
  const block = first ? $blockOf(first) : null;

  return block ? [block] : [];
}

// The ruler above the page. The grey ends are the margins, and the triangles
// drag them. The rectangle is where the first line of the paragraph starts.
export function Ruler({
  onHide,
  scale,
}: {
  onHide: () => void;
  scale: number;
}) {
  const [editor] = useLexicalComposerContext();
  const margins = useMargins();
  const [firstLine, setFirstLine] = useState(0);
  const [stops, setStops] = useState<TabStop[]>([]);
  // Where on the page the ruler was right-clicked, while its menu is open.
  const [menu, setMenu] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      const [block] = $currentBlocks();

      setFirstLine(block ? $getState(block, firstLineState) : 0);
      setStops(block ? $getState(block, tabStopsState) : []);
    };

    editor.getEditorState().read(read);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(read)
    );
  }, [editor]);

  // A drag is one step to undo: its first move starts it, and the moves after
  // it join it.
  const update = useCallback(
    (change: () => void, fresh: boolean) =>
      editor.update(change, fresh ? undefined : { tag: "history-merge" }),
    [editor]
  );

  const moveMargin = useCallback(
    (patch: Partial<Margins>, fresh: boolean) =>
      update(() => {
        const root = $getRoot();

        $setState(root, marginsState, {
          ...$getState(root, marginsState),
          ...patch,
        });
      }, fresh),
    [update]
  );
  const moveLeft = useCallback(
    (x: number, fresh: boolean) =>
      moveMargin(
        { left: clamp(snap(x), 0, PAGE_WIDTH - margins.right - MIN_TEXT_WIDTH) },
        fresh
      ),
    [margins.right, moveMargin]
  );
  const moveRight = useCallback(
    (x: number, fresh: boolean) =>
      moveMargin(
        {
          right: clamp(
            snap(PAGE_WIDTH - x),
            0,
            PAGE_WIDTH - margins.left - MIN_TEXT_WIDTH
          ),
        },
        fresh
      ),
    [margins.left, moveMargin]
  );
  const moveFirstLine = useCallback(
    (x: number, fresh: boolean) => {
      const indent = clamp(
        snap(x - margins.left),
        0,
        PAGE_WIDTH - margins.left - margins.right - MIN_TEXT_WIDTH
      );

      update(() => {
        for (const block of $currentBlocks()) {
          $setState(block, firstLineState, indent);
        }
      }, fresh);
    },
    [margins.left, margins.right, update]
  );

  // Changes the tab stops of the paragraphs the ruler is showing.
  const changeStops = useCallback(
    (change: (stops: TabStop[]) => TabStop[], fresh: boolean) =>
      update(() => {
        for (const block of $currentBlocks()) {
          $setState(block, tabStopsState, change);
        }
      }, fresh),
    [update]
  );
  const stopAt = useCallback(
    (x: number) =>
      clamp(snap(x - margins.left), SNAP, PAGE_WIDTH - margins.left - margins.right),
    [margins.left, margins.right]
  );
  const moveStop = useCallback(
    (index: number, x: number, fresh: boolean) =>
      changeStops(
        (current) =>
          current.map((stop, at) => (at === index ? { ...stop, x: stopAt(x) } : stop)),
        fresh
      ),
    [changeStops, stopAt]
  );
  const removeStop = useCallback(
    (index: number) =>
      changeStops((current) => current.filter((_, at) => at !== index), true),
    [changeStops]
  );
  const addStop = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const type = TAB_STOP_TYPES.find(
        (candidate) => candidate === event.currentTarget.dataset.type
      );

      if (menu === null || !type) {
        return;
      }

      const x = stopAt(menu);

      // A stop that is already there is replaced, so a place has one kind.
      changeStops(
        (current) => [...current.filter((stop) => stop.x !== x), { type, x }],
        true
      );
      setMenu(null);
    },
    [changeStops, menu, stopAt]
  );
  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      // The menu is drawn elsewhere on the page, but its clicks still arrive
      // here. Handles have their own clicks and drags.
      if (!event.currentTarget.contains(target)) {
        return;
      }

      if (event.type === "contextmenu") {
        event.preventDefault();
      }

      if (target.closest("button")) {
        return;
      }

      setMenu(
        (event.clientX - event.currentTarget.getBoundingClientRect().left) /
          scale
      );
    },
    [scale]
  );
  const closeMenu = useCallback((open: boolean) => {
    if (!open) {
      setMenu(null);
    }
  }, []);
  const focusEditor = useCallback(() => editor.getRootElement(), [editor]);

  const marks: ReactNode[] = [];
  const first = -Math.floor(margins.left / EIGHTH);
  const last = Math.floor((PAGE_WIDTH - margins.left) / EIGHTH);

  for (let step = first; step <= last; step += 1) {
    const x = margins.left + step * EIGHTH;
    const inch = step / (INCH / EIGHTH);
    const whole = Number.isInteger(inch);

    marks.push(
      <span
        className="absolute bottom-1/2 w-px translate-y-1/2 bg-muted-foreground/60"
        key={step}
        style={{
          height: whole ? 8 : step % 4 === 0 ? 6 : 3,
          left: x * scale,
        }}
      />
    );

    if (whole && inch !== 0) {
      marks.push(
        <span
          className="absolute top-0 -translate-x-1/2 leading-6"
          key={`label-${step}`}
          style={{ left: x * scale }}
        >
          {Math.abs(inch)}
        </span>
      );
    }
  }

  return (
    <div
      className="relative mx-auto mb-3 h-6 select-none border bg-card text-[10px] text-muted-foreground tabular-nums"
      onClick={openMenu}
      onContextMenu={openMenu}
      style={{ width: PAGE_WIDTH * scale }}
    >
      <div
        className="absolute inset-y-0 left-0 bg-muted"
        style={{ width: margins.left * scale }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-muted"
        style={{ width: margins.right * scale }}
      />
      {marks}
      <Handle
        label="Left margin"
        onMove={moveLeft}
        readout={inches(margins.left)}
        scale={scale}
        side="bottom"
        x={margins.left}
      >
        <svg aria-hidden className="size-3" fill="currentColor" viewBox="0 0 12 12">
          <path d="M1 2h10L6 11z" />
        </svg>
      </Handle>
      <Handle
        label="First line indent"
        onMove={moveFirstLine}
        readout={inches(firstLine)}
        scale={scale}
        side="top"
        x={margins.left + firstLine}
      >
        <svg aria-hidden className="h-2 w-3" fill="currentColor" viewBox="0 0 12 8">
          <rect height="6" rx="1" width="10" x="1" y="1" />
        </svg>
      </Handle>
      <Handle
        label="Right margin"
        onMove={moveRight}
        readout={inches(margins.right)}
        scale={scale}
        side="bottom"
        x={PAGE_WIDTH - margins.right}
      >
        <svg aria-hidden className="size-3" fill="currentColor" viewBox="0 0 12 12">
          <path d="M1 2h10L6 11z" />
        </svg>
      </Handle>
      {stops.map((stop, index) => (
        // The place in the list is the identity of a stop: its position
        // changes as it is dragged, and a new key would end the drag.
        <TabStopHandle
          index={index}
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          key={index}
          margin={margins.left}
          onMove={moveStop}
          onRemove={removeStop}
          scale={scale}
          stop={stop}
        />
      ))}
      <DropdownMenu onOpenChange={closeMenu} open={menu !== null}>
        {/* The menu opens where the ruler was right-clicked. */}
        <DropdownMenuTrigger
          nativeButton={false}
          render={
            <span
              aria-hidden
              className="absolute top-full size-px"
              style={{ left: (menu ?? 0) * scale }}
            />
          }
        />
        <DropdownMenuContent
          align="center"
          finalFocus={focusEditor}
          sideOffset={8}
        >
          {TAB_STOP_TYPES.map((type) => (
            <DropdownMenuItem
              className={menuItemClass}
              data-type={type}
              key={type}
              onClick={addStop}
            >
              Add {type} tab-stop
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked
            className={menuItemClass}
            onClick={onHide}
          >
            Show ruler
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* The point of the menu: it comes from the place that was clicked. Its centre sits on the top edge of the menu and it is drawn over it, with only its two upper edges outlined, so the outline runs around the point and the menu as one shape. */}
      {menu === null ? null : (
        <span
          aria-hidden
          className="pointer-events-none absolute top-full z-[100] mt-[3px] size-2.5 -translate-x-1/2 rotate-45 border-foreground/10 border-t border-l bg-popover"
          style={{ left: menu * scale }}
        />
      )}
    </div>
  );
}

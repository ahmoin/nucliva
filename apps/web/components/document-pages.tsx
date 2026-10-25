"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { cn } from "@workspace/ui/lib/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  getStyleObjectFromCSS,
} from "lexical";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SuggestionButtons,
  useSuggestionMarks,
} from "@/components/document-suggestions";
import {
  type Margins,
  useMargins,
  useStyledBlocks,
  useTabStops,
  useTextStyles,
} from "@/components/document-styles";

export const PAGE_WIDTH = 816;
export const PAGE_HEIGHT = 1056;
const PAGE_MARGIN = 96;
const PAGE_GAP = 24;
const PAGE_PITCH = PAGE_HEIGHT + PAGE_GAP;
const CONTENT_HEIGHT = PAGE_HEIGHT - 2 * PAGE_MARGIN;
const BREAK_HEIGHT = 2 * PAGE_MARGIN + PAGE_GAP;

// The bottom padding keeps the rest of the last page clickable. It is a whole
// page tall so it always reaches the end of the page, and the rest is clipped.
const contentPadding = ({ left, right }: Margins) =>
  `${PAGE_MARGIN}px ${right}px ${PAGE_PITCH}px ${left}px`;

const FONT_PROPERTIES = ["font-family", "font-size", "font-weight"];

const countPages = (root: HTMLElement) =>
  Math.max(1, Math.ceil((root.clientHeight - PAGE_PITCH) / PAGE_PITCH));

const fontOf = (
  style: CSSStyleDeclaration,
  overrides: Record<string, string> = {}
) =>
  FONT_PROPERTIES.map(
    (property) =>
      `${property}:${overrides[property] ?? style.getPropertyValue(property)}`
  ).join(";");

function fontShift(layer: HTMLElement, from: string, to: string) {
  const probe = document.createElement("div");
  const before = probe.appendChild(document.createElement("span"));
  const after = probe.appendChild(document.createElement("span"));

  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap";
  before.style.cssText = from;
  after.style.cssText = to;
  before.textContent = "x";
  after.textContent = "x";
  layer.append(probe);

  const old = before.getBoundingClientRect();
  const next = after.getBoundingClientRect();

  probe.remove();

  return { bottom: next.bottom - old.bottom, top: next.top - old.top };
}

// Lexical scrolls to the caret before the page it landed on exists.
function revealCaret(root: HTMLElement) {
  const selection = window.getSelection();

  if (
    document.activeElement !== root ||
    !selection?.isCollapsed ||
    selection.rangeCount === 0
  ) {
    return;
  }

  const range = selection.getRangeAt(0);
  const child = range.startContainer.childNodes[range.startOffset];
  const { bottom } = (
    child instanceof Element ? child : range
  ).getBoundingClientRect();

  if (bottom > window.innerHeight) {
    window.scrollBy(0, bottom - window.innerHeight);
  }
}

export function DocumentPages({
  change,
  scale,
}: {
  change: number;
  scale: number;
}) {
  const [editor] = useLexicalComposerContext();
  const [pages, setPages] = useState(1);
  const [caret, setCaret] = useState<{
    height: number;
    left: number;
    top: number;
  } | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const height = pages * PAGE_PITCH - PAGE_GAP;
  const tops = Array.from({ length: pages }, (_, index) => index * PAGE_PITCH);

  // Before the page count below, which depends on how big the text is.
  useTextStyles();
  useStyledBlocks();
  const margins = useMargins();
  useTabStops();
  useSuggestionMarks();

  useEffect(() => {
    const sync = () => {
      const layer = layerRef.current;
      const selection = $getSelection();
      const native = window.getSelection();

      if (
        !(
          $isRangeSelection(selection) &&
          selection.isCollapsed() &&
          layer &&
          native?.rangeCount
        )
      ) {
        setCaret(null);
        return;
      }

      const node = selection.anchor.getNode();
      const element = editor.getElementByKey(node.getKey());
      const rect = native.getRangeAt(0).getClientRects()[0];
      const typed = getStyleObjectFromCSS(selection.style);
      const own = getStyleObjectFromCSS($isTextNode(node) ? node.getStyle() : "");

      if (
        !($isTextNode(node) && element && rect) ||
        FONT_PROPERTIES.every((property) => typed[property] === own[property])
      ) {
        setCaret(null);
        return;
      }

      const shift = fontShift(
        layer,
        fontOf(getComputedStyle(element)),
        fontOf(getComputedStyle(element.parentElement ?? element), typed)
      );
      const origin = layer.getBoundingClientRect();

      setCaret({
        height: (rect.height + shift.bottom - shift.top) / scale,
        left: (rect.left - origin.left) / scale,
        top: (rect.top + shift.top - origin.top) / scale,
      });
    };

    editor.getEditorState().read(sync);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(sync)
    );
  }, [editor, scale]);

  useLayoutEffect(() => {
    const root = editor.getRootElement();

    if (!root) {
      return;
    }

    const needed = countPages(root);

    if (needed === pages) {
      revealCaret(root);
    } else {
      setPages(needed);
    }
  }, [editor, pages]);

  useEffect(() => {
    const root = editor.getRootElement();

    if (!root) {
      return;
    }

    const observer = new ResizeObserver(() => setPages(countPages(root)));

    observer.observe(root);

    return () => observer.disconnect();
  }, [editor]);

  return (
    <div
      className="relative mx-auto"
      style={{ height: height * scale, width: PAGE_WIDTH * scale }}
    >
      {tops.map((top) => (
        <div
          className="absolute inset-x-0 bg-white"
          key={top}
          style={{ height: PAGE_HEIGHT * scale, top: top * scale }}
        />
      ))}
      <div
        className="light flow-root overflow-clip text-foreground"
        ref={layerRef}
        style={{
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: PAGE_WIDTH,
        }}
      >
        <div aria-hidden className="pointer-events-none">
          <div className="float-left w-0" style={{ height: PAGE_MARGIN }} />
          {tops.map((top) => (
            <Fragment key={top}>
              <div
                className="float-left clear-left w-0"
                style={{ height: CONTENT_HEIGHT }}
              />
              <div
                className="float-left clear-left w-full"
                style={{ height: BREAK_HEIGHT }}
              />
            </Fragment>
          ))}
        </div>
        <ContentEditable
          aria-label="Document"
          className={cn(
            "peer font-(--paragraph-font-weight) font-(family-name:--paragraph-font-family) text-(--paragraph-color) text-(length:--paragraph-font-size) outline-none [tab-size:48px] **:data-[suggestion=add]:bg-emerald-500/15 **:data-[suggestion=add]:shadow-[inset_3px_0_0_#10b981] **:data-[suggestion=remove]:bg-red-500/15 **:data-[suggestion=remove]:line-through **:data-[suggestion=remove]:decoration-red-500/60 **:data-[suggestion=remove]:shadow-[inset_3px_0_0_#ef4444] **:data-[suggestion-text=add]:bg-emerald-500/25 **:data-[suggestion-text=remove]:bg-red-500/25 **:data-[suggestion-text=remove]:line-through **:data-[suggestion-text=remove]:decoration-red-500/70 **:data-[suggestion-soft=true]:data-[suggestion-text=add]:bg-sky-500/20 **:data-[suggestion-soft=true]:data-[suggestion-text=add]:underline **:data-[suggestion-soft=true]:data-[suggestion-text=add]:decoration-sky-500/70 **:data-[suggestion-soft=true]:data-[suggestion-text=add]:decoration-dashed **:data-[suggestion-soft=true]:data-[suggestion-text=remove]:bg-red-500/10 **:data-[suggestion-soft=true]:data-[suggestion-text=remove]:decoration-red-500/40**:has-[>br:only-child]:w-full **:has-[>br:only-child]:contain-layout [&>*]:transition-[background-color,box-shadow] [&>*]:duration-300 **:data-lexical-text:transition-colors **:data-lexical-text:duration-300 motion-reduce:[&>*]:transition-none motion-reduce:**:data-lexical-text:transition-none",
            caret && "caret-transparent"
          )}
          style={{ padding: contentPadding(margins) }}
        />
        {caret ? (
          <div
            aria-hidden
            className="pointer-events-none absolute hidden w-px animate-caret-blink bg-foreground peer-focus:block"
            style={caret}
          />
        ) : null}
        <SuggestionButtons
          current={change}
          layer={layerRef}
          margin={PAGE_MARGIN}
          pitch={PAGE_PITCH}
          scale={scale}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {tops.slice(1).map((top) => (
          <div
            className="absolute inset-x-0 bg-background"
            key={top}
            style={{ height: PAGE_GAP * scale, top: (top - PAGE_GAP) * scale }}
          />
        ))}
        {tops.map((top) => (
          <div
            className="absolute inset-x-0 border-white outline -outline-offset-1 outline-black/10"
            key={top}
            style={{
              borderBlockWidth: PAGE_MARGIN * scale,
              height: PAGE_HEIGHT * scale,
              top: top * scale,
            }}
          />
        ))}
      </div>
    </div>
  );
}

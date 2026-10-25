"use client";

import { CodeNode } from "@lexical/code";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import { $isListNode, ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $isTableNode, TableNode } from "@lexical/table";
import { $dfs } from "@lexical/utils";
import { Button } from "@workspace/ui/components/button";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getState,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  $setState,
  createState,
  type ElementNode,
  type LexicalNode,
  type MutationListener,
  type NodeKey,
  ParagraphNode,
  TextNode,
} from "lexical";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { styleFor, useMargins } from "@/components/document-styles";
import { DOCUMENT_TRANSFORMERS } from "@/components/document-table";
import type { Edit } from "@/lib/ai/style-engine";
import type { Source } from "@/lib/ai/tavily";

interface Suggestion {
  id: string;
  kind: "add" | "remove";
  soft?: boolean;
}

export const suggestionState = createState("suggestion", {
  parse: (value): Suggestion | null => {
    const suggestion = value as Partial<Suggestion> | null;

    return typeof suggestion?.id === "string" &&
      (suggestion.kind === "add" || suggestion.kind === "remove")
      ? {
          id: suggestion.id,
          kind: suggestion.kind,
          ...(suggestion.soft === true ? { soft: true } : {}),
        }
      : null;
  },
});

export interface Change {
  id: string;
  keys: NodeKey[];
}

function $suggested() {
  return $dfs().flatMap(({ node }) => {
    const suggestion = $getState(node, suggestionState);

    return suggestion ? [{ node, suggestion }] : [];
  });
}

export function $changes() {
  const changes: Change[] = [];

  for (const { node, suggestion } of $suggested()) {
    const change = changes.find((item) => item.id === suggestion.id);

    if (change) {
      change.keys.push(node.getKey());
    } else {
      changes.push({ id: suggestion.id, keys: [node.getKey()] });
    }
  }

  return changes;
}

export function $resolve(ids: Set<string> | null, accept: boolean) {
  for (const { node, suggestion } of $suggested()) {
    if (ids && !ids.has(suggestion.id)) {
      continue;
    }

    if ((suggestion.kind === "add") === accept) {
      $setState(node, suggestionState, null);

      if ($isTextNode(node) && node.isUnmergeable()) {
        node.toggleUnmergeable();
      }
    } else {
      node.remove();
    }
  }
}

interface Run {
  format: number;
  style: string;
  text: string;
}

const $runs = (block: ElementNode): Run[] | null => {
  const children = block.getChildren();

  return children.every($isTextNode)
    ? children.map((node) => ({
        format: node.getFormat(),
        style: node.getStyle(),
        text: node.getTextContent(),
      }))
    : null;
};

function slice(runs: Run[], from: number, to: number) {
  const parts: Run[] = [];
  let at = 0;

  for (const run of runs) {
    const start = Math.max(from, at);
    const end = Math.min(to, at + run.text.length);

    if (start < end) {
      parts.push({ ...run, text: run.text.slice(start - at, end - at) });
    }

    at += run.text.length;
  }

  return parts;
}

function diffWords(before: string, after: string) {
  const tokens = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];
  const a = tokens(before);
  const b = tokens(after);

  if (a.length * b.length > 250_000) {
    return null;
  }

  const common = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      common[i]![j] =
        a[i] === b[j]
          ? (common[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(common[i + 1]?.[j] ?? 0, common[i]?.[j + 1] ?? 0);
    }
  }

  const steps: { kind: "add" | "equal" | "remove"; text: string }[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      steps.push({ kind: "equal", text: a[i] ?? "" });
      i += 1;
      j += 1;
    } else if (
      i < a.length &&
      (j === b.length ||
        (common[i + 1]?.[j] ?? 0) >= (common[i]?.[j + 1] ?? 0))
    ) {
      steps.push({ kind: "remove", text: a[i] ?? "" });
      i += 1;
    } else {
      steps.push({ kind: "add", text: b[j] ?? "" });
      j += 1;
    }
  }

  const merged: typeof steps = [];

  for (const step of steps) {
    const last = merged.at(-1);

    if (last?.kind === step.kind) {
      last.text += step.text;
    } else {
      merged.push({ ...step });
    }
  }

  const changed = steps.filter((step) => step.kind !== "equal").length;

  return { changed: changed / Math.max(1, a.length + b.length), steps: merged };
}

function $diffInPlace(
  block: ElementNode,
  fresh: ElementNode,
  options?: { prefix?: string; soft?: boolean }
) {
  const newId = () => `${options?.prefix ?? ""}${crypto.randomUUID()}`;
  const before = $runs(block);
  const after = $runs(fresh);
  const diff =
    before && after
      ? diffWords(block.getTextContent(), fresh.getTextContent())
      : null;

  if (!(before && after && diff) || diff.changed > 0.5) {
    return null;
  }

  const nodes: TextNode[] = [];
  const hunks = new Set<string>();
  let id = newId();
  let was = 0;
  let now = 0;
  let open = false;

  for (const step of diff.steps) {
    const from = step.kind === "add" ? now : was;
    const runs = slice(
      step.kind === "add" ? after : before,
      from,
      from + step.text.length
    );

    if (step.kind === "equal") {
      if (open && step.text.trim()) {
        id = newId();
        open = false;
      }
    } else {
      open = true;
    }

    for (const run of runs) {
      const node = $createTextNode(run.text)
        .setFormat(run.format)
        .setStyle(run.style);

      if (step.kind !== "equal") {
        $setState(
          node,
          suggestionState,
          options?.soft
            ? { id, kind: step.kind, soft: true }
            : { id, kind: step.kind }
        );
        node.toggleUnmergeable();
        hunks.add(id);
      }

      nodes.push(node);
    }

    if (step.kind !== "add") {
      was += step.text.length;
    }

    if (step.kind !== "remove") {
      now += step.text.length;
    }
  }

  block.clear();
  block.append(...nodes);

  return hunks.size;
}

export function $segments(block: ElementNode) {
  const segments: { end: number; node: LexicalNode; start: number }[] = [];
  let at = 0;

  const walk = (parent: ElementNode) => {
    for (const child of parent.getChildren()) {
      if ($isTextNode(child) || $isLineBreakNode(child)) {
        const size = child.getTextContentSize();

        segments.push({ end: at + size, node: child, start: at });
        at += size;
      } else if ($isElementNode(child) && child.isInline()) {
        walk(child);
      }
    }
  };

  walk(block);

  return segments;
}

export interface Span {
  end: number;
  id: string;
  soft?: boolean;
  start: number;
  text: string;
}

export function $replaceSpans(block: ElementNode, spans: Span[]) {
  let done = 0;

  // From the end, so that one change does not move the place of the next.
  for (const span of [...spans].sort((a, b) => b.start - a.start)) {
    const parts = $segments(block).filter(
      (part) => part.start < span.end && part.end > span.start
    );

    if (parts.length === 0 || !parts.every((part) => $isTextNode(part.node))) {
      continue;
    }

    const going: TextNode[] = [];

    for (const part of parts) {
      const node = part.node as TextNode;
      const from = Math.max(span.start, part.start) - part.start;
      const to = Math.min(span.end, part.end) - part.start;
      const edges = [from, to].filter(
        (edge) => edge > 0 && edge < node.getTextContentSize()
      );
      const pieces = edges.length > 0 ? node.splitText(...edges) : [node];
      const piece = pieces[from > 0 ? 1 : 0];

      if (piece) {
        going.push(piece);
      }
    }

    const last = going.at(-1);
    const [first] = going;

    if (!(first && last)) {
      continue;
    }

    const mark = (node: TextNode, kind: "add" | "remove") => {
      $setState(
        node,
        suggestionState,
        span.soft
          ? { id: span.id, kind, soft: true }
          : { id: span.id, kind }
      );

      if (!node.isUnmergeable()) {
        node.toggleUnmergeable();
      }
    };
    const coming = $createTextNode(span.text)
      .setFormat(first.getFormat())
      .setStyle(first.getStyle());

    for (const node of going) {
      mark(node, "remove");
    }

    last.insertAfter(coming);
    mark(coming, "add");
    done += 1;
  }

  return done;
}

export function $suggestRewrite(
  block: ElementNode,
  text: string,
  options: { prefix: string; soft?: boolean }
) {
  const [first] = block.getAllTextNodes();
  const fresh = $createParagraphNode();
  const node = $createTextNode(text);

  if (first) {
    node.setFormat(first.getFormat()).setStyle(first.getStyle());
  }

  fresh.append(node);

  return $diffInPlace(block, fresh, options) ?? 0;
}

function $linkCitations(blocks: ElementNode[], sources: Source[]) {
  for (const node of blocks.flatMap((block) => block.getAllTextNodes())) {
    if ($isLinkNode(node.getParent())) {
      continue;
    }

    const marks = [...node.getTextContent().matchAll(/\[(\d+)\]/g)].filter(
      (mark) => sources[Number(mark[1]) - 1]
    );
    const edges = [
      ...new Set(
        marks.flatMap((mark) => [mark.index, mark.index + mark[0].length])
      ),
    ].filter((edge) => edge > 0 && edge < node.getTextContentSize());

    for (const part of marks.length > 0 ? node.splitText(...edges) : []) {
      const mark = part.getTextContent().match(/^\[(\d+)\]$/);
      const source = mark ? sources[Number(mark[1]) - 1] : undefined;

      if (source) {
        const link = $createLinkNode(source.url, { target: "_blank" });

        part.replace(link);
        link.append(part);
      }
    }
  }
}

function $blocksFromMarkdown(
  markdown: string,
  sources: Source[],
  isTitle: boolean
) {
  const root = $getRoot();

  // The conversion starts from an empty document, so whatever is there has
  // been taken out by the caller.
  $convertFromMarkdownString(markdown, DOCUMENT_TRANSFORMERS);

  for (const block of root.getChildren()) {
    if (!$isHeadingNode(block)) {
      continue;
    }

    if (isTitle && block === root.getFirstChild() && block.getTag() === "h1") {
      block.replace(styleFor("title").create(), true);
    } else if (block.getTag() === "h5" || block.getTag() === "h6") {
      block.replace($createHeadingNode("h4"), true);
    }
  }

  const blocks = root.getChildren() as ElementNode[];

  $linkCitations(blocks, sources);

  return blocks;
}

const sourcesMarkdown = (sources: Source[]) =>
  `## Sources\n\n${sources
    .map(
      (source, index) =>
        `${index + 1}. [${source.title.replaceAll(/[[\]]/g, "")}](${source.url})`
    )
    .join("\n")}`;

export function $applyEdits(edits: Edit[], found: Source[], cite: boolean) {
  const sources = cite ? found : [];
  const root = $getRoot();
  const existing = root.getChildren();
  const last = existing.length - 1;
  const after = new Map<number, ElementNode[]>();
  const flags: [LexicalNode, Suggestion][] = [];
  let added = 0;
  let inPlace = 0;

  const insertAfter = (at: number, blocks: ElementNode[], id: string) => {
    after.set(at, [...(after.get(at) ?? []), ...blocks]);
    flags.push(...blocks.map((block): [LexicalNode, Suggestion] => [
      block,
      { id, kind: "add" },
    ]));
    added += blocks.length;
  };

  for (const edit of edits) {
    const id = crypto.randomUUID();
    const at =
      edit.action === "insert"
        ? Math.min(last, Math.max(-1, edit.block))
        : edit.block;
    const target = existing[at];

    if (edit.action !== "insert" && !target) {
      continue;
    }

    const created =
      edit.action !== "delete" && edit.markdown.trim()
        ? $blocksFromMarkdown(
            cite
              ? edit.markdown
              : edit.markdown.replaceAll(/\s*(\[\d+\])+/g, ""),
            sources,
            existing.length === 0 && added === 0
          )
        : [];
    const fresh = created[0];

    const hunks =
      edit.action === "replace" &&
      target &&
      fresh &&
      created.length === 1 &&
      target.getType() === fresh.getType() &&
      ($isHeadingNode(target) ? target.getTag() : null) ===
        ($isHeadingNode(fresh) ? fresh.getTag() : null)
        ? $diffInPlace(target as ElementNode, fresh)
        : null;

    if (hunks !== null) {
      inPlace += hunks;
      added += 1;
      continue;
    }

    if (edit.action !== "insert" && target) {
      flags.push([target, { id, kind: "remove" }]);
    }

    if (created.length > 0) {
      created.forEach((block, index) =>
        insertAfter(
          at,
          [block],
          index === 0 && edit.action === "replace" ? id : crypto.randomUUID()
        )
      );
    }
  }

  if (sources.length > 0 && added > 0) {
    insertAfter(
      last,
      $blocksFromMarkdown(sourcesMarkdown(sources), [], false),
      crypto.randomUUID()
    );
  }

  root.clear();
  root.append(
    ...(after.get(-1) ?? []),
    ...existing.flatMap((block, index) => [block, ...(after.get(index) ?? [])])
  );

  for (const [block, suggestion] of flags) {
    // Marked per item: adjacent lists merge, and a mark on the list node would
    // be lost, or would take the other list's items with it.
    const targets =
      $isListNode(block) && block.getChildrenSize() > 0
        ? block.getChildren()
        : [block];

    for (const target of targets) {
      $setState(target, suggestionState, suggestion);
    }
  }

  return new Set(flags.map(([, suggestion]) => suggestion.id)).size + inPlace;
}

function $blockText(block: LexicalNode) {
  if ($isHeadingNode(block)) {
    return `${"#".repeat(Number(block.getTag().slice(1)))} ${block.getTextContent()}`;
  }

  if ($isListNode(block)) {
    const numbered = block.getListType() === "number";

    return block
      .getChildren()
      .map((item, index) => `${numbered ? `${index + 1}.` : "-"} ${item.getTextContent()}`)
      .join("\n");
  }

  if ($isTableNode(block)) {
    return block
      .getChildren()
      .map((row) =>
        $isElementNode(row)
          ? `| ${row
              .getChildren()
              .map((cell) => cell.getTextContent())
              .join(" | ")} |`
          : row.getTextContent()
      )
      .join("\n");
  }

  return $isQuoteNode(block)
    ? `> ${block.getTextContent()}`
    : block.getTextContent();
}

export function $documentBlocks() {
  return $getRoot()
    .getChildren()
    .map((block) => $blockText(block).slice(0, 1200));
}

export function useChanges() {
  const [editor] = useLexicalComposerContext();
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    const read = () => {
      const next = $changes();

      setChanges((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next
      );
    };

    editor.getEditorState().read(read);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(read)
    );
  }, [editor]);

  return changes;
}

export function useSuggestionMarks() {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    const mark: MutationListener = (mutations) =>
      editor.getEditorState().read(() => {
        for (const key of mutations.keys()) {
          const node = $getNodeByKey(key);
          const element = editor.getElementByKey(key);
          const suggestion = node ? $getState(node, suggestionState) : null;
          const attribute = $isTextNode(node)
            ? "suggestionText"
            : "suggestion";

          if (!element) {
            continue;
          }

          if (suggestion) {
            element.dataset[attribute] = suggestion.kind;

            if (suggestion.soft) {
              element.dataset.suggestionSoft = "true";
            } else {
              delete element.dataset.suggestionSoft;
            }
          } else {
            delete element.dataset[attribute];
            delete element.dataset.suggestionSoft;
          }
        }
      });

    const stops = [
      ParagraphNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      TableNode,
      TextNode,
    ].map((kind) => editor.registerMutationListener(kind, mark));

    return () => {
      for (const stop of stops) {
        stop();
      }
    };
  }, [editor]);
}

const BUTTONS_HEIGHT = 30;

export function SuggestionButtons({
  current,
  layer,
  margin,
  pitch,
  scale,
}: {
  current: number;
  layer: RefObject<HTMLElement | null>;
  margin: number;
  pitch: number;
  scale: number;
}) {
  const [editor] = useLexicalComposerContext();
  const changes = useChanges();
  const margins = useMargins();
  const [tops, setTops] = useState<Record<string, number>>({});
  const shown = changes[Math.min(current, changes.length - 1)];
  const shownId = shown?.id;
  const shownKey = shown?.keys[0];
  const seen = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const root = editor.getRootElement();

    if (!(root && shownId)) {
      return;
    }

    const place = () => {
      const box = layer.current?.getBoundingClientRect();
      const element = editor.getElementByKey(shownKey ?? "");
      const next: Record<string, number> = {};

      if (box && element) {
        const top = (element.getBoundingClientRect().top - box.top) / scale;
        const pageText = Math.floor(top / pitch) * pitch + margin;

        next[shownId] = Math.max(top - BUTTONS_HEIGHT, pageText);
      }

      setTops((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      );
    };

    place();

    const observer = new ResizeObserver(place);

    observer.observe(root);

    return () => observer.disconnect();
  }, [editor, layer, margin, pitch, scale, shownId, shownKey]);

  useEffect(() => {
    if (shownId && shownId !== seen.current) {
      editor
        .getElementByKey(shownKey ?? "")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    seen.current = shownId ?? seen.current;
  }, [editor, shownId, shownKey]);

  const settle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const { accept, change } = event.currentTarget.dataset;

      editor.update(() => $resolve(new Set([change ?? ""]), accept === "true"));
    },
    [editor]
  );
  // Pressing a button must not take the caret out of the document.
  const keepFocus = useCallback(
    (event: React.MouseEvent) => event.preventDefault(),
    []
  );

  return [shown].map((change) => {
    const id = change?.id ?? "";

    return tops[id] === undefined ? null : (
      <div
        className="absolute z-20 flex origin-bottom-right gap-1 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:animate-in motion-safe:duration-150"
        key={id}
        style={{ right: margins.right, top: tops[id] }}
      >
        <Button
          className="h-6 bg-red-600 px-2 text-[11px] text-white hover:bg-red-600/90"
          data-accept="false"
          data-change={id}
          onClick={settle}
          onMouseDown={keepFocus}
          size="xs"
        >
          Reject
        </Button>
        <Button
          className="h-6 bg-emerald-600 px-2 text-[11px] text-white hover:bg-emerald-600/90"
          data-accept="true"
          data-change={id}
          onClick={settle}
          onMouseDown={keepFocus}
          size="xs"
        >
          Accept
        </Button>
      </div>
    );
  });
}

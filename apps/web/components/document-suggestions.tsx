"use client";

import { CodeNode } from "@lexical/code";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
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
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getState,
  $isElementNode,
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
import type { Edit } from "@/lib/style-engine";
import type { Source } from "@/lib/tavily";

// Changes the AI proposes are made in the document itself, and wait there to be
// accepted or rejected. A block, or a few words in one, is either new ("add")
// or about to go ("remove"). The parts of one change share an id, so a replaced
// block and the text that replaces it, or a word and the word that takes its
// place, are accepted or rejected together.
interface Suggestion {
  id: string;
  kind: "add" | "remove";
}

export const suggestionState = createState("suggestion", {
  parse: (value): Suggestion | null => {
    const suggestion = value as Partial<Suggestion> | null;

    return typeof suggestion?.id === "string" &&
      (suggestion.kind === "add" || suggestion.kind === "remove")
      ? { id: suggestion.id, kind: suggestion.kind }
      : null;
  },
});

export interface Change {
  id: string;
  // The blocks or words of the change, in the order they come in the document.
  keys: NodeKey[];
}

// Every block or piece of text with a suggestion on it, in document order.
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

// Accepting keeps new text and drops text marked to go. Rejecting does the
// opposite. With no ids, every change is settled.
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

// Words with their format, so that a change to a few of them can be shown in
// place and the rest of the text keeps what it had.
interface Run {
  format: number;
  style: string;
  text: string;
}

const $runs = (block: ElementNode): Run[] | null => {
  const children = block.getChildren();

  // A block with a link or a line break in it is replaced whole instead.
  return children.every($isTextNode)
    ? children.map((node) => ({
        format: node.getFormat(),
        style: node.getStyle(),
        text: node.getTextContent(),
      }))
    : null;
};

// The part of a block's text from one place to another, as runs.
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

// What changed between two texts, word by word.
function diffWords(before: string, after: string) {
  const tokens = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];
  const a = tokens(before);
  const b = tokens(after);

  if (a.length * b.length > 250_000) {
    return null;
  }

  // The longest run of words the two texts share, worked out from the end.
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
      // Words that go come before the words that replace them.
      steps.push({ kind: "remove", text: a[i] ?? "" });
      i += 1;
    } else {
      steps.push({ kind: "add", text: b[j] ?? "" });
      j += 1;
    }
  }

  // Neighboring steps of one kind are one.
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

// Changes only the words that differ between a block and what it should say,
// each as a change of its own, and leaves the rest of the block alone. This is
// for a rewrite that touches a few words; it says no when most of the text
// differs, or the block is more than text, and the block is replaced whole.
function $diffInPlace(block: ElementNode, fresh: ElementNode) {
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
  let id = crypto.randomUUID();
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
      // Words between two changes end the change before them. A space does
      // not: "Q3" becoming "Quarter 3" is one change.
      if (open && step.text.trim()) {
        id = crypto.randomUUID();
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
        $setState(node, suggestionState, { id, kind: step.kind });
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

// A mark like [2] in the text becomes a link to the second source.
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

// Markdown as the document's own blocks. The first big heading of a document
// that has nothing yet is its title, and the levels the document has no style
// for are its smallest heading.
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

// Puts the edits in the document as changes waiting to be settled. Blocks are
// named by their place in the document as it was when the request was made.
// The text carries its sources, as numbered links and a list at the end, only
// when it was asked to. Otherwise any such marks the model left are taken out,
// and the sources are shown beside the document instead.
export function $applyEdits(edits: Edit[], found: Source[], cite: boolean) {
  const sources = cite ? found : [];
  const root = $getRoot();
  const existing = root.getChildren();
  const last = existing.length - 1;
  // The new blocks that go after each existing one, and -1 for the start.
  const after = new Map<number, ElementNode[]>();
  const flags: [LexicalNode, Suggestion][] = [];
  let added = 0;
  // Words changed inside blocks, which are changes of their own.
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

    // A rewrite of a block that changes a few of its words shows just those
    // words, instead of a block taken out and the same block put back.
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

      // Every new block is a change of its own, so each can be accepted or
      // rejected alone. The first block of a replacement goes with the block it
      // replaces, as one change.
      created.forEach((block, index) =>
        insertAfter(
          at,
          [block],
          index === 0 && edit.action === "replace" ? id : crypto.randomUUID()
        )
      );
    }
  }

  // The list of where the text came from goes at the end, as a change of its own.
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
    $setState(block, suggestionState, suggestion);
  }

  // How many changes there are to settle.
  return new Set(flags.map(([, suggestion]) => suggestion.id)).size + inPlace;
}

// A block as the Markdown that would make it.
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

// What the document says in each top-level block, for the AI to point at.
export function $documentBlocks() {
  return $getRoot()
    .getChildren()
    .map((block) => $blockText(block).slice(0, 1200));
}

// The changes waiting in the document.
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

// Shows each block of a change as new or as going, in green or in red.
export function useSuggestionMarks() {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    const mark: MutationListener = (mutations) =>
      editor.getEditorState().read(() => {
        for (const key of mutations.keys()) {
          const node = $getNodeByKey(key);
          const element = editor.getElementByKey(key);
          const suggestion = node ? $getState(node, suggestionState) : null;
          // Words in a block are marked differently from a whole block.
          const attribute = $isTextNode(node)
            ? "suggestionText"
            : "suggestion";

          if (!element) {
            continue;
          }

          if (suggestion) {
            element.dataset[attribute] = suggestion.kind;
          } else {
            delete element.dataset[attribute];
          }
        }
      });

    const stops = [
      ParagraphNode,
      HeadingNode,
      QuoteNode,
      ListNode,
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

// How far above a change its buttons go: their own height and a little room.
const BUTTONS_HEIGHT = 30;

// Accept and Reject for the change the navigator is on, next to the change.
// Only one change has them at a time, so a long answer does not fill the page
// with buttons.
export function SuggestionButtons({
  current,
  layer,
  margin,
  pitch,
  scale,
}: {
  // Which change the navigator is on, counting from 0.
  current: number;
  layer: RefObject<HTMLElement | null>;
  // The top margin of a page, and how far one page starts below the one before.
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
        // The buttons sit just above the change, but never in the margin at
        // the top of a page: the page covers it, and they would be hidden.
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

  // When the buttons move to another change, because one was settled or the
  // arrows were used, the document follows them.
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

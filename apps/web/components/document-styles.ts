import { $isCodeNode } from "@lexical/code";
import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $copyBlockFormatIndent } from "@lexical/selection";
import {
  $isTableCellNode,
  TableCellHeaderStates,
  TableCellNode,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $getState,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  $setState,
  COMMAND_PRIORITY_LOW,
  createState,
  type ElementNode,
  getStyleObjectFromCSS,
  INDENT_CONTENT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalNode,
  type MutationListener,
  OUTDENT_CONTENT_COMMAND,
  ParagraphNode,
  type RangeSelection,
  TextNode,
} from "lexical";
import { useLayoutEffect, useState } from "react";

// What a text style decides about the text that wears it.
export const FORMAT_PROPERTIES = [
  "color",
  "font-family",
  "font-size",
  "font-weight",
];

export type Format = Record<string, string>;

// The styles a document has changed, by tag. They live on the document's root
// so they save, load and undo with everything else in it.
export const stylesState = createState("styles", {
  parse: (value) =>
    value && typeof value === "object" ? (value as Record<string, Format>) : {},
});

// The text style of a block whose kind does not say it. It is kept apart from
// the kind, so a bullet or a quote can be a heading too.
const styleState = createState("style", {
  parse: (value) => (typeof value === "string" ? value : undefined),
});

// Normal text is a block with no style of its own.
export const $setStyle = <Block extends ElementNode>(
  block: Block,
  tag: string
) => $setState(block, styleState, tag === "paragraph" ? undefined : tag);

// How far the first line of a paragraph is moved in, in pixels. Tab at the start
// of a paragraph moves it half an inch, which is also how wide a tab is.
export const FIRST_LINE_STEP = 48;

export const firstLineState = createState("firstLine", {
  parse: (value) => (typeof value === "number" && value > 0 ? value : 0),
});

// Where a tab in a paragraph stops, measured from the left margin in pixels.
// Text after a tab starts at a left stop, is centred on a centre stop and ends
// at a right stop.
export const TAB_STOP_TYPES = ["left", "center", "right"] as const;

export interface TabStop {
  type: (typeof TAB_STOP_TYPES)[number];
  x: number;
}

export const tabStopsState = createState("tabStops", {
  parse: (value): TabStop[] =>
    Array.isArray(value)
      ? value.filter(
          (stop): stop is TabStop =>
            TAB_STOP_TYPES.includes(stop?.type) && typeof stop.x === "number"
        )
      : [],
});

// The space between the sides of the page and the text, in pixels.
export const DEFAULT_MARGIN = 96;

export interface Margins {
  left: number;
  right: number;
}

export const marginsState = createState("margins", {
  parse: (value): Margins => {
    const margins = (value ?? {}) as Partial<Margins>;

    return {
      left: typeof margins.left === "number" ? margins.left : DEFAULT_MARGIN,
      right: typeof margins.right === "number" ? margins.right : DEFAULT_MARGIN,
    };
  },
});

interface TextStyle {
  // The block its text is in when that is neither a bullet nor a quote.
  create: () => ElementNode;
  // The look a document can change.
  format: Format;
  // The spacing of its lines, which goes with that look and stays as it is.
  layout: Format;
  // The space around it. A bullet or a quote has its own instead.
  margin: string;
  name: string;
  tag: string;
}

const normal: TextStyle = {
  create: $createParagraphNode,
  format: {
    color: "var(--foreground)",
    "font-family": "var(--font-sans)",
    "font-size": "16px",
    "font-weight": "400",
  },
  layout: { "letter-spacing": "normal", "line-height": "1.5" },
  margin: "0 0 12px",
  name: "Normal text",
  tag: "paragraph",
};

export const textStyles: TextStyle[] = [
  normal,
  {
    create: () => $setStyle($createParagraphNode(), "title"),
    format: {
      color: "var(--foreground)",
      "font-family": "var(--font-display)",
      "font-size": "40px",
      "font-weight": "700",
    },
    layout: { "letter-spacing": "-0.025em", "line-height": "1.2" },
    margin: "0 0 8px",
    name: "Title",
    tag: "title",
  },
  {
    create: () => $setStyle($createParagraphNode(), "subtitle"),
    format: {
      color: "var(--muted-foreground)",
      "font-family": "var(--font-sans)",
      "font-size": "20px",
      "font-weight": "400",
    },
    layout: { "letter-spacing": "normal", "line-height": "1.4" },
    margin: "0 0 16px",
    name: "Subtitle",
    tag: "subtitle",
  },
  {
    create: () => $createHeadingNode("h1"),
    format: {
      color: "var(--foreground)",
      "font-family": "var(--font-display)",
      "font-size": "32px",
      "font-weight": "700",
    },
    layout: { "letter-spacing": "-0.025em", "line-height": "1.25" },
    margin: "20px 0 12px",
    name: "Heading 1",
    tag: "h1",
  },
  {
    create: () => $createHeadingNode("h2"),
    format: {
      color: "var(--foreground)",
      "font-family": "var(--font-display)",
      "font-size": "24px",
      "font-weight": "700",
    },
    layout: { "letter-spacing": "-0.025em", "line-height": "1.25" },
    margin: "16px 0 12px",
    name: "Heading 2",
    tag: "h2",
  },
  {
    create: () => $createHeadingNode("h3"),
    format: {
      color: "var(--foreground)",
      "font-family": "var(--font-display)",
      "font-size": "19px",
      "font-weight": "600",
    },
    layout: { "letter-spacing": "normal", "line-height": "1.25" },
    margin: "16px 0 8px",
    name: "Heading 3",
    tag: "h3",
  },
  {
    create: () => $createHeadingNode("h4"),
    format: {
      color: "var(--foreground)",
      "font-family": "var(--font-display)",
      "font-size": "16px",
      "font-weight": "600",
    },
    layout: { "letter-spacing": "normal", "line-height": "1.25" },
    margin: "12px 0 8px",
    name: "Heading 4",
    tag: "h4",
  },
];

// A tag the menu does not offer, such as a sixth level of heading, counts as
// normal text.
export const styleFor = (tag: string) =>
  textStyles.find((style) => style.tag === tag) ?? normal;

// A block that holds text and wears a text style. A list item that only holds
// a list nested in it is not one.
const $isTextBlock = (
  node: LexicalNode | null | undefined
): node is ElementNode =>
  $isParagraphNode(node) ||
  $isHeadingNode(node) ||
  $isQuoteNode(node) ||
  ($isListItemNode(node) && !$isListNode(node.getFirstChild()));

// The block a node is in: one of those, or a block of code, which can be
// turned into one.
export const $blockOf = (node: LexicalNode) =>
  $findMatchingParent(
    node,
    (parent): parent is ElementNode =>
      $isTextBlock(parent) || $isCodeNode(parent)
  );

// A heading goes by its level. Any other block is normal text unless it says
// otherwise.
export const $styleOf = (block: ElementNode | null) =>
  (block && $getState(block, styleState)) ??
  ($isHeadingNode(block) ? block.getTag() : "paragraph");

// Whether the caret is at the very start of a block.
const $atBlockStart = (selection: RangeSelection, block: ElementNode) => {
  const { anchor } = selection;

  return (
    selection.isCollapsed() &&
    anchor.offset === 0 &&
    (anchor.getNode().is(block) ||
      anchor.getNode().is(block.getFirstDescendant()))
  );
};

// The blocks a selection touches, in the order they come in the document.
export const $selectedBlocks = (selection: RangeSelection) =>
  new Set(
    selection
      .getNodes()
      .map($blockOf)
      .filter((block) => block !== null)
  );

// Puts another block in place of each selected one that `swap` makes one for.
// The text moves into it and the selection stays where it was.
export function $swapBlocks(swap: (block: ElementNode) => ElementNode | null) {
  const selection = $getSelection();
  const swapped: ElementNode[] = [];

  if (!$isRangeSelection(selection)) {
    return swapped;
  }

  // Lexical moves the selection off a block that is replaced while holding it
  // directly, as an empty one does. This copy is put on the new block instead.
  const kept = selection.clone();

  for (const block of $selectedBlocks(selection)) {
    const next = swap(block);

    if (!next) {
      continue;
    }

    $copyBlockFormatIndent(block, next);
    $setState(next, firstLineState, $getState(block, firstLineState));
    $setState(next, tabStopsState, $getState(block, tabStopsState));
    block.replace(next, true);

    for (const point of [kept.anchor, kept.focus]) {
      if (point.key === block.getKey()) {
        point.set(next.getKey(), point.offset, "element");
      }
    }

    swapped.push(next);
  }

  $setSelection(kept);

  return swapped;
}

// Keeps the page showing the document's text styles, and returns the ones the
// document has changed. The styles reach the page as variables on the editor,
// such as --h1-font-size, which the blocks of each style read.
export function useTextStyles() {
  const [editor] = useLexicalComposerContext();
  const [custom, setCustom] = useState<Record<string, Format>>({});

  // Before paint, and in the same step as the edit that changed them, so that
  // nothing measures or draws the page with the old ones.
  useLayoutEffect(() => {
    let applied: Record<string, Format> | undefined;

    const apply = () => {
      const styles = $getState($getRoot(), stylesState);
      const root = editor.getRootElement();

      if (!root || styles === applied) {
        return;
      }

      applied = styles;
      setCustom(styles);

      for (const { format, tag } of textStyles) {
        for (const [property, value] of Object.entries({
          ...format,
          ...styles[tag],
        })) {
          root.style.setProperty(`--${tag}-${property}`, value);
        }
      }
    };

    editor.getEditorState().read(apply);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(apply)
    );
  }, [editor]);

  return custom;
}

// The page margins of the document, kept current as they are dragged.
export function useMargins() {
  const [editor] = useLexicalComposerContext();
  const [margins, setMargins] = useState<Margins>({
    left: DEFAULT_MARGIN,
    right: DEFAULT_MARGIN,
  });

  // Before paint, so a page is never drawn with the margins of the one before.
  useLayoutEffect(() => {
    const read = () => {
      const next = $getState($getRoot(), marginsState);

      setMargins((current) =>
        current.left === next.left && current.right === next.right
          ? current
          : next
      );
    };

    editor.getEditorState().read(read);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(read)
    );
  }, [editor]);

  return margins;
}

const tabsIn = (element: HTMLElement) =>
  [...element.querySelectorAll("span")].filter(
    (span) => span.textContent === "\t"
  );

function clearTabs(element: HTMLElement) {
  for (const tab of tabsIn(element)) {
    tab.style.display = "";
    tab.style.width = "";
  }
}

// Gives each tab in a paragraph the width that takes the text after it to the
// next stop: the left edge of the text to a left stop, its right edge to a
// right one. A tab past the last stop keeps the width of a plain tab.
function fitTabs(element: HTMLElement, stops: TabStop[]) {
  const tabs = tabsIn(element);

  clearTabs(element);

  const box = element.getBoundingClientRect();
  // The page is scaled, and measurements come back in what is on the screen.
  const scale = box.width / element.offsetWidth || 1;

  tabs.forEach((tab, index) => {
    const start = (tab.getBoundingClientRect().left - box.left) / scale;
    const stop = stops
      .filter((candidate) => candidate.x > start + 1)
      .sort((a, b) => a.x - b.x)[0];

    if (!stop) {
      return;
    }

    let width = stop.x - start;

    if (stop.type !== "left") {
      const after = document.createRange();
      const next = tabs[index + 1];

      after.setStartAfter(tab);

      if (next) {
        after.setEndBefore(next);
      } else {
        after.selectNodeContents(element);
        after.setStartAfter(tab);
      }

      // The text ends at a right stop and is centred on a centre one.
      const text = after.getBoundingClientRect().width / scale;

      width = Math.max(0, width - (stop.type === "center" ? text / 2 : text));
    }

    tab.style.display = "inline-block";
    tab.style.width = `${width}px`;
  });
}

// Keeps the tabs of paragraphs that have tab stops lined up with them.
export function useTabStops() {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    let fitted = new Set<HTMLElement>();

    const fit = () => {
      const found = editor.getEditorState().read(() => {
        const blocks: [HTMLElement, TabStop[]][] = [];

        for (const node of $getRoot().getChildren()) {
          const stops = $isTextBlock(node) ? $getState(node, tabStopsState) : [];
          const element = editor.getElementByKey(node.getKey());

          if (stops.length > 0 && element) {
            blocks.push([element, stops]);
          }
        }

        return blocks;
      });
      const next = new Set(found.map(([element]) => element));

      // A paragraph that lost its stops goes back to plain tabs.
      for (const element of fitted) {
        if (!next.has(element)) {
          clearTabs(element);
        }
      }

      fitted = next;

      for (const [element, stops] of found) {
        fitTabs(element, stops);
      }
    };

    fit();

    return editor.registerUpdateListener(fit);
  }, [editor]);
}

// Makes the blocks on the page follow their text styles.
export function useStyledBlocks() {
  const [editor] = useLexicalComposerContext();

  // Before paint, so the page is never counted or drawn without it.
  useLayoutEffect(() => {
    // Gives a block the look of its style, by pointing it at that style's
    // variables. Lexical reports each block it draws or redraws, including
    // one it brings back with undo.
    const dress = (keys: Iterable<string>) =>
      editor.getEditorState().read(() => {
        for (const key of keys) {
          const node = $getNodeByKey(key);
          const element = editor.getElementByKey(key);

          if (!(element && $isTextBlock(node))) {
            continue;
          }

          const style = styleFor($styleOf(node));
          // An empty block has no text to carry formatting picked for it, so
          // the block wears that itself. Its line and caret are then the right
          // size before anything is typed.
          const typed = getStyleObjectFromCSS(
            node.isEmpty() ? node.getTextStyle() : ""
          );
          // A paragraph in a table cell has no space around it of its own.
          const alone =
            ($isParagraphNode(node) || $isHeadingNode(node)) &&
            !$isTableCellNode(node.getParent());

          const cell = node.getParent();
          // The cells of a header row are bold.
          const heading =
            $isTableCellNode(cell) &&
            cell.getHeaderStyles() !== TableCellHeaderStates.NO_STATUS;

          for (const property of FORMAT_PROPERTIES) {
            // A quote is muted whatever its text style.
            const own =
              property === "color" && $isQuoteNode(node)
                ? ""
                : `var(--${style.tag}-${property})`;

            element.style.setProperty(
              property,
              typed[property] ??
                (heading && property === "font-weight" ? "600" : own)
            );
          }

          for (const [property, value] of Object.entries(style.layout)) {
            element.style.setProperty(property, value);
          }

          element.style.setProperty("margin", alone ? style.margin : "");

          const indent = $getState(node, firstLineState);

          element.style.setProperty("text-indent", indent ? `${indent}px` : "");

          if ($isListItemNode(node)) {
            // A bullet looks like the first character of its item.
            const first = node.getFirstDescendant();
            const own = $isTextNode(first)
              ? getStyleObjectFromCSS(first.getStyle())
              : {};

            for (const property of FORMAT_PROPERTIES) {
              const value =
                property === "font-weight" &&
                $isTextNode(first) &&
                first.hasFormat("bold")
                  ? "700"
                  : own[property];

              element.style.setProperty(`--marker-${property}`, value ?? "");
            }
          }
        }
      });

    // Text moves its bullet along without redrawing its list item.
    const dressBullets: MutationListener = (mutations) =>
      dress(
        editor.getEditorState().read(() =>
          [...mutations.keys()]
            .map((key) => $getNodeByKey(key)?.getParent())
            .filter((item) => $isListItemNode(item))
            .map((item) => item.getKey())
        )
      );
    const dressBlocks: MutationListener = (mutations) => dress(mutations.keys());
    // A cell that becomes a header changes how the paragraphs in it look.
    const dressCells: MutationListener = (mutations) =>
      dress(
        editor.getEditorState().read(() =>
          [...mutations.keys()].flatMap((key) => {
            const cell = $getNodeByKey(key);

            return $isTableCellNode(cell)
              ? cell.getChildren().map((child) => child.getKey())
              : [];
          })
        )
      );

    // Lexical carries a text style over a new line only when the kind of block
    // says it, as a heading does. A title is a paragraph that was told, so the
    // same is done for it here: text after the caret stays a title, and a line
    // left empty is normal text.
    const split = () => {
      const selection = $getSelection();
      const block =
        $isRangeSelection(selection) && selection.isCollapsed()
          ? $blockOf(selection.anchor.getNode())
          : null;
      const tag = $styleOf(block);
      const indent = block ? $getState(block, firstLineState) : 0;
      const stops = block ? $getState(block, tabStopsState) : [];

      if (
        !($isRangeSelection(selection) && $isParagraphNode(block)) ||
        (tag === "paragraph" && !indent && stops.length === 0)
      ) {
        return false;
      }

      const next = selection.insertParagraph();

      // The next paragraph starts as indented as this one, with the same tab
      // stops.
      if (next) {
        $setState(next, firstLineState, indent);
        $setState(next, tabStopsState, stops);
      }

      if (next && !next.isEmpty()) {
        $setStyle(next, tag);

        if (block.isEmpty()) {
          $setStyle(block, "paragraph");
        }
      }

      return true;
    };

    // Tab nests a bullet wherever the caret is in it, as it does in other
    // editors. At the start of any other block it moves the first line in by
    // half an inch, and Shift+Tab moves it back. Anywhere else it is a tab
    // character, which Lexical's own handling of Tab takes care of.
    const tab = (event: KeyboardEvent) => {
      const selection = $getSelection();
      const block = $isRangeSelection(selection)
        ? $blockOf(selection.anchor.getNode())
        : null;

      // In a table Tab moves from cell to cell, which the table takes care of.
      if (
        !($isRangeSelection(selection) && block) ||
        $isTableCellNode(block.getParent())
      ) {
        return false;
      }

      if ($isListItemNode(block)) {
        event.preventDefault();

        return editor.dispatchCommand(
          event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
          undefined
        );
      }

      if ($isCodeNode(block)) {
        return false;
      }

      // With tab stops, Tab is a tab character wherever the caret is, and the
      // stops decide how far it goes.
      if ($getState(block, tabStopsState).length > 0 && !event.shiftKey) {
        event.preventDefault();

        return editor.dispatchCommand(INSERT_TAB_COMMAND, undefined);
      }

      if (!$atBlockStart(selection, block)) {
        return false;
      }

      event.preventDefault();
      $setState(block, firstLineState, (indent) =>
        Math.max(0, indent + (event.shiftKey ? -FIRST_LINE_STEP : FIRST_LINE_STEP))
      );

      return true;
    };

    // Backspace at the start of an indented paragraph takes the indent back
    // before it joins the paragraph above.
    const backspace = (event: KeyboardEvent) => {
      const selection = $getSelection();
      const block = $isRangeSelection(selection)
        ? $blockOf(selection.anchor.getNode())
        : null;

      if (
        !(
          $isRangeSelection(selection) &&
          block &&
          $atBlockStart(selection, block)
        ) ||
        !$getState(block, firstLineState)
      ) {
        return false;
      }

      event.preventDefault();
      $setState(block, firstLineState, (indent) =>
        Math.max(0, indent - FIRST_LINE_STEP)
      );

      return true;
    };

    return mergeRegister(
      editor.registerCommand(KEY_TAB_COMMAND, tab, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        backspace,
        COMMAND_PRIORITY_LOW
      ),
      ...[ParagraphNode, HeadingNode, QuoteNode, ListItemNode].map((kind) =>
        editor.registerMutationListener(kind, dressBlocks)
      ),
      editor.registerMutationListener(TextNode, dressBullets),
      editor.registerMutationListener(TableCellNode, dressCells),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        split,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
}

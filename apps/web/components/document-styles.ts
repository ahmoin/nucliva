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
  INSERT_PARAGRAPH_COMMAND,
  type LexicalNode,
  type MutationListener,
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
          const alone = $isParagraphNode(node) || $isHeadingNode(node);

          for (const property of FORMAT_PROPERTIES) {
            // A quote is muted whatever its text style.
            const own =
              property === "color" && $isQuoteNode(node)
                ? ""
                : `var(--${style.tag}-${property})`;

            element.style.setProperty(property, typed[property] ?? own);
          }

          for (const [property, value] of Object.entries(style.layout)) {
            element.style.setProperty(property, value);
          }

          element.style.setProperty("margin", alone ? style.margin : "");

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

      if (
        !($isRangeSelection(selection) && $isParagraphNode(block)) ||
        tag === "paragraph"
      ) {
        return false;
      }

      const next = selection.insertParagraph();

      if (next && !next.isEmpty()) {
        $setStyle(next, tag);

        if (block.isEmpty()) {
          $setStyle(block, "paragraph");
        }
      }

      return true;
    };

    return mergeRegister(
      ...[ParagraphNode, HeadingNode, QuoteNode, ListItemNode].map((kind) =>
        editor.registerMutationListener(kind, dressBlocks)
      ),
      editor.registerMutationListener(TextNode, dressBullets),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        split,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
}

"use client";

import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  CheckIcon,
  ListBulletsIcon,
  MinusIcon,
  PlusIcon,
  QuotesIcon,
  RulerIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  type Icon,
} from "@phosphor-icons/react";
import { $isCodeNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  $createQuoteNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  getCSSFromStyleObject,
} from "@lexical/selection";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { Toggle } from "@workspace/ui/components/toggle";
import {
  $getRoot,
  $getSelection,
  $getState,
  $isRangeSelection,
  $isTextNode,
  $setState,
  type EditorState,
  type ElementNode,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  getStyleObjectFromCSS,
  REDO_COMMAND,
  type SerializedEditorState,
  type SerializedElementNode,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AutocompleteNode,
  AutocompletePlugin,
} from "@/components/document-autocomplete";
import { DraftBar } from "@/components/document-draft-bar";
import { DocumentPages, PAGE_WIDTH } from "@/components/document-pages";
import { DOCUMENT_TRANSFORMERS } from "@/components/document-table";
import { Ruler } from "@/components/document-ruler";
import {
  $blockOf,
  $selectedBlocks,
  $setStyle,
  $styleOf,
  $swapBlocks,
  FORMAT_PROPERTIES,
  styleFor,
  stylesState,
  textStyles,
  useTextStyles,
} from "@/components/document-styles";
import { localDb } from "@/lib/local-db";

const zoomLevels = [50, 75, 90, 100, 125, 150, 200];

// The toolbar's menu buttons show a value, so they read as plain text and not
// as the app's uppercase button labels.
const menuButtonClass =
  "justify-between px-2 font-normal text-sm normal-case tracking-normal";

// A toolbar toggle is as wide as the icon buttons beside it. While on it is lit
// in the brand colour: the hover shade alone would look the same on and off
// with the pointer still over it.
const toggleClass = "px-0 aria-pressed:bg-primary/15 aria-pressed:text-primary";

type Alignment = "center" | "justify" | "left" | "right";

const alignmentIcons: Record<Alignment, Icon> = {
  center: TextAlignCenterIcon,
  justify: TextAlignJustifyIcon,
  left: TextAlignLeftIcon,
  right: TextAlignRightIcon,
};

const alignments: { label: string; value: Alignment }[] = [
  { label: "Align left", value: "left" },
  { label: "Align center", value: "center" },
  { label: "Align right", value: "right" },
  { label: "Justify", value: "justify" },
];

// Blocks that are not a text style but still get named on the style button.
// Anything else counts as normal text.
const otherBlocks: Record<string, string> = { code: "Code" };

// A style row is drawn in its own look, but never so big it takes over the menu.
const PREVIEW_SIZE_MAX = "36px";

const withoutFormat = (css: string) =>
  getCSSFromStyleObject(
    Object.fromEntries(
      Object.entries(getStyleObjectFromCSS(css)).filter(
        ([property]) => !FORMAT_PROPERTIES.includes(property)
      )
    )
  );

// Formatting put directly on text hides its style's own. Text that is given a
// style drops it, so the style shows. This reads the selection afresh, because
// swapping a block for another replaces the one the caller was holding.
function $clearFormatting() {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return;
  }

  for (const block of $selectedBlocks(selection)) {
    for (const node of block.getAllTextNodes()) {
      node.setStyle(withoutFormat(node.getStyle()));
    }

    block.setTextStyle(withoutFormat(block.getTextStyle()));
  }

  selection.setStyle(withoutFormat(selection.style));
}

// A bullet, as opposed to an item of a numbered list.
const $isBullet = (block: ElementNode) => {
  const list = block.getParent();

  return (
    $isListItemNode(block) &&
    $isListNode(list) &&
    list.getListType() === "bullet"
  );
};

interface Font {
  family: string;
  name: string;
  weights?: number[];
}

// The brand fonts are the ones app/layout.tsx loads, listed with the weights
// those files ship with. Instrument Sans comes first: it is what a document
// uses by default.
const brandFonts: Font[] = [
  {
    family: "Instrument Sans, sans-serif",
    name: "Instrument Sans",
    weights: [400, 500, 600, 700],
  },
  {
    family: "Bricolage Grotesque, sans-serif",
    name: "Bricolage Grotesque",
    weights: [200, 300, 400, 500, 600, 700, 800],
  },
  {
    family: "Geist Mono, monospace",
    name: "Geist Mono",
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  },
];

// System fonts only come in regular and bold, which the Bold button covers.
const systemFonts: Font[] = [
  { family: "Arial, sans-serif", name: "Arial" },
  { family: "Courier New, monospace", name: "Courier New" },
  { family: "Georgia, serif", name: "Georgia" },
  { family: "Times New Roman, serif", name: "Times New Roman" },
  { family: "Verdana, sans-serif", name: "Verdana" },
];

const families: Record<string, string> = Object.fromEntries(
  [...brandFonts, ...systemFonts].map((font) => [font.name, font.family])
);

const weightNames: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Normal",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

// Menu rows are styled as uppercase labels by default. Rows that show a value,
// like a font name or a zoom level, read as written instead.
const plainItemClass = "font-normal text-sm normal-case tracking-normal";

// The first family in a CSS font list, without its quotes, is the font's name.
const fontName = (family: string) =>
  (family.split(",")[0] ?? "").replaceAll(/["']/g, "").trim();

const FONT_SIZE_MIN = 1;
const FONT_SIZE_MAX = 400;

// Ten columns: greys, then pure colours, then three tints and three shades of
// each of those colours.
const textColors = [
  "#000000 #434343 #666666 #999999 #b7b7b7 #cccccc #d9d9d9 #efefef #f3f3f3 #ffffff",
  "#980000 #ff0000 #ff9900 #ffff00 #00ff00 #00ffff #4a86e8 #0000ff #9900ff #ff00ff",
  "#e6b8af #f4cccc #fce5cd #fff2cc #d9ead3 #d0e0e3 #c9daf8 #cfe2f3 #d9d2e9 #ead1dc",
  "#dd7e6b #ea9999 #f9cb9c #ffe599 #b6d7a8 #a2c4c9 #a4c2f4 #9fc5e8 #b4a7d6 #d5a6bd",
  "#cc4125 #e06666 #f6b26b #ffd966 #93c47d #76a5af #6d9eeb #6fa8dc #8e7cc3 #c27ba0",
  "#a61c00 #cc0000 #e69138 #f1c232 #6aa84f #45818e #3c78d8 #3d85c6 #674ea7 #a64d79",
  "#85200c #990000 #b45f06 #bf9000 #38761d #134f5c #1155cc #0b5394 #351c75 #741b47",
  "#5b0f00 #660000 #783f04 #7f6000 #274e13 #0c343d #1c4587 #073763 #20124d #4c1130",
].flatMap((row) => row.split(" "));

// One row of the colour menu, leaving a cell for the button that adds one.
const CUSTOM_COLORS_SHOWN = 9;

// The colours in the document that are not in the palette, most used first. A
// colour counts for as much text as wears it.
function $customColors() {
  const usage = new Map<string, number>();

  for (const node of $getRoot().getAllTextNodes()) {
    const value = getStyleObjectFromCSS(node.getStyle()).color?.toLowerCase();

    if (value && !textColors.includes(value)) {
      usage.set(value, (usage.get(value) ?? 0) + node.getTextContentSize());
    }
  }

  return [...usage]
    .sort(([, a], [, b]) => b - a)
    .slice(0, CUSTOM_COLORS_SHOWN)
    .map(([value]) => value);
}

// Paragraphs and headings have no classes here. How text looks comes from its
// text style, which each block is given as it is drawn.
const theme = {
  code: "my-3 block bg-muted p-3 font-mono text-[15px]",
  link: "text-primary underline underline-offset-2",
  list: {
    // The bullet takes the look of the first character, from variables the
    // item is given as it is drawn. Without them it follows the item.
    // An item that only holds a nested list has no bullet of its own.
    nested: { listitem: "list-none" },
    listitem:
      "my-1 marker:font-(--marker-font-weight) marker:font-(family-name:--marker-font-family) marker:text-(--marker-color) marker:text-(length:--marker-font-size)",
    ol: "my-3 list-decimal pl-7",
    ul: "my-3 list-disc pl-7",
  },
  quote: "my-3 border-primary border-l-2 pl-4 text-muted-foreground italic",
  table: "my-3 w-full table-fixed border-collapse",
  tableCell: "border border-foreground/20 px-2 py-1 align-top",
  tableCellHeader: "bg-muted text-left font-semibold",
  text: {
    // Important, so Bold still shows on text that has a font weight of its own.
    bold: "font-bold!",
    code: "bg-muted px-1 font-mono text-[15px]",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
  },
};

const nodes = [
  AutocompleteNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  CodeNode,
  TableNode,
  TableRowNode,
  TableCellNode,
];

// Documents saved while pages were nodes still wrap their blocks in them.
function serializeContent(content: object) {
  const { root } = content as Partial<
    SerializedEditorState<SerializedElementNode>
  >;
  const children = root?.children.flatMap((node) =>
    node.type === "page" ? node.children : node
  );

  return children?.length
    ? JSON.stringify({ root: { ...root, children } })
    : undefined;
}

type SaveStatus = "error" | "saved" | "saving";

const statusLabel: Record<SaveStatus, string> = {
  error: "Could not save",
  saved: "Saved",
  saving: "Saving...",
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [font, setFont] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState("paragraph");
  const [bulleted, setBulleted] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const [align, setAlign] = useState<Alignment>("left");
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  // Ahead of the reading below, which needs the page to show the current styles.
  const custom = useTextStyles();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  // What is being typed into the size box, until Enter applies it.
  const [sizeDraft, setSizeDraft] = useState<string | null>(null);

  useEffect(() => {
    // Text without a font, size or weight of its own shows the one it
    // inherits, so headings and code read correctly. With no caret yet, that
    // is the document's own.
    const read = () => {
      const selection = $getSelection();
      const range = $isRangeSelection(selection) ? selection : null;
      const element = range
        ? editor.getElementByKey(range.anchor.key)
        : editor.getRootElement();

      if (!element) {
        return;
      }

      const inherited = getComputedStyle(element);
      const name = fontName(inherited.fontFamily);
      const block = range ? $blockOf(range.anchor.getNode()) : null;
      const blocks = range ? [...$selectedBlocks(range)] : [];
      const valueOf = (property: string, fallback: string) =>
        range
          ? $getSelectionStyleValueForProperty(range, property, fallback)
          : fallback;

      setTextStyle($isCodeNode(block) ? "code" : $styleOf(block));
      // A button is lit when everything selected is what it makes.
      setBulleted(blocks.length > 0 && blocks.every($isBullet));
      setQuoted(blocks.length > 0 && blocks.every($isQuoteNode));
      // Text with no alignment, or one that follows the writing direction, sits
      // on the left.
      const format = block?.getFormatType();

      setAlign(
        alignments.find((item) => item.value === format)?.value ?? "left"
      );
      setFont(fontName(valueOf("font-family", families[name] ?? name)) || null);
      setFontSize(
        Number.parseFloat(valueOf("font-size", inherited.fontSize)) || null
      );
      setWeight(
        Number.parseFloat(valueOf("font-weight", inherited.fontWeight)) || null
      );
      setColor(valueOf("color", inherited.color) || null);
    };

    editor.getEditorState().read(read);

    return editor.registerUpdateListener(({ editorState }) =>
      editorState.read(read)
    );
  }, [editor]);

  // A font row carries its family, and a weight row its weight as well. A row
  // without a weight puts the text back on the font's regular weight.
  const pickFont = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { family, weight: picked } = event.currentTarget.dataset;

      // A row that opens a weight menu would otherwise leave the menu open.
      setFontMenuOpen(false);
      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        $patchStyleText(selection, {
          "font-family": family ?? null,
          "font-weight": picked ?? null,
        });

        // A chosen weight replaces bold, so the text shows exactly that weight.
        if (
          picked &&
          (!selection.isCollapsed() || selection.hasFormat("bold"))
        ) {
          selection.formatText("bold", 0);
        }
      });
    },
    [editor]
  );
  const applyColor = useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { color: value });
        }
      });
    },
    [editor]
  );
  const pickColor = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { color: picked } = event.currentTarget.dataset;

      if (picked) {
        applyColor(picked);
      }
    },
    [applyColor]
  );
  // The document's custom colours are read afresh each time the menu opens.
  const toggleColorMenu = useCallback(
    (open: boolean) => {
      setColorMenuOpen(open);

      if (open) {
        setCustomColors(editor.getEditorState().read($customColors));
      }
    },
    [editor]
  );
  // The browser's picker reports every colour dragged across. Only the one it
  // closes on is applied, so undo steps back over it once.
  const customColor = useCallback(
    (input: HTMLInputElement | null) => {
      if (!input) {
        return;
      }

      const apply = () => {
        setColorMenuOpen(false);
        applyColor(input.value);
      };

      input.addEventListener("change", apply);

      return () => input.removeEventListener("change", apply);
    },
    [applyColor]
  );
  // Each piece of selected text gets its own next size, so growing a heading
  // and a paragraph together keeps them apart.
  const changeFontSize = useCallback(
    (next: (size: number) => number) => {
      const root = editor.getRootElement();

      editor.update(() => {
        const selection = $getSelection();

        if (!(root && $isRangeSelection(selection))) {
          return;
        }

        // Lexical asks more than once about an empty block the caret is in.
        // Each answer is kept, so a step is not taken twice.
        const sizes = new Map<string, string>();

        $patchStyleText(selection, {
          "font-size": (current, target) => {
            // Text with no size of its own is as big as its block.
            const node = $isRangeSelection(target)
              ? target.anchor.getNode()
              : target;
            const block = $isTextNode(node) ? node.getParentOrThrow() : node;
            const element = editor.getElementByKey(block.getKey()) ?? root;
            const size = Number.parseFloat(
              current ?? getComputedStyle(element).fontSize
            );
            const answer =
              sizes.get(node.getKey()) ??
              `${Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, next(size)))}px`;

            sizes.set(node.getKey(), answer);

            return answer;
          },
        });
      });
    },
    [editor]
  );
  const shrinkFont = useCallback(
    () => changeFontSize((size) => size - 1),
    [changeFontSize]
  );
  const growFont = useCallback(
    () => changeFontSize((size) => size + 1),
    [changeFontSize]
  );
  const handleSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setSizeDraft(event.target.value),
    []
  );
  const selectSize = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => event.target.select(),
    []
  );
  const discardSize = useCallback(() => setSizeDraft(null), []);
  // Enter applies what was typed, to the nearest half. Escape, or clicking
  // away, leaves the size as it was. Either way the caret goes back to the
  // document.
  const handleSizeKey = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter" && event.key !== "Escape") {
        return;
      }

      const typed = Number.parseFloat(sizeDraft ?? "");

      // Focus is about to move, and the key press must not follow it into
      // the document.
      event.preventDefault();

      if (event.key === "Enter" && !Number.isNaN(typed)) {
        changeFontSize(() => Math.round(typed * 2) / 2);
      }

      editor.focus();
    },
    [changeFontSize, editor, sizeDraft]
  );
  // Picking from a menu hands focus back to the document instead of leaving
  // it on the menu button.
  const focusEditor = useCallback(() => editor.getRootElement(), [editor]);

  const undo = useCallback(
    () => editor.dispatchCommand(UNDO_COMMAND, undefined),
    [editor]
  );
  const redo = useCallback(
    () => editor.dispatchCommand(REDO_COMMAND, undefined),
    [editor]
  );
  const bold = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"),
    [editor]
  );
  const italic = useCallback(
    () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"),
    [editor]
  );
  const pickAlign = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { align: picked } = event.currentTarget.dataset;

      if (picked) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, picked as Alignment);
      }
    },
    [editor]
  );
  // Bullets and quotes are kinds of block, and the text style is kept apart
  // from the kind. A heading made a bullet stays a heading, and is one again
  // once it stops being a bullet.
  const toggleList = useCallback(
    (pressed: boolean) => {
      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return;
        }

        if (pressed) {
          // A numbered list becomes a bulleted one.
          for (const block of $selectedBlocks(selection)) {
            const list = block.getParent();

            if ($isListItemNode(block) && $isListNode(list)) {
              list.setListType("bullet");
            }
          }
        }

        const items = $swapBlocks((block) => {
          if ($isListItemNode(block) === pressed) {
            return null;
          }

          const tag = $styleOf(block);

          return pressed
            ? $setStyle($createListItemNode(), tag)
            : styleFor(tag).create();
        });

        if (!pressed) {
          return;
        }

        // A new item joins the list before it, or starts one. Lexical joins
        // that to a list that follows.
        for (const item of items) {
          const previous = item.getPreviousSibling();

          if ($isListNode(previous) && previous.getListType() === "bullet") {
            previous.append(item);
          } else {
            const list = $createListNode("bullet");

            item.insertBefore(list);
            list.append(item);
          }
        }
      });
    },
    [editor]
  );
  const toggleQuote = useCallback(
    (pressed: boolean) => {
      editor.update(() => {
        $swapBlocks((block) => {
          if ($isQuoteNode(block) === pressed) {
            return null;
          }

          const tag = $styleOf(block);

          return pressed
            ? $setStyle($createQuoteNode(), tag)
            : styleFor(tag).create();
        });
      });
    },
    [editor]
  );

  // A style row gives the selected blocks that style. An "update" row first
  // makes the style look like the text at the caret, for the whole document.
  const pickStyle = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { tag, update } = event.currentTarget.dataset;
      const style = textStyles.find((item) => item.tag === tag);

      setStyleMenuOpen(false);
      editor.update(() => {
        if (!(style && $isRangeSelection($getSelection()))) {
          return;
        }

        if (update) {
          const root = $getRoot();
          const styles = $getState(root, stylesState);

          $setState(root, stylesState, {
            ...styles,
            [style.tag]: {
              ...styles[style.tag],
              ...(color && { color }),
              ...(font && { "font-family": families[font] ?? font }),
              ...(fontSize && { "font-size": `${fontSize}px` }),
              ...(weight && { "font-weight": `${weight}` }),
            },
          });
        }

        // A bullet or a quote takes the style and stays what it is. Any other
        // block becomes the style's own.
        $swapBlocks((block) => {
          if ($isListItemNode(block) || $isQuoteNode(block)) {
            $setStyle(block, style.tag);

            return null;
          }

          return style.create();
        });
        $clearFormatting();
      });
    },
    [color, editor, font, fontSize, weight]
  );
  const resetStyles = useCallback(
    () => editor.update(() => $setState($getRoot(), stylesState, {})),
    [editor]
  );

  const AlignIcon = alignmentIcons[align];

  const swatch = (value: string) => (
    <DropdownMenuItem
      aria-label={value}
      className="size-5 p-0 ring-1 ring-foreground/20 focus:ring-2 focus:ring-foreground data-[current=true]:ring-2 data-[current=true]:ring-primary"
      data-color={value}
      data-current={value === color}
      key={value}
      onClick={pickColor}
      style={{ backgroundColor: value }}
    />
  );

  const fontItem = (item: Font) =>
    item.weights ? (
      <DropdownMenuSub key={item.name}>
        <DropdownMenuSubTrigger
          className={plainItemClass}
          data-family={item.family}
          onClick={pickFont}
          style={{ fontFamily: item.family }}
        >
          <span className="flex-1">{item.name}</span>
          {item.name === font ? <CheckIcon /> : null}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {item.weights.map((value) => (
            <DropdownMenuItem
              className={plainItemClass}
              data-family={item.family}
              data-weight={value}
              key={value}
              onClick={pickFont}
              style={{ fontFamily: item.family, fontWeight: value }}
            >
              {weightNames[value]}
              {item.name === font && value === weight ? (
                <CheckIcon className="ml-auto" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    ) : (
      <DropdownMenuItem
        className={plainItemClass}
        data-family={item.family}
        key={item.name}
        onClick={pickFont}
        style={{ fontFamily: item.family }}
      >
        {item.name}
        {item.name === font ? <CheckIcon className="ml-auto" /> : null}
      </DropdownMenuItem>
    );

  return (
    <div className="flex shrink-0 items-center gap-1 border bg-card p-1">
      <Button aria-label="Undo" onClick={undo} size="icon-sm" variant="ghost">
        <ArrowCounterClockwiseIcon />
      </Button>
      <Button aria-label="Redo" onClick={redo} size="icon-sm" variant="ghost">
        <ArrowClockwiseIcon />
      </Button>
      <Separator
        className="mx-1 h-5 data-vertical:self-auto"
        orientation="vertical"
      />
      <DropdownMenu onOpenChange={setStyleMenuOpen} open={styleMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Text style"
              className={`w-32 ${menuButtonClass}`}
              size="sm"
              variant="ghost"
            />
          }
        >
          <span className="truncate">
            {otherBlocks[textStyle] ?? styleFor(textStyle).name}
          </span>
          <CaretDownIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-64" finalFocus={focusEditor}>
          {textStyles.map((item) => {
            const format = { ...item.format, ...custom[item.tag] };

            return (
              <DropdownMenuSub key={item.tag}>
                <DropdownMenuSubTrigger
                  className="normal-case leading-tight tracking-normal"
                  data-tag={item.tag}
                  onClick={pickStyle}
                  style={{
                    fontFamily: format["font-family"],
                    fontSize: `min(${format["font-size"]}, ${PREVIEW_SIZE_MAX})`,
                    fontWeight: format["font-weight"],
                  }}
                >
                  <span className="flex-1">{item.name}</span>
                  {item.tag === textStyle ? <CheckIcon /> : null}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    className={plainItemClass}
                    data-tag={item.tag}
                    onClick={pickStyle}
                  >
                    Apply '{item.name}'
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={plainItemClass}
                    data-tag={item.tag}
                    data-update
                    onClick={pickStyle}
                  >
                    Update '{item.name}' to match
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={plainItemClass}
            disabled={Object.keys(custom).length === 0}
            onClick={resetStyles}
          >
            Reset styles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator
        className="mx-1 h-5 data-vertical:self-auto"
        orientation="vertical"
      />
      <DropdownMenu onOpenChange={setFontMenuOpen} open={fontMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Font"
              className={`w-44 ${menuButtonClass}`}
              size="sm"
              variant="ghost"
            />
          }
        >
          <span className="truncate">{font}</span>
          <CaretDownIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56" finalFocus={focusEditor}>
          {brandFonts.map(fontItem)}
          <DropdownMenuSeparator />
          {systemFonts.map(fontItem)}
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator
        className="mx-1 h-5 data-vertical:self-auto"
        orientation="vertical"
      />
      <Button
        aria-label="Decrease font size"
        onClick={shrinkFont}
        size="icon-sm"
        variant="ghost"
      >
        <MinusIcon />
      </Button>
      <Input
        aria-label="Font size"
        className="h-7 w-12 border-input px-1 text-center"
        inputMode="decimal"
        onBlur={discardSize}
        onChange={handleSizeChange}
        onFocus={selectSize}
        onKeyDown={handleSizeKey}
        value={sizeDraft ?? fontSize ?? ""}
      />
      <Button
        aria-label="Increase font size"
        onClick={growFont}
        size="icon-sm"
        variant="ghost"
      >
        <PlusIcon />
      </Button>
      <Separator
        className="mx-1 h-5 data-vertical:self-auto"
        orientation="vertical"
      />
      <Button aria-label="Bold" onClick={bold} size="icon-sm" variant="ghost">
        <TextBIcon />
      </Button>
      <Button
        aria-label="Italic"
        onClick={italic}
        size="icon-sm"
        variant="ghost"
      >
        <TextItalicIcon />
      </Button>
      <DropdownMenu onOpenChange={toggleColorMenu} open={colorMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Text color"
              className="flex-col gap-0.5"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          A
          <span
            className="h-1 w-4 ring-1 ring-foreground/20"
            style={{ backgroundColor: color ?? undefined }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-0" finalFocus={focusEditor}>
          <div className="grid grid-cols-10 gap-1">
            {textColors.map(swatch)}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-0">Custom</DropdownMenuLabel>
            <div className="grid grid-cols-10 gap-1">
              {customColors.map(swatch)}
              {/* The picker itself is invisible and covers the plus, so a click lands on it directly. */}
              <span className="relative flex size-5 items-center justify-center ring-1 ring-foreground/20 hover:ring-2 hover:ring-foreground">
                <PlusIcon className="size-3" />
                <input
                  aria-label="Custom text color"
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  defaultValue="#000000"
                  ref={customColor}
                  type="color"
                />
              </span>
            </div>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator
        className="mx-1 h-5 data-vertical:self-auto"
        orientation="vertical"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Alignment"
              className="gap-0.5 px-2"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <AlignIcon />
          <CaretDownIcon className="size-2.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-0" finalFocus={focusEditor}>
          <div className="flex gap-1">
            {alignments.map(({ label, value }) => {
              const ItemIcon = alignmentIcons[value];

              return (
              <DropdownMenuItem
                aria-label={label}
                className="size-8 justify-center p-0 data-[current=true]:bg-primary/15 data-[current=true]:text-primary"
                data-align={value}
                data-current={value === align}
                key={value}
                onClick={pickAlign}
              >
                <ItemIcon />
              </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <Toggle
        aria-label="Bulleted list"
        className={toggleClass}
        onPressedChange={toggleList}
        pressed={bulleted}
        size="sm"
      >
        <ListBulletsIcon />
      </Toggle>
      <Toggle
        aria-label="Quote"
        className={toggleClass}
        onPressedChange={toggleQuote}
        pressed={quoted}
        size="sm"
      >
        <QuotesIcon />
      </Toggle>
    </div>
  );
}

function DocumentSurface({
  content,
  id,
  title: initialTitle,
  unsynced,
}: {
  content: object;
  id: string;
  title: string;
  unsynced: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [zoom, setZoom] = useState<number | null>(null);
  const [fit, setFit] = useState(1);
  const [showRuler, setShowRuler] = useState(true);
  // Which of the AI's changes the navigator is on: the one with the buttons.
  const [change, setChange] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scale = zoom === null ? fit : zoom / 100;
  const pending = useRef<Record<string, unknown>>({});
  const latest = useRef({ content, title: initialTitle });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useCallback(
    (patch: { content?: object; title?: string }) => {
      latest.current = { ...latest.current, ...patch };
      localDb.documents.put({
        content: latest.current.content,
        id,
        title: latest.current.title,
        updatedAt: Date.now(),
      });
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

          if (response.ok && Object.keys(pending.current).length === 0) {
            const saved: { updatedAt: string } = await response.json();

            localDb.documents.update(id, {
              updatedAt: new Date(saved.updatedAt).getTime(),
            });
          }
        } catch {
          setStatus("error");
        }
      }, 500);
    },
    [id]
  );

  const handleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setTitle(value);

      if (value.trim()) {
        schedule({ title: value });
      }
    },
    [schedule]
  );

  const handleChange = useCallback(
    (state: EditorState) => schedule({ content: state.toJSON() }),
    [schedule]
  );

  useEffect(() => {
    if (unsynced) {
      schedule({
        content: latest.current.content,
        title: latest.current.title,
      });
    }
  }, [schedule, unsynced]);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLDivElement | null;

    if (!canvas) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? PAGE_WIDTH;

      setFit(Math.min(width / PAGE_WIDTH, 2));
    });

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  const hideRuler = useCallback(() => setShowRuler(false), []);

  const pickZoom = useCallback(
    (value: number | "fit") => setZoom(value === "fit" ? null : value),
    []
  );

  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("header-slot"));
  }, []);

  const initialConfig = {
    editorState: serializeContent(content),
    namespace: "Document",
    nodes,
    onError: (error: Error) => console.error(error),
    theme,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {slot
          ? createPortal(
              <>
                <Input
                  aria-label="Document title"
                  className="h-9 w-44 shrink-0 border-none bg-transparent px-0 font-semibold text-sm shadow-none focus-visible:ring-0"
                  onChange={handleTitleChange}
                  placeholder="Untitled"
                  value={title}
                />
                <Toolbar />
                <div className="flex shrink-0 items-center border bg-card p-1">
                  <Toggle
                    aria-label="Ruler"
                    className={toggleClass}
                    onPressedChange={setShowRuler}
                    pressed={showRuler}
                    size="sm"
                  >
                    <RulerIcon />
                  </Toggle>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          aria-label="Zoom"
                          className={`w-20 tabular-nums ${menuButtonClass}`}
                          size="sm"
                          variant="ghost"
                        />
                      }
                    >
                      {zoom === null ? "Fit" : `${zoom}%`}
                      <CaretDownIcon className="text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-28">
                      <DropdownMenuRadioGroup
                        onValueChange={pickZoom}
                        value={zoom ?? "fit"}
                      >
                        <DropdownMenuRadioItem
                          className={plainItemClass}
                          closeOnClick
                          value="fit"
                        >
                          Fit
                        </DropdownMenuRadioItem>
                        <DropdownMenuSeparator />
                        {zoomLevels.map((level) => (
                          <DropdownMenuRadioItem
                            className={plainItemClass}
                            closeOnClick
                            key={level}
                            value={level}
                          >
                            {level}%
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                  {statusLabel[status]}
                </span>
              </>,
              slot
            )
          : null}
        <div className="overflow-auto" ref={canvasRef}>
          {showRuler ? <Ruler onHide={hideRuler} scale={scale} /> : null}
          <RichTextPlugin
            contentEditable={<DocumentPages change={change} scale={scale} />}
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={null}
          />
        </div>
        <div className="sticky bottom-4 z-10 mx-auto w-full max-w-2xl">
          <DraftBar change={change} documentId={id} onChange={setChange} />
        </div>
        <HistoryPlugin />
        <AutocompletePlugin />
        <TabIndentationPlugin />
        <ListPlugin />
        <TablePlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={DOCUMENT_TRANSFORMERS} />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
}

export function DocumentEditor({
  content,
  id,
  title,
  updatedAt,
}: {
  content: object;
  id: string;
  title: string;
  updatedAt: number;
}) {
  const [initial, setInitial] = useState<{
    content: object;
    title: string;
    unsynced: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fromServer = { content, title, unsynced: false };

    localDb.documents
      .get(id)
      .then((local) => {
        if (cancelled) {
          return;
        }

        setInitial(
          local && local.updatedAt > updatedAt
            ? { content: local.content, title: local.title, unsynced: true }
            : fromServer
        );
      })
      .catch(() => {
        if (!cancelled) {
          setInitial(fromServer);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, id, title, updatedAt]);

  if (!initial) {
    return null;
  }

  return (
    <DocumentSurface
      content={initial.content}
      id={id}
      title={initial.title}
      unsynced={initial.unsynced}
    />
  );
}

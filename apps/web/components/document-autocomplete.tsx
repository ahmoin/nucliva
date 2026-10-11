"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelectionStyleValueForProperty,
  $isAtNodeEnd,
} from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  type EditorConfig,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { JSX } from "react";
import { useEffect } from "react";

const SUGGEST_DELAY = 350;
const CONTEXT_LENGTH = 500;
const EARLIER_LENGTH = 1500;

// Updates the plugin makes are not worth an undo step of their own.
const QUIET = { tag: "history-merge" };

type SerializedAutocompleteNode = Spread<
  { style: Record<string, string>; text: string },
  SerializedLexicalNode
>;

// The suggestion, shown inline in grey after the caret. It is only there
// while it is offered, and is dropped from any document that loads with one.
export class AutocompleteNode extends DecoratorNode<JSX.Element> {
  __style: Record<string, string>;
  __text: string;

  static getType() {
    return "autocomplete";
  }

  static clone(node: AutocompleteNode) {
    return new AutocompleteNode(node.__text, node.__style, node.__key);
  }

  static importJSON({ style, text }: SerializedAutocompleteNode) {
    return new AutocompleteNode(text, style);
  }

  constructor(text: string, style: Record<string, string>, key?: NodeKey) {
    super(key);
    this.__text = text;
    this.__style = style;
  }

  exportJSON(): SerializedAutocompleteNode {
    return {
      ...super.exportJSON(),
      style: this.__style,
      text: this.__text,
    };
  }

  createDOM(_config: EditorConfig) {
    return document.createElement("span");
  }

  updateDOM() {
    return false;
  }

  isInline() {
    return true;
  }

  getTextContent() {
    return "";
  }

  decorate() {
    return (
      <span className="opacity-50" spellCheck={false} style={this.__style}>
        {this.__text}
        <span className="ml-1 border px-1 align-middle font-sans text-[10px] uppercase tracking-widest">
          Tab
        </span>
      </span>
    );
  }
}

const $isAutocompleteNode = (
  node: LexicalNode | null | undefined
): node is AutocompleteNode => node instanceof AutocompleteNode;

// The text of the line up to the caret, when the caret is at the end of some
// plain text. A space at the end counts: the next word is offered then too.
function $contextAtCaret() {
  const selection = $getSelection();

  if (!($isRangeSelection(selection) && selection.isCollapsed())) {
    return null;
  }

  const node = selection.anchor.getNode();

  if (
    !(
      $isTextNode(node) &&
      node.isSimpleText() &&
      $isAtNodeEnd(selection.anchor)
    )
  ) {
    return null;
  }

  const text = node.getTextContent();

  if (!text.trim()) {
    return null;
  }

  let line = "";

  for (const child of node.getParentOrThrow().getChildren()) {
    line += child.getTextContent();

    if (child.is(node)) {
      break;
    }
  }

  return line.slice(-CONTEXT_LENGTH);
}

// What the document says before the paragraph being written, so the model
// knows the topic and the voice and not only the last line.
function $earlierText() {
  const block = $getSelection()?.getNodes()[0]?.getTopLevelElement();
  const parts: string[] = [];

  for (
    let previous = block?.getPreviousSibling();
    previous;
    previous = previous.getPreviousSibling()
  ) {
    parts.unshift(previous.getTextContent());

    if (parts.join("\n").length > EARLIER_LENGTH) {
      break;
    }
  }

  return parts.join("\n").slice(-EARLIER_LENGTH);
}

// The model answers with the exact characters to type next, so they are used as
// they are. It may still repeat what was written, which is cut off, and a
// space that is already typed is not typed twice.
function continuation(context: string, completion: string) {
  const written = context.trimEnd();
  const rest = completion.toLowerCase().startsWith(written.toLowerCase())
    ? completion.slice(written.length)
    : completion;
  const next = /\s$/.test(context) ? rest.trimStart() : rest;

  // After the end of a sentence the next word starts with a capital.
  return /[.!?]["')\]]*\s*$/.test(context)
    ? next.replace(/^(\s*)([a-z])/, (_, space, letter) => space + letter.toUpperCase())
    : next;
}

// Offers a few words to continue what is being written. Tab or the right arrow
// takes them, and typing anything else drops them.
export function AutocompletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let ghost: NodeKey | null = null;
    let offered: string | null = null;
    let asked: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // A request already on its way is not cut short: aborting a fetch makes
    // the dev overlay report an error. An answer for words that are no longer
    // before the caret is simply dropped by `show`.
    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = null;
    };

    const $clear = () => {
      const node = ghost ? $getNodeByKey(ghost) : null;

      if ($isAutocompleteNode(node) && node.isAttached()) {
        node.remove();
      }

      ghost = null;
      offered = null;
    };

    const show = (context: string, completion: string) =>
      editor.update(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || $contextAtCaret() !== context) {
          return;
        }

        const text = continuation(context, completion);

        if (!text) {
          return;
        }

        // The suggestion is written like the text it follows, only fainter.
        const style: Record<string, string> = {};

        for (const property of [
          "color",
          "font-family",
          "font-size",
          "font-weight",
        ]) {
          const value = $getSelectionStyleValueForProperty(selection, property);

          if (value) {
            style[property] = value;
          }
        }

        const node = new AutocompleteNode(text, style);
        const kept = selection.clone();

        ghost = node.getKey();
        offered = text;
        selection.insertNodes([node]);
        $setSelection(kept);
      }, QUIET);

    const ask = (context: string, before: string) => {
      const sent = performance.now();

      fetch("/api/autocomplete", {
        body: JSON.stringify({ before, context: context.trimEnd() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
        .then((response) => response.json())
        .then((data: { completion?: string | null }) => {
          console.debug(
            `autocomplete: answer after ${Math.round(performance.now() - sent)}ms`,
            data.completion
          );

          if (data.completion) {
            show(context, data.completion);
          }
        })
        .catch((error) => console.debug("autocomplete: request failed", error));
    };

    // Runs after every edit and move of the caret. Nothing changes while the
    // caret is still after the same words.
    const handleUpdate = () =>
      editor.update(() => {
        const context = $contextAtCaret();

        if (context === asked) {
          return;
        }

        cancel();
        $clear();
        asked = context;

        if (context) {
          const earlier = $earlierText();

          timer = setTimeout(() => ask(context, earlier), SUGGEST_DELAY);
        }
      }, QUIET);

    const $accept = () => {
      const node = ghost ? $getNodeByKey(ghost) : null;

      if (!($isAutocompleteNode(node) && offered)) {
        return false;
      }

      const text = $createTextNode(offered);
      const before = node.getPreviousSibling();

      if ($isTextNode(before)) {
        text.setFormat(before.getFormat());
        text.setStyle(before.getStyle());
      }

      node.replace(text);
      text.selectNext();
      ghost = null;
      offered = null;
      asked = null;

      return true;
    };

    const accept = (event: Event) => {
      if (!$accept()) {
        return false;
      }

      event.preventDefault();

      return true;
    };

    return mergeRegister(
      // A suggestion that came with a saved document, or that undo brought
      // back, is not one being offered now.
      editor.registerNodeTransform(AutocompleteNode, (node) => {
        if (node.getKey() !== ghost) {
          node.remove();
        }
      }),
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(KEY_TAB_COMMAND, accept, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        accept,
        COMMAND_PRIORITY_LOW
      ),
      cancel
    );
  }, [editor]);

  return null;
}

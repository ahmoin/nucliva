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
  COMMAND_PRIORITY_NORMAL,
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

const QUIET = { tag: "history-merge" };

type SerializedAutocompleteNode = Spread<
  { style: Record<string, string>; text: string },
  SerializedLexicalNode
>;

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

function continuation(context: string, completion: string) {
  const written = context.trimEnd();
  const rest = completion.toLowerCase().startsWith(written.toLowerCase())
    ? completion.slice(written.length)
    : completion;
  const next = /\s$/.test(context) ? rest.trimStart() : rest;

  return /[.!?]["')\]]*\s*$/.test(context)
    ? next.replace(/^(\s*)([a-z])/, (_, space, letter) => space + letter.toUpperCase())
    : next;
}

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
      editor.registerNodeTransform(AutocompleteNode, (node) => {
        if (node.getKey() !== ghost) {
          node.remove();
        }
      }),
      editor.registerUpdateListener(handleUpdate),
      // Above the other handlers of Tab, so a suggestion is taken first.
      editor.registerCommand(KEY_TAB_COMMAND, accept, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        accept,
        COMMAND_PRIORITY_NORMAL
      ),
      cancel
    );
  }, [editor]);

  return null;
}

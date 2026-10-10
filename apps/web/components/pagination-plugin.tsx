"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { useEffect } from "react";
import {
  $createPageNode,
  $isPageNode as isPage,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  type PageNode,
} from "@/components/page-node";

const LIMIT = PAGE_HEIGHT - PAGE_MARGIN;
const PULL_BUFFER = 24;

const marginBottom = (el: HTMLElement) =>
  Number.parseFloat(getComputedStyle(el).marginBottom) || 0;

const bottomOf = (el: HTMLElement) => el.offsetTop + el.offsetHeight;

function $ensurePages() {
  const root = $getRoot();

  if (root.getChildrenSize() === 0) {
    root.append($createPageNode().append($createParagraphNode()));
    return;
  }

  const loose = root.getChildren().filter((child) => !isPage(child));

  if (loose.length === 0) {
    return;
  }

  const page = $createPageNode();

  root.getFirstChild()?.insertBefore(page);
  page.append(...loose);
}

function $movePastLimit(
  editor: LexicalEditor,
  page: PageNode,
  next: PageNode | undefined
) {
  const children = page.getChildren();
  let overflowAt = -1;

  for (let index = 1; index < children.length; index += 1) {
    const el = editor.getElementByKey(children[index]?.getKey() ?? "");

    if (el && bottomOf(el) > LIMIT) {
      overflowAt = index;
      break;
    }
  }

  if (overflowAt === -1) {
    return false;
  }

  const target = next ?? page.insertAfter($createPageNode());
  const moving = children.slice(overflowAt);
  const first = target.getFirstChild();

  if (first) {
    for (const node of moving) {
      first.insertBefore(node);
    }
  } else {
    target.append(...moving);
  }

  return true;
}

function $pullUp(editor: LexicalEditor, page: PageNode, next: PageNode) {
  const last = page.getLastChild();
  const lastEl = last ? editor.getElementByKey(last.getKey()) : null;
  let bottom = lastEl ? bottomOf(lastEl) : PAGE_MARGIN;
  let gap = lastEl ? marginBottom(lastEl) : 0;
  const pulled: LexicalNode[] = [];

  for (const child of next.getChildren()) {
    const el = editor.getElementByKey(child.getKey());

    if (!el) {
      break;
    }

    const nextBottom = bottom + gap + el.offsetHeight;

    if (nextBottom + PULL_BUFFER > LIMIT) {
      break;
    }

    bottom = nextBottom;
    gap = marginBottom(el);
    pulled.push(child);
  }

  if (pulled.length > 0) {
    page.append(...pulled);
  }
}

function $paginate(editor: LexicalEditor) {
  $ensurePages();

  const pages = $getRoot().getChildren().filter(isPage);

  for (const page of pages) {
    if (page.getChildrenSize() === 0 && pages.length > 1) {
      page.remove();
    }
  }

  const live = $getRoot().getChildren().filter(isPage);

  for (const [index, page] of live.entries()) {
    const next = live[index + 1];

    if ($movePastLimit(editor, page, next)) {
      continue;
    }

    if (next) {
      $pullUp(editor, page, next);
    }
  }
}

export function PaginationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        editor.update(() => $paginate(editor), { tag: "history-merge" })
      );
    };

    const unregisterListener = editor.registerUpdateListener(schedule);

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();

        if (
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          selection.anchor.offset !== 0
        ) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const block = anchorNode.getTopLevelElement();
        const page = block?.getParent();

        if (
          !(block && isPage(page)) ||
          block.getPreviousSibling() !== null ||
          !(block.is(anchorNode) || block.getFirstDescendant()?.is(anchorNode))
        ) {
          return false;
        }

        const previous = page.getPreviousSibling();

        if (!isPage(previous)) {
          return false;
        }

        event.preventDefault();

        if ($isParagraphNode(block) && block.getTextContent() === "") {
          const target = previous.getLastChild();

          block.remove();

          if (page.getChildrenSize() === 0) {
            page.remove();
          }

          if ($isElementNode(target)) {
            target.selectEnd();
          }

          return true;
        }

        previous.append(block);

        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    schedule();

    return () => {
      cancelAnimationFrame(frame);
      unregisterListener();
      unregisterBackspace();
    };
  }, [editor]);

  return null;
}

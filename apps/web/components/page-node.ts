import { addClassNamesToElement } from "@lexical/utils";
import {
  $applyNodeReplacement,
  ElementNode,
  type LexicalNode,
  type SerializedElementNode,
} from "lexical";

export const PAGE_WIDTH = 816;
export const PAGE_HEIGHT = 1056;
export const PAGE_MARGIN = 96;

export class PageNode extends ElementNode {
  static getType() {
    return "page";
  }

  static clone(node: PageNode) {
    return new PageNode(node.__key);
  }

  static importJSON() {
    return $createPageNode();
  }

  createDOM() {
    const dom = document.createElement("div");

    addClassNamesToElement(
      dom,
      "relative bg-card text-[16px] shadow-lg ring-1 ring-foreground/10"
    );
    dom.style.boxSizing = "border-box";
    dom.style.minHeight = `${PAGE_HEIGHT}px`;
    dom.style.padding = `${PAGE_MARGIN}px`;
    dom.style.width = `${PAGE_WIDTH}px`;

    return dom;
  }

  updateDOM() {
    return false;
  }

  exportJSON(): SerializedElementNode {
    return { ...super.exportJSON(), type: "page", version: 1 };
  }

  isShadowRoot() {
    return true;
  }

  canBeEmpty() {
    return false;
  }
}

export function $createPageNode() {
  return $applyNodeReplacement(new PageNode());
}

export function $isPageNode(
  node: LexicalNode | null | undefined
): node is PageNode {
  return node instanceof PageNode;
}

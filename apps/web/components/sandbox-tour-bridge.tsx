"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type NodeKey,
} from "lexical";
import { useEffect } from "react";
import { RIPPLE_PREFIX } from "@/components/document-ripple";
import { $changes } from "@/components/document-suggestions";
import { tour } from "@/components/sandbox-tour-store";

// Three places that state one fact, written three ways, to try the ripple on.
const EXAMPLE = [
  "Q3 revenue was $4,200,000.",
  "We expect Q3 revenue of $4.2M to hold through the year.",
  "That is 4.2 million dollars for the quarter, our best yet.",
];

// Sits in the editor, and tells the tour what is going on in the document, and
// lets it put the example in.
export function TourBridge() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let keys: NodeKey[] = [];

    // Counting the changes reads the whole document, so it is only done while
    // a tour is open to use the count.
    const publish = () =>
      tour.watched() &&
      editor.getEditorState().read(() => {
        const changes = $changes();

        tour.set({
          changes: changes.length,
          ripple: changes.filter((change) =>
            change.id.startsWith(RIPPLE_PREFIX)
          ).length,
        });
      });

    tour.addExample = () => {
      // The chat from the first request would sit over the example.
      document
        .querySelector<HTMLButtonElement>('[aria-label="Hide chat"]')
        ?.click();

      editor.update(
        () => {
          const root = $getRoot();

          keys = EXAMPLE.map((line) => {
            const paragraph = $createParagraphNode();

            paragraph.append($createTextNode(line));
            root.append(paragraph);

            return paragraph.getKey();
          });
        },
        {
          onUpdate: () => {
            tour.set({ example: true });
            editor
              .getElementByKey(keys[0] ?? "")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          },
        }
      );
    };

    // The three paragraphs of the example, as one box, as wide as the page so
    // that the Accept and Reject buttons in its margin are inside it.
    tour.exampleBox = () => {
      const boxes = keys.flatMap((key) => {
        const box = editor.getElementByKey(key)?.getBoundingClientRect();

        return box ? [box] : [];
      });

      if (boxes.length === 0) {
        return null;
      }

      const page = editor.getRootElement()?.getBoundingClientRect();
      const left = Math.min(
        page?.left ?? Number.POSITIVE_INFINITY,
        ...boxes.map((box) => box.left)
      );
      const top = Math.min(...boxes.map((box) => box.top));
      const right = Math.max(
        page?.right ?? 0,
        ...boxes.map((box) => box.right)
      );
      const bottom = Math.max(...boxes.map((box) => box.bottom));

      return new DOMRect(left, top, right - left, bottom - top);
    };

    tour.refresh = publish;
    publish();

    const stop = editor.registerUpdateListener(publish);

    return () => {
      stop();
      tour.addExample = null;
      tour.exampleBox = null;
      tour.refresh = null;
      tour.set({ changes: 0, ripple: 0 });
    };
  }, [editor]);

  return null;
}

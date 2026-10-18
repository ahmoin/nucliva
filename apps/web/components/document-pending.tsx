"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $applyEdits } from "@/components/document-suggestions";
import type { PendingDoc } from "@/lib/agents/suite";

// Documents whose waiting draft has been put in, so it never goes in twice,
// even when the editor mounts twice.
const applied = new Set<string>();

// A doc an agent made opens with its draft as suggestions, the same ones the
// chat makes, to accept or reject one by one. They are saved with the text, in
// the same request that says the draft has been put in.
export function PendingDocPlugin({
  id,
  pending,
}: {
  id: string;
  pending: PendingDoc | null;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!pending || applied.has(id)) {
      return;
    }

    applied.add(id);
    editor.update(() => $applyEdits(pending.edits, pending.sources, true), {
      discrete: true,
    });
    fetch(`/api/documents/${id}`, {
      body: JSON.stringify({
        content: editor.getEditorState().toJSON(),
        pending: null,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }).catch(() => applied.delete(id));
  }, [editor, id, pending]);

  return null;
}

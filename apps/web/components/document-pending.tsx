"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $applyEdits } from "@/components/document-suggestions";
import type { PendingDoc } from "@/lib/agents/suite";

// Module-level so the draft is not applied twice when the editor mounts twice.
const applied = new Set<string>();

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

"use client";

import { SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Adds a writing sample, then shows the list again with it in.
export function StyleSampleForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const text = content.trim();

    if (!text || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/style-samples", {
        body: JSON.stringify({ content: text }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(data?.error ?? "Could not add the sample.");
      }

      setContent("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not add the sample."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Textarea
        aria-label="Writing sample"
        onChange={(event) => setContent(event.target.value)}
        placeholder="Paste something you wrote..."
        rows={6}
        value={content}
      />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div>
        <Button disabled={!content.trim() || saving} type="submit">
          <SparkleIcon />
          {saving ? "Learning your style..." : "Analyze style"}
        </Button>
      </div>
    </form>
  );
}

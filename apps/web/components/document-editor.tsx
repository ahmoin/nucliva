"use client";

import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowsOutIcon,
  ArrowUpIcon,
  ListBulletsIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  QuotesIcon,
  SparkleIcon,
  TextBIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type EditorState,
  type ElementNode,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  $isPageNode,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PageNode,
} from "@/components/page-node";
import { PaginationPlugin } from "@/components/pagination-plugin";
import { localDb } from "@/lib/local-db";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

const theme = {
  code: "my-3 block bg-muted p-3 font-mono text-[15px]",
  heading: {
    h1: "mt-5 mb-3 font-bold text-[32px] leading-tight tracking-tight",
    h2: "mt-4 mb-3 font-bold text-[24px] leading-tight tracking-tight",
    h3: "mt-4 mb-2 font-semibold text-[19px] leading-tight",
  },
  link: "text-primary underline underline-offset-2",
  list: {
    listitem: "my-1",
    ol: "my-3 list-decimal pl-7",
    ul: "my-3 list-disc pl-7",
  },
  paragraph: "mb-3 leading-[1.5]",
  quote: "my-3 border-primary border-l-2 pl-4 text-muted-foreground italic",
  text: {
    bold: "font-bold",
    code: "bg-muted px-1 font-mono text-[15px]",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
  },
};

const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  CodeNode,
  PageNode,
];

const draftStarters = [
  { label: "Email draft", prompt: "Write an email about " },
  { label: "Blog post", prompt: "Write a blog post about " },
  { label: "Meeting notes", prompt: "Turn these notes into meeting notes: " },
  { label: "Summary", prompt: "Summarize this: " },
];

type SaveStatus = "error" | "saved" | "saving";

const statusLabel: Record<SaveStatus, string> = {
  error: "Could not save",
  saved: "Saved",
  saving: "Saving...",
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();

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
  const list = useCallback(
    () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    [editor]
  );

  const setBlock = useCallback(
    (create: () => ElementNode) => {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, create);
        }
      });
    },
    [editor]
  );

  const h1 = useCallback(
    () => setBlock(() => $createHeadingNode("h1")),
    [setBlock]
  );
  const h2 = useCallback(
    () => setBlock(() => $createHeadingNode("h2")),
    [setBlock]
  );
  const quote = useCallback(() => setBlock($createQuoteNode), [setBlock]);

  return (
    <div className="flex shrink-0 items-center gap-1 border bg-card p-1">
      <Button aria-label="Undo" onClick={undo} size="icon-sm" variant="ghost">
        <ArrowCounterClockwiseIcon />
      </Button>
      <Button aria-label="Redo" onClick={redo} size="icon-sm" variant="ghost">
        <ArrowClockwiseIcon />
      </Button>
      <Separator className="mx-1 h-5" orientation="vertical" />
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
      <Separator className="mx-1 h-5" orientation="vertical" />
      <Button aria-label="Heading 1" onClick={h1} size="icon-sm" variant="ghost">
        <TextHOneIcon />
      </Button>
      <Button aria-label="Heading 2" onClick={h2} size="icon-sm" variant="ghost">
        <TextHTwoIcon />
      </Button>
      <Button
        aria-label="Bulleted list"
        onClick={list}
        size="icon-sm"
        variant="ghost"
      >
        <ListBulletsIcon />
      </Button>
      <Button aria-label="Quote" onClick={quote} size="icon-sm" variant="ghost">
        <QuotesIcon />
      </Button>
    </div>
  );
}

function DraftBar() {
  const [editor] = useLexicalComposerContext();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setPrompt(event.target.value),
    []
  );

  const handleChip = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setPrompt(event.currentTarget.dataset.prompt ?? "");
      inputRef.current?.focus();
    },
    []
  );

  const generate = useCallback(async () => {
    if (!prompt.trim()) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/draft", {
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Draft request failed");
      }

      const data: { draft: string } = await response.json();

      setDraft(data.draft);
    } catch {
      setError("Could not generate a draft. Try again.");
    } finally {
      setGenerating(false);
    }
  }, [prompt]);

  const insert = useCallback(() => {
    if (!draft) {
      return;
    }

    editor.update(() => {
      const current = $getRoot()
        .getChildren()
        .map((child) =>
          $isPageNode(child)
            ? $convertToMarkdownString(TRANSFORMERS, child)
            : ""
        )
        .filter(Boolean)
        .join("\n\n");

      $convertFromMarkdownString(
        current ? `${current}\n\n${draft}` : draft,
        TRANSFORMERS
      );
    });
    setDraft(null);
    setPrompt("");
  }, [draft, editor]);

  const discard = useCallback(() => setDraft(null), []);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      generate();
    },
    [generate]
  );

  return (
    <div className="relative flex flex-col gap-2 font-sans text-sm">
      {draft ? (
        <div className="absolute right-0 bottom-full left-0 mb-2 flex max-h-72 flex-col gap-3 overflow-y-auto border border-primary/40 bg-card p-4 shadow-lg">
          <p className="whitespace-pre-wrap leading-6">{draft}</p>
          <div className="flex gap-2">
            <Button onClick={insert} size="sm">
              Insert
            </Button>
            <Button onClick={discard} size="sm" variant="outline">
              Discard
            </Button>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        {draftStarters.map((starter) => (
          <button
            className="border bg-muted/60 px-3 py-1 text-[12px] transition-colors hover:bg-muted"
            data-prompt={starter.prompt}
            key={starter.label}
            onClick={handleChip}
            type="button"
          >
            {starter.label}
          </button>
        ))}
        {error ? (
          <span className="text-destructive text-xs">{error}</span>
        ) : null}
      </div>
      <form
        autoComplete="off"
        className="flex items-center gap-2 border bg-card p-2 shadow-lg"
        onSubmit={submit}
      >
        <SparkleIcon className="ml-1 size-5 shrink-0 text-primary" />
        <Input
          aria-label="What should we write?"
          autoComplete="off"
          className="h-8 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
          data-1p-ignore
          data-lpignore="true"
          name="draft-prompt"
          disabled={generating}
          onChange={handlePromptChange}
          placeholder="Write with Nucliva in your voice..."
          ref={inputRef}
          value={prompt}
        />
        <Button
          aria-label="Generate draft"
          disabled={generating || !prompt.trim()}
          size="icon-sm"
          type="submit"
        >
          {generating ? <SparkleIcon className="animate-pulse" /> : <ArrowUpIcon />}
        </Button>
      </form>
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const scale = zoom ?? fit;
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

  const zoomIn = useCallback(
    () => setZoom(Math.min(ZOOM_MAX, scale + ZOOM_STEP)),
    [scale]
  );
  const zoomOut = useCallback(
    () => setZoom(Math.max(ZOOM_MIN, scale - ZOOM_STEP)),
    [scale]
  );
  const zoomFit = useCallback(() => setZoom(null), []);

  const [pageHeight, setPageHeight] = useState(PAGE_HEIGHT);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current as HTMLDivElement | null;

    if (!page) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setPageHeight(entry?.target.scrollHeight ?? PAGE_HEIGHT);
    });

    observer.observe(page);

    return () => observer.disconnect();
  }, []);

  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("header-slot"));
  }, []);

  const initialConfig = {
    editorState: "root" in content ? JSON.stringify(content) : undefined,
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
                <div className="flex shrink-0 items-center gap-1 border bg-card p-1">
                  <Button
                    aria-label="Zoom out"
                    onClick={zoomOut}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <MagnifyingGlassMinusIcon />
                  </Button>
                  <span className="w-12 text-center text-muted-foreground text-xs tabular-nums">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    aria-label="Zoom in"
                    onClick={zoomIn}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <MagnifyingGlassPlusIcon />
                  </Button>
                  <Button
                    aria-label="Fit page to width"
                    onClick={zoomFit}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ArrowsOutIcon />
                  </Button>
                </div>
                <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                  {statusLabel[status]}
                </span>
              </>,
              slot
            )
          : null}
        <div className="overflow-auto" ref={canvasRef}>
          <div
            className="mx-auto"
            style={{
              height: pageHeight * scale,
              width: PAGE_WIDTH * scale,
            }}
          >
            <div
              ref={pageRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: PAGE_WIDTH,
              }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    aria-label="Document"
                    className="flex flex-col gap-6 outline-none"
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={null}
              />
            </div>
          </div>
        </div>
        <div className="sticky bottom-4 z-10 mx-auto w-full max-w-2xl">
          <DraftBar />
        </div>
        <PaginationPlugin />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
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

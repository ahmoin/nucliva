"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  GitBranchIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useEffect, useState } from "react";
import {
  Source as SourceLink,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { ChatMarkdown } from "@/components/chat-markdown";
import type { Source } from "@/lib/tavily";

// A conversation is a tree of messages. Every message points at the one it
// answers, so editing an earlier message or branching from it starts another
// line beside the old one, and the old one is still there to go back to. What
// is shown is the line from the first message to the head.
export interface Message {
  // How many changes to the document the answer suggested.
  changes?: number;
  id: string;
  // Something worth saying about how the answer was made.
  notice?: string | null;
  parent: string | null;
  role: "assistant" | "user";
  sources?: Source[];
  text: string;
}

export interface Chat {
  head: string | null;
  messages: Message[];
}

const EMPTY: Chat = { head: null, messages: [] };

// How something that turns up in the conversation arrives: it rises a few
// pixels into place as it fades in. It does not move for a user who has asked
// for less motion.
export const ARRIVE =
  "ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:duration-200";

// The line of messages from the first to the head.
export function lineOf({ head, messages }: Chat) {
  const byId = new Map(messages.map((message) => [message.id, message]));
  const line: Message[] = [];
  let current = head ? byId.get(head) : undefined;

  while (current) {
    line.unshift(current);
    current = current.parent ? byId.get(current.parent) : undefined;
  }

  return line;
}

// The messages that answer, or are the answer to, the same message as this one.
export const alternatives = (chat: Chat, message: Message) =>
  chat.messages.filter(
    (other) => other.parent === message.parent && other.role === message.role
  );

// The end of the newest line that goes on from a message.
export function endOf(chat: Chat, id: string) {
  let current = id;

  for (;;) {
    const next = chat.messages.findLast((message) => message.parent === current);

    if (!next) {
      return current;
    }

    current = next.id;
  }
}

// A message and everything that follows from it.
export function withoutBranch(chat: Chat, id: string): Chat {
  const gone = new Set([id]);

  for (const message of chat.messages) {
    if (message.parent && gone.has(message.parent)) {
      gone.add(message.id);
    }
  }

  const removed = chat.messages.find((message) => message.id === id);

  return {
    head: chat.head && gone.has(chat.head) ? (removed?.parent ?? null) : chat.head,
    messages: chat.messages.filter((message) => !gone.has(message.id)),
  };
}

// The conversation of a document, kept in the browser with it.
export function useChat(documentId: string) {
  const key = `nucliva-chat-${documentId}`;
  const [chat, setChat] = useState<Chat>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);

      if (stored) {
        setChat(JSON.parse(stored));
      }
    } catch {
      // Nothing kept, or nothing that can be read.
    }

    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      if (chat.messages.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(chat));
      }
    } catch {
      // The conversation just is not kept.
    }
  }, [chat, key, loaded]);

  return [chat, setChat] as const;
}

// Markdown as plain words.
const plain = (markdown: string) =>
  markdown
    .replaceAll(/^#{1,6}\s+/gm, "")
    .replaceAll(/\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g, "$1$2$3")
    .replaceAll(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

interface ChatMessageProps {
  // Whether the message has just arrived, and rises into place.
  fresh: boolean;
  message: Message;
  onBranch: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  // Which of the messages that could be here this one is, and how many.
  onSwitch: (id: string, step: number) => void;
  position: { count: number; index: number };
}

// One message, with what can be done with it when the pointer is on it: change
// it and ask again, go on from it, copy it, delete it.
export function ChatMessage({
  fresh,
  message,
  onBranch,
  onDelete,
  onEdit,
  onSwitch,
  position,
}: ChatMessageProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [copied, setCopied] = useState(false);
  const user = message.role === "user";

  const copy = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const text =
        event.currentTarget.dataset.as === "markdown"
          ? message.text
          : plain(message.text);

      navigator.clipboard?.writeText(text);
      setCopied(true);
    },
    [message.text]
  );
  const startEditing = useCallback(() => {
    setDraft(message.text);
    setEditing(true);
  }, [message.text]);
  const stopEditing = useCallback(() => setEditing(false), []);
  const saveEdit = useCallback(() => {
    if (draft.trim()) {
      setEditing(false);
      onEdit(message.id, draft.trim());
    }
  }, [draft, message.id, onEdit]);
  const handleDraft = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    []
  );
  const handleDraftKey = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        saveEdit();
      } else if (event.key === "Escape") {
        setEditing(false);
      }
    },
    [saveEdit]
  );
  const branch = useCallback(() => onBranch(message.id), [message.id, onBranch]);
  const remove = useCallback(() => onDelete(message.id), [message.id, onDelete]);
  const back = useCallback(
    () => onSwitch(message.id, -1),
    [message.id, onSwitch]
  );
  const forward = useCallback(
    () => onSwitch(message.id, 1),
    [message.id, onSwitch]
  );

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 1500);

    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div
      className={cn(
        "group/message relative flex flex-col gap-1",
        user && "items-end",
        fresh && ARRIVE
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span>{user ? "You" : "Nucliva"}</span>
        {position.count > 1 ? (
          <span className="flex items-center tabular-nums">
            <Button
              aria-label="Earlier version"
              disabled={position.index === 0}
              onClick={back}
              size="icon-xs"
              variant="ghost"
            >
              <CaretLeftIcon />
            </Button>
            {position.index + 1}/{position.count}
            <Button
              aria-label="Later version"
              disabled={position.index === position.count - 1}
              onClick={forward}
              size="icon-xs"
              variant="ghost"
            >
              <CaretRightIcon />
            </Button>
          </span>
        ) : null}
      </div>
      {editing ? (
        <div className="flex w-full flex-col gap-2">
          <Textarea
            aria-label="Edit message"
            autoFocus
            className="min-h-16 text-sm"
            onChange={handleDraft}
            onKeyDown={handleDraftKey}
            value={draft}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={stopEditing} size="xs" variant="outline">
              Cancel
            </Button>
            <Button onClick={saveEdit} size="xs">
              Save and ask again
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "max-w-[92%] break-words text-sm",
            user ? "bg-primary/15 px-3 py-2" : "w-full"
          )}
        >
          <ChatMarkdown markdown={message.text} />
        </div>
      )}
      {message.role === "assistant" && !editing ? (
        <div className="flex flex-col gap-2 text-xs">
          {message.changes ? (
            <span className="text-muted-foreground">
              {message.changes}{" "}
              {message.changes === 1 ? "change" : "changes"} suggested in the
              document
            </span>
          ) : null}
          {message.notice ? (
            <span className="text-muted-foreground">{message.notice}</span>
          ) : null}
          {message.sources?.length ? (
            <Sources>
              <SourcesTrigger count={message.sources.length}>
                <span className="flex -space-x-1.5">
                  {message.sources.slice(0, 5).map((source) => (
                    <SiteIcon
                      className="size-5 border"
                      key={source.url}
                      url={source.url}
                    />
                  ))}
                </span>
                <p className="font-medium">
                  {message.sources.length}{" "}
                  {message.sources.length === 1 ? "source" : "sources"}
                </p>
              </SourcesTrigger>
              <SourcesContent>
                {message.sources.map((source) => (
                  <SourceLink href={source.url} key={source.url}>
                    <SiteIcon url={source.url} />
                    <span className="block font-medium">{source.title}</span>
                  </SourceLink>
                ))}
              </SourcesContent>
            </Sources>
          ) : null}
        </div>
      ) : null}
      {editing ? null : (
        <div className="absolute -top-2 right-0 flex bg-card opacity-0 shadow-sm ring-1 ring-foreground/10 transition-opacity focus-within:opacity-100 group-hover/message:opacity-100">
          {user ? (
            <Button
              aria-label="Edit message"
              onClick={startEditing}
              size="icon-xs"
              variant="ghost"
            >
              <PencilSimpleIcon />
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="More"
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              {copied ? <CheckIcon /> : <DotsThreeVerticalIcon />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={remove}>
                <TrashIcon />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={branch}>
                <GitBranchIcon />
                Branch from here
              </DropdownMenuItem>
              <DropdownMenuItem data-as="text" onClick={copy}>
                <CopyIcon />
                Copy as text
              </DropdownMenuItem>
              <DropdownMenuItem data-as="markdown" onClick={copy}>
                <CopyIcon />
                Copy as markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// The icon of a site, from the site itself.
export function SiteIcon({
  className,
  url,
}: {
  className?: string;
  url: string;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: a 16px icon from another site gains nothing from the image optimiser
    <img
      alt=""
      className={cn("size-4 shrink-0 rounded-full bg-card", className)}
      height={16}
      src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`}
      width={16}
    />
  );
}

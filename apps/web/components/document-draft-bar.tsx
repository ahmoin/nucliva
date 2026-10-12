"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ArrowUpIcon,
  CaretDownIcon,
  CaretUpIcon,
  ChatCircleDotsIcon,
  SparkleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import {
  ARRIVE,
  alternatives,
  ChatMessage,
  endOf,
  lineOf,
  type Message,
  SiteIcon,
  useChat,
  withoutBranch,
} from "@/components/document-chat";
import {
  $applyEdits,
  $documentBlocks,
  $resolve,
  useChanges,
} from "@/components/document-suggestions";
import { wantsCitations, wantsResearch } from "@/lib/ai/research-intent";
import type { Edit } from "@/lib/ai/style-engine";
import type { Source } from "@/lib/ai/tavily";

const draftStarters = [
  { label: "Research", prompt: "Research " },
  { label: "Email draft", prompt: "Write an email about " },
  { label: "Blog post", prompt: "Write a blog post about " },
  { label: "Meeting notes", prompt: "Turn these notes into meeting notes: " },
  { label: "Summary", prompt: "Summarize this: " },
];

// How much of the conversation the AI is shown with a new message.
const HISTORY_TURNS = 12;
// The part of a page that is kept with a source, so a saved conversation stays
// small.
const SOURCE_EXCERPT = 240;

// Keeps something on the page for a moment after it should go, so it can leave
// with an animation instead of vanishing.
function usePresence(show: boolean, exit: number) {
  const [mounted, setMounted] = useState(show);

  useEffect(() => {
    if (show) {
      setMounted(true);

      return;
    }

    const timer = setTimeout(() => setMounted(false), exit);

    return () => clearTimeout(timer);
  }, [exit, show]);

  return { mounted: mounted || show, state: show ? "open" : "closed" };
}

// The panel comes up from the prompt and goes back down to it, and moves a
// few pixels, not the whole way, so that it reads as the same panel. Anything
// that arrives in it rises into place. A user who asks for less motion gets
// the fades alone.
const PANEL_MOTION =
  "ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:slide-out-to-bottom-1 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:duration-150 motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-bottom-2 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:duration-200";
// The chat inside the panel, which can come and go while the panel stays for
// the changes.
const CHAT_MOTION =
  "ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:duration-150 motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:duration-200";
// How long a message counts as having just arrived, a little more than the
// time it takes to rise.
const FRESH_FOR = 400;

// The conversation with the AI about the document. What it suggests for the
// document goes into the document, to be accepted or rejected there, and this
// is where it is talked about.
export function DraftBar({
  change: current,
  documentId,
  onChange: setCurrent,
}: {
  // Which of the AI's changes has its buttons showing, counting from 0.
  change: number;
  documentId: string;
  onChange: (change: number) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const changes = useChanges();
  const [chat, setChat] = useChat(documentId);
  const [open, setOpen] = useState(false);
  // A solution page can send someone here with its request already typed in.
  const starter = useSearchParams()?.get("prompt") ?? "";
  const [prompt, setPrompt] = useState(starter);
  const [generating, setGenerating] = useState(false);
  // While the AI works from the web: whether the search is still running, and
  // what it found.
  const [researching, setResearching] = useState(false);
  const [found, setFound] = useState<Source[] | null>(null);
  const [asking, setAsking] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // With a request waiting, the cursor is ready at the end of it.
  useEffect(() => {
    if (starter) {
      inputRef.current?.focus();
    }
  }, [starter]);

  const line = useMemo(() => lineOf(chat), [chat]);
  // The next message goes on from the head. When the head has messages after
  // it, that is a branch from an earlier message.
  const branching = chat.head !== null && endOf(chat, chat.head) !== chat.head;
  const chatShown = open && (line.length > 0 || generating);
  // The chat and the bar of changes under it each leave with a fade, and the
  // box around them leaves when both have.
  const chatPresence = usePresence(chatShown, 160);
  const panel = usePresence(chatPresence.mounted || changes.length > 0, 160);
  const known = useRef(new Set<string>());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  // A message that has just arrived rises into place. Messages that were
  // already kept when the page opened do not, and neither does one that is
  // brought back later by opening the chat: it is only fresh for a moment.
  useLayoutEffect(() => {
    const arrived = chat.messages
      .map(({ id }) => id)
      .filter((id) => !known.current.has(id));

    if (arrived.length === 0) {
      return;
    }

    for (const id of arrived) {
      known.current.add(id);
    }

    setFresh((previous) => new Set([...previous, ...arrived]));
    setTimeout(
      () =>
        setFresh((previous) => {
          const next = new Set(previous);

          for (const id of arrived) {
            next.delete(id);
          }

          return next;
        }),
      FRESH_FOR
    );
  }, [chat.messages]);

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

  // Says something to the AI, as a reply to a message of the conversation.
  const ask = useCallback(
    async (text: string, parent: string | null) => {
      const research = wantsResearch(text);
      const question: Message = {
        id: crypto.randomUUID(),
        parent,
        role: "user",
        text,
      };
      const history = lineOf({ head: parent, messages: chat.messages })
        .slice(-HISTORY_TURNS)
        .map(({ role, text: said }) => ({ role, text: said }));
      let results: Source[] | undefined;
      let notice: string | null = null;

      setChat((previous) => ({
        head: question.id,
        messages: [...previous.messages, question],
      }));
      setOpen(true);
      setGenerating(true);
      setResearching(research);
      setFound(null);
      setAsking(text);
      setError(null);
      setCurrent(0);

      try {
        // The search is its own request, so what it found can be shown while
        // the answer is still being written from it.
        if (research) {
          const search = await fetch("/api/research", {
            body: JSON.stringify({ query: text }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          const result: { error: string | null; sources: Source[] } =
            await search.json();

          results = result.sources;
          notice = result.error;
          setFound(result.sources);
        }

        const response = await fetch("/api/draft", {
          body: JSON.stringify({
            blocks: editor.getEditorState().read($documentBlocks),
            history,
            prompt: text,
            research,
            sources: results,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("The request failed");
        }

        const data: { edits: Edit[]; reply: string; sources: Source[] } =
          await response.json();
        let count = 0;

        // The edits go into the document as changes to accept or reject.
        editor.update(
          () => {
            count = $applyEdits(data.edits, data.sources, wantsCitations(text));
          },
          { discrete: true }
        );

        const answer: Message = {
          changes: count,
          id: crypto.randomUUID(),
          notice,
          parent: question.id,
          role: "assistant",
          sources: data.sources.map((source) => ({
            ...source,
            content: source.content.slice(0, SOURCE_EXCERPT),
          })),
          text:
            data.reply.trim() ||
            (count > 0
              ? `I suggested ${count} ${count === 1 ? "change" : "changes"} in the document.`
              : "There was nothing to change."),
        };

        setChat((previous) => ({
          head: answer.id,
          messages: [...previous.messages, answer],
        }));
      } catch {
        setError("Could not get an answer. Try again.");
      } finally {
        setGenerating(false);
        setResearching(false);
      }
    },
    [chat.messages, editor, setChat, setCurrent]
  );

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      const text = prompt.trim();

      if (text && !generating) {
        setPrompt("");
        ask(text, chat.head);
      }
    },
    [ask, chat.head, generating, prompt]
  );

  // Asking again with other words: the changes the old question made are put
  // back first, and the new question is another line beside the old one.
  const edit = useCallback(
    (id: string, text: string) => {
      const message = chat.messages.find((item) => item.id === id);

      if (message && !generating) {
        editor.update(() => $resolve(null, false), { discrete: true });
        ask(text, message.parent);
      }
    },
    [ask, chat.messages, editor, generating]
  );

  const branch = useCallback(
    (id: string) => {
      setChat((previous) => ({ ...previous, head: id }));
      setOpen(true);
      inputRef.current?.focus();
    },
    [setChat]
  );

  const remove = useCallback(
    (id: string) => setChat((previous) => withoutBranch(previous, id)),
    [setChat]
  );

  const switchLine = useCallback(
    (id: string, step: number) => {
      const message = chat.messages.find((item) => item.id === id);
      const others = message ? alternatives(chat, message) : [];
      const target = message ? others[others.indexOf(message) + step] : null;

      if (target) {
        setChat((previous) => ({
          ...previous,
          head: endOf(previous, target.id),
        }));
      }
    },
    [chat, setChat]
  );

  const stopBranching = useCallback(
    () =>
      setChat((previous) => ({
        ...previous,
        head: previous.head ? endOf(previous, previous.head) : null,
      })),
    [setChat]
  );

  const clear = useCallback(
    () => setChat({ head: null, messages: [] }),
    [setChat]
  );
  const hide = useCallback(() => setOpen(false), []);
  const show = useCallback(() => setOpen(true), []);

  const stepChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const count = changes.length;
      const next =
        (Math.min(current, count - 1) +
          Number(event.currentTarget.dataset.step) +
          count) %
        count;

      setCurrent(next);
      editor
        .getElementByKey(changes[next]?.keys[0] ?? "")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [changes, current, editor, setCurrent]
  );
  const settleAll = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const accept = event.currentTarget.dataset.accept === "true";

      editor.update(() => $resolve(null, accept));
    },
    [editor]
  );

  return (
    <div className="relative flex flex-col gap-2 font-sans text-sm">
      {panel.mounted ? (
        <div
          className={`absolute right-0 bottom-full left-0 mb-2 flex origin-bottom flex-col border border-primary/40 bg-card shadow-lg ${PANEL_MOTION}`}
          data-state={panel.state}
        >
          {chatPresence.mounted ? (
            <div
              className={`flex flex-col ${CHAT_MOTION}`}
              data-state={chatPresence.state}
            >
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <span className="font-medium text-xs">Chat</span>
                <div className="flex gap-1">
                  <Button
                    aria-label="Clear chat"
                    disabled={generating}
                    onClick={clear}
                    size="icon-xs"
                    title="Clear chat"
                    variant="ghost"
                  >
                    <TrashIcon />
                  </Button>
                  <Button
                    aria-label="Hide chat"
                    onClick={hide}
                    size="icon-xs"
                    title="Hide chat"
                    variant="ghost"
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
              <Conversation className="h-72">
                <ConversationContent>
                  {line.map((message) => {
                    const others = alternatives(chat, message);

                    return (
                      <ChatMessage
                        fresh={fresh.has(message.id)}
                        key={message.id}
                        message={message}
                        onBranch={branch}
                        onDelete={remove}
                        onEdit={edit}
                        onSwitch={switchLine}
                        position={{
                          count: others.length,
                          index: others.indexOf(message),
                        }}
                      />
                    );
                  })}
                  {generating ? (
                    <div
                      className={`flex flex-col gap-3 ${ARRIVE}`}
                      role="status"
                    >
                      <span className="text-muted-foreground text-xs">
                        Nucliva
                      </span>
                      {researching ? (
                        <Task>
                          <TaskTrigger
                            title={
                              found
                                ? `Found ${found.length} sources`
                                : "Checking external sources..."
                            }
                          />
                          <TaskContent>
                            {found ? (
                              found.map((source, index) => (
                                <TaskItem key={source.url}>
                                  {/* The sites that were found come in one after the other. */}
                                  <TaskItemFile
                                    className={`fill-mode-backwards ${ARRIVE}`}
                                    style={{
                                      animationDelay: `${index * 60}ms`,
                                    }}
                                  >
                                    <SiteIcon url={source.url} />
                                    {new URL(source.url).hostname}
                                  </TaskItemFile>
                                </TaskItem>
                              ))
                            ) : (
                              <TaskItem className="animate-pulse">
                                Searching the web for "{asking}"
                              </TaskItem>
                            )}
                          </TaskContent>
                        </Task>
                      ) : null}
                      {researching && !found ? null : (
                        <Task className={ARRIVE}>
                          <TaskTrigger title="Writing in your voice" />
                          <TaskContent>
                            <TaskItem className="animate-pulse">
                              {researching
                                ? "Drafting from what it found..."
                                : "Thinking..."}
                            </TaskItem>
                          </TaskContent>
                        </Task>
                      )}
                    </div>
                  ) : null}
                  {error ? (
                    <p className="text-destructive text-xs">{error}</p>
                  ) : null}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
              {branching ? (
                <div
                  className={`flex items-center justify-between gap-2 border-t bg-muted/40 px-3 py-1.5 text-xs ${ARRIVE}`}
                >
                  <span>The next message goes on from the one you picked.</span>
                  <Button onClick={stopBranching} size="xs" variant="ghost">
                    Go to the latest
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {changes.length > 0 ? (
            <div
              className={`flex items-center gap-3 border-t px-3 py-2 first:border-t-0 ${ARRIVE}`}
            >
              {/* Steps through the changes, taking the document to each. */}
              <div className="flex items-center gap-1 text-muted-foreground text-xs tabular-nums">
                <Button
                  aria-label="Previous change"
                  data-step="-1"
                  onClick={stepChange}
                  size="icon-xs"
                  variant="ghost"
                >
                  <CaretUpIcon />
                </Button>
                <span>
                  {Math.min(current, changes.length - 1) + 1}/{changes.length}
                </span>
                <Button
                  aria-label="Next change"
                  data-step="1"
                  onClick={stepChange}
                  size="icon-xs"
                  variant="ghost"
                >
                  <CaretDownIcon />
                </Button>
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  data-accept="false"
                  onClick={settleAll}
                  size="sm"
                  variant="outline"
                >
                  Reject All
                </Button>
                <Button data-accept="true" onClick={settleAll} size="sm">
                  Accept All
                </Button>
              </div>
            </div>
          ) : null}
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
      </div>
      <form
        autoComplete="off"
        className="relative flex items-center gap-2 overflow-hidden border bg-card p-2 shadow-lg"
        onSubmit={submit}
      >
        {/* While the AI works, a bar of light runs along the top of the prompt. */}
        {generating ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px motion-safe:fade-in-0 motion-safe:animate-in"
          >
            <span className="block h-full w-1/4 bg-primary motion-safe:animate-sweep" />
          </span>
        ) : null}
        <SparkleIcon
          className={`ml-1 size-5 shrink-0 text-primary transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${generating ? "motion-safe:scale-110" : ""}`}
        />
        <Input
          aria-label="What should we write?"
          autoComplete="off"
          className="h-8 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
          data-1p-ignore
          data-lpignore="true"
          disabled={generating}
          name="draft-prompt"
          onChange={handlePromptChange}
          placeholder="Ask, or write with Nucliva in your voice..."
          ref={inputRef}
          value={prompt}
        />
        {!open && line.length > 0 ? (
          <Button
            aria-label="Show chat"
            onClick={show}
            size="icon-sm"
            title="Show chat"
            type="button"
            variant="ghost"
          >
            <ChatCircleDotsIcon />
          </Button>
        ) : null}
        <Button
          aria-label="Generate draft"
          disabled={generating || !prompt.trim()}
          size="icon-sm"
          type="submit"
        >
          {generating ? (
            <SparkleIcon className="animate-pulse" />
          ) : (
            <ArrowUpIcon />
          )}
        </Button>
      </form>
    </div>
  );
}

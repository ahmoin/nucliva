"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $dfs } from "@lexical/utils";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
  type UpdateListener,
} from "lexical";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  $changes,
  $replaceSpans,
  $resolve,
  $segments,
  $suggestRewrite,
  suggestionState,
} from "@/components/document-suggestions";
import {
  compatible,
  type Extraction,
  type FactData,
  hasFact,
  hashText,
  kindOf,
  locateMentions,
  MAX_LOG,
  mergeExtraction,
  type Parsed,
  parseMention,
  proposeRipple,
  type RippleEntry,
  readFactData,
  sameValue,
  valueIn,
} from "@/lib/editor/facts";

export const RIPPLE_PREFIX = "ripple:";
const PREFIX = RIPPLE_PREFIX;
const READ_AFTER = 1000;
const SETTLE_AFTER = 1200;
const MAX_PARAGRAPH = 3000;
const MAX_REWRITES = 6;
const MAX_FACTS_SENT = 60;
const REQUEST_TIMEOUT = 20_000;
const PAUSE_AFTER_FAILURES = 60_000;
// Must stay 1: parallel reads cannot see each other's facts and duplicate them.
const READS_AT_ONCE = 1;

type Timer = ReturnType<typeof setTimeout>;

export class FactStore {
  data: FactData;
  private readonly listeners = new Set<() => void>();

  constructor(saved: unknown) {
    this.data = readFactData(saved);
  }

  set(next: FactData) {
    this.data = next;

    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function useFactStore(saved: unknown) {
  const [store] = useState(() => new FactStore(saved));

  return store;
}

interface Leaf {
  busy: boolean;
  key: string;
  node: ElementNode;
  text: string;
}

const $isLeaf = (node: LexicalNode | null): node is ElementNode =>
  $isElementNode(node) &&
  node.getType() !== "root" &&
  !node.isInline() &&
  node
    .getChildren()
    .every((child) => !$isElementNode(child) || child.isInline()) &&
  node
    .getChildren()
    .some((child) => $isTextNode(child) || $isElementNode(child));

const $busy = (node: ElementNode) =>
  $getState(node, suggestionState) !== null ||
  node
    .getAllTextNodes()
    .some((text) => $getState(text, suggestionState) !== null);

function $leaves(): Leaf[] {
  const leaves: Leaf[] = [];

  for (const { node } of $dfs()) {
    if ($isLeaf(node)) {
      leaves.push({
        busy: $busy(node),
        key: node.getKey(),
        node,
        text: node.getTextContent(),
      });
    }
  }

  return leaves;
}

const $blockOf = (node: LexicalNode | null) => {
  let at: LexicalNode | null = node;

  while (at && !($isElementNode(at) && !at.isInline())) {
    at = at.getParent();
  }

  return $isLeaf(at) ? at : null;
};

interface Caret {
  key: string;
  offset: number;
}

type Point = RangeSelection["anchor"];

function $pointAt(point: Point): Caret | null {
  const block = $blockOf(point.getNode());

  if (!block) {
    return null;
  }

  if (point.type === "text") {
    const segment = $segments(block).find((item) =>
      item.node.is(point.getNode())
    );

    return segment
      ? { key: block.getKey(), offset: segment.start + point.offset }
      : null;
  }

  const node = point.getNode();
  const before = $isElementNode(node)
    ? node
        .getChildren()
        .slice(0, point.offset)
        .reduce((total, child) => total + child.getTextContentSize(), 0)
    : 0;

  return { key: block.getKey(), offset: node.is(block) ? before : 0 };
}

function $caret(): Caret | null {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return null;
  }

  const anchor = $pointAt(selection.anchor);

  if (selection.isCollapsed() || !anchor) {
    return anchor;
  }

  const focus = $pointAt(selection.focus);

  if (focus?.key !== anchor.key) {
    return null;
  }

  return { key: anchor.key, offset: Math.min(anchor.offset, focus.offset) };
}

const $rippleChanges = () =>
  $changes().filter((change) => change.id.startsWith(PREFIX));

interface Active {
  before: string;
  end: number;
  factId: string;
  key: string;
  start: number;
  text: string;
  unit: string;
  value: number | string;
}

interface Edit {
  end: number;
  factId: string;
  from: string;
  key: string;
  start: number;
  to: string;
  value: number | string;
}

interface Target {
  key: string;
  sentence: string;
  text: string;
}

interface Rewrite extends Target {
  next: string;
}

const post = (url: string, body: unknown, gone: AbortSignal) =>
  fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT), gone]),
  });

function $factAt(caret: Caret, store: FactStore): Active | null {
  const node = $getNodeByKey(caret.key);

  if (!$isLeaf(node)) {
    return null;
  }

  const text = node.getTextContent();
  const here = locateMentions(
    text,
    store.data.mentions[hashText(text)] ?? []
  ).find((item) => caret.offset >= item.start && caret.offset <= item.end);
  const fact = here
    ? store.data.facts.find((item) => item.id === here.factId)
    : undefined;
  const parsed = here && fact ? parseMention(here.text, fact.unit) : null;

  return here && fact && parsed
    ? {
        before: text,
        end: here.end,
        factId: fact.id,
        key: caret.key,
        start: here.start,
        text: here.text,
        unit: fact.unit,
        value: parsed.value,
      }
    : null;
}

interface Change {
  text: string;
  written: string;
}

function $changeOf(done: Active): (Change & { after: string }) | null {
  const block = $getNodeByKey(done.key);

  if (!$isElementNode(block)) {
    return null;
  }

  const after = block.getTextContent();
  const delta = after.length - done.before.length;

  if (
    done.before.slice(0, done.start) !== after.slice(0, done.start) ||
    done.before.slice(done.end) !== after.slice(done.end + delta)
  ) {
    return null;
  }

  const written = after.slice(done.start, done.end + delta);

  return { after, text: valueIn(written) ?? written, written };
}

function $applyRewrites(rewrites: (Rewrite | null)[], run: string) {
  const before = new Map<string, string>();
  let counter = 0;

  for (const item of rewrites) {
    const node = item ? $getNodeByKey(item.key) : null;

    if (!(item && $isLeaf(node)) || node.getTextContent() !== item.text) {
      continue;
    }

    counter += 1;
    before.set(item.key, item.text);
    $suggestRewrite(node, item.text.replace(item.sentence, item.next), {
      prefix: `${PREFIX}${run}:soft:${counter}:`,
      soft: true,
    });
  }

  return before;
}

function $settleRun(run: string, before: Map<string, string>) {
  const ids = $changes()
    .filter((change) => change.id.startsWith(`${PREFIX}${run}:`))
    .map((change) => change.id);

  $resolve(new Set(ids), true);

  return [...before].flatMap(([key, text]) => {
    const node = $getNodeByKey(key);
    const after = node ? node.getTextContent() : null;

    return after !== null && after !== text ? [{ after, before: text }] : [];
  });
}

function logged(
  data: FactData,
  entry: Omit<RippleEntry, "places" | "reverted">,
  places: RippleEntry["places"]
): FactData {
  const known = data.log.find((item) => item.id === entry.id);
  const log = known
    ? data.log.map((item) =>
        item.id === entry.id
          ? { ...item, places: [...item.places, ...places] }
          : item
      )
    : [...data.log, { ...entry, places, reverted: false }];

  return { ...data, log: log.slice(-MAX_LOG) };
}

export function revertRipple(
  editor: LexicalEditor,
  store: FactStore,
  id: string
) {
  const entry = store.data.log.find((item) => item.id === id);

  if (!entry || entry.reverted) {
    return 0;
  }

  const prefix = `${PREFIX}undo:${id}:`;
  let undone = 0;

  editor.update(
    () => {
      const left = [...entry.places];

      for (const leaf of $leaves()) {
        const at = left.findIndex((place) => place.after === leaf.text);
        const [place] = at >= 0 ? left.splice(at, 1) : [];

        if (place) {
          undone += 1;
          $suggestRewrite(leaf.node, place.before, {
            prefix: `${prefix}${undone}:`,
          });
        }
      }

      $resolve(
        new Set(
          $changes()
            .filter((change) => change.id.startsWith(prefix))
            .map((change) => change.id)
        ),
        true
      );
    },
    { discrete: true }
  );
  store.set({
    ...store.data,
    log: store.data.log.map((item) =>
      item.id === id ? { ...item, reverted: true } : item
    ),
  });

  return undone;
}

interface Notice {
  count: number;
  id: string;
  key: string;
  kind: string;
  to: string;
}

interface Show {
  notice: (notice: Notice) => void;
}

class Ripple {
  private active: Active | null = null;
  private failures = 0;
  private readonly editor: LexicalEditor;
  private pausedUntil = 0;
  private readonly queue: { hash: string; text: string }[] = [];
  private readonly reading = new Set<string>();
  private running = 0;
  private settle: Timer | null = null;
  private readonly show: Show;
  private readonly skipped = new Set<string>();
  private readonly lifetime = new AbortController();
  private readonly store: FactStore;
  private readonly timers = new Map<string, Timer>();

  constructor(editor: LexicalEditor, store: FactStore, show: Show) {
    this.editor = editor;
    this.store = store;
    this.show = show;
  }

  start() {
    const stopWatching = this.editor.registerUpdateListener(this.onUpdate);
    const first = setTimeout(() => this.readAll(), 1500);

    return () => {
      this.lifetime.abort();
      clearTimeout(first);

      if (this.settle) {
        clearTimeout(this.settle);
      }

      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }

      stopWatching();
    };
  }

  private pump() {
    while (this.running < READS_AT_ONCE && this.queue.length > 0) {
      const job = this.queue.shift();

      if (!job) {
        break;
      }

      this.running += 1;
      this.read(job)
        .catch(() => undefined)
        .finally(() => {
          this.running -= 1;
          this.reading.delete(job.hash);
          this.pump();
        });
    }
  }

  private failed() {
    this.failures += 1;
    this.pausedUntil =
      this.failures >= 3 ? Date.now() + PAUSE_AFTER_FAILURES : 0;
  }

  private async read({ text }: { hash: string; text: string }) {
    if (this.lifetime.signal.aborted || Date.now() < this.pausedUntil) {
      return;
    }

    try {
      const response = await post(
        "/api/facts",
        {
          paragraph: text,
          table: this.store.data.facts.slice(0, MAX_FACTS_SENT),
        },
        this.lifetime.signal
      );

      if (!response.ok) {
        this.failed();

        return;
      }

      this.failures = 0;

      const result = (await response.json()) as Partial<Extraction> | null;

      if (
        Array.isArray(result?.facts) &&
        Array.isArray(result?.dependents) &&
        !this.lifetime.signal.aborted
      ) {
        this.store.set(
          mergeExtraction(this.store.data, text, result as Extraction)
        );
      }
    } catch {
      this.failed();
    }
  }

  private consider(text: string) {
    const hash = hashText(text);

    if (
      this.store.data.mentions[hash] ||
      this.reading.has(hash) ||
      this.skipped.has(hash)
    ) {
      return;
    }

    if (text.length > MAX_PARAGRAPH || !hasFact(text)) {
      this.skipped.add(hash);

      return;
    }

    this.reading.add(hash);
    this.queue.push({ hash, text });
    this.pump();
  }

  private schedule(key: string) {
    clearTimeout(this.timers.get(key));
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        this.editor.getEditorState().read(() => {
          const node = $getNodeByKey(key);

          if ($isLeaf(node) && !$busy(node)) {
            this.consider(node.getTextContent());
          }
        });
      }, READ_AFTER)
    );
  }

  private readAll() {
    this.editor.getEditorState().read(() => {
      for (const leaf of $leaves()) {
        if (!leaf.busy) {
          this.consider(leaf.text);
        }
      }
    });
  }

  private ripple(edit: Edit) {
    const run = crypto.randomUUID().slice(0, 8);
    const outcome = { places: 0, touched: new Set<string>() };

    this.editor.update(() => this.$apply(edit, run, outcome), {
      onUpdate: () => {
        const fact = this.store.data.facts.find(
          (item) => item.id === edit.factId
        );

        if (outcome.places > 0) {
          this.show.notice({
            count: outcome.places,
            id: run,
            key: edit.key,
            kind: kindOf(fact?.unit ?? ""),
            to: edit.to,
          });
        }

        this.rewrite(edit, run, outcome.touched).catch(() => undefined);
      },
    });
  }

  private entryOf(edit: Edit, run: string) {
    const fact = this.store.data.facts.find((item) => item.id === edit.factId);

    return {
      at: Date.now(),
      from: edit.from,
      id: run,
      label: fact?.label ?? "Fact",
      to: edit.to,
    };
  }

  private $apply(
    edit: Edit,
    run: string,
    outcome: { places: number; touched: Set<string> }
  ) {
    const old = $rippleChanges().map((change) => change.id);

    if (old.length > 0) {
      $resolve(new Set(old), false);
    }

    const leaves = $leaves().filter((leaf) => !leaf.busy);
    const result = proposeRipple({
      blocks: leaves.map(({ key, text }) => ({ key, text })),
      change: {
        factId: edit.factId,
        source: { blockKey: edit.key, end: edit.end, start: edit.start },
        value: edit.value,
      },
      data: this.store.data,
    });
    const before = new Map<string, string>();
    let counter = 0;

    for (const leaf of leaves) {
      const mine = result.proposals.filter(
        (proposal) => proposal.blockKey === leaf.key
      );

      if (mine.length > 0) {
        counter += 1;
        before.set(leaf.key, leaf.text);
        $replaceSpans(
          leaf.node,
          mine.map((proposal, index) => ({
            end: proposal.end,
            id: `${PREFIX}${run}:${counter}:${index}`,
            start: proposal.start,
            text: proposal.to,
          }))
        );
        outcome.touched.add(leaf.key);
      }
    }

    const places = $settleRun(run, before);
    const data = { ...this.store.data, facts: result.facts };

    outcome.places = places.length;
    this.store.set(
      places.length > 0 ? logged(data, this.entryOf(edit, run), places) : data
    );
  }

  private targets(edit: Edit, touched: Set<string>): Target[] {
    return this.editor.getEditorState().read(() =>
      $leaves()
        .filter((leaf) => !(leaf.busy || touched.has(leaf.key)))
        .flatMap((leaf) =>
          (this.store.data.dependents[hashText(leaf.text)] ?? [])
            .filter((item) => item.factId === edit.factId)
            .map((item) => ({
              key: leaf.key,
              sentence: item.sentence,
              text: leaf.text,
            }))
        )
        .slice(0, MAX_REWRITES)
    );
  }

  private async askRewrite(
    target: Target,
    edit: Edit,
    label: string
  ): Promise<Rewrite | null> {
    try {
      const response = await post(
        "/api/facts/rewrite",
        {
          from: edit.from,
          label,
          sentence: target.sentence,
          to: edit.to,
        },
        this.lifetime.signal
      );
      const data = response.ok
        ? ((await response.json()) as { sentence?: string })
        : null;
      const next = data?.sentence;

      return typeof next === "string" && next && next !== target.sentence
        ? { ...target, next }
        : null;
    } catch {
      return null;
    }
  }

  private async rewrite(edit: Edit, run: string, touched: Set<string>) {
    const fact = this.store.data.facts.find((item) => item.id === edit.factId);
    const targets = this.targets(edit, touched);

    if (targets.length === 0 || !fact) {
      return;
    }

    const rewrites = await Promise.all(
      targets.map((target) => this.askRewrite(target, edit, fact.label))
    );

    if (this.lifetime.signal.aborted) {
      return;
    }

    this.editor.update(() => {
      const places = $settleRun(run, $applyRewrites(rewrites, run));

      if (places.length > 0) {
        this.store.set(logged(this.store.data, this.entryOf(edit, run), places));
      }
    });
  }

  private finish(done: Active, keep: boolean) {
    this.editor.getEditorState().read(() => {
      const change = $changeOf(done);

      if (!change) {
        return;
      }

      const parsed = parseMention(change.text, done.unit);
      const was = done.text;
      const changed =
        parsed !== null &&
        compatible(parsed.unit, done.unit) &&
        !sameValue(parsed.value, done.value);

      if (keep) {
        this.rebase(done, change, changed ? parsed : null);
      }

      if (changed && parsed) {
        const edit: Edit = {
          end: done.start + change.written.length,
          factId: done.factId,
          from: was,
          key: done.key,
          start: done.start,
          to: change.text,
          value: parsed.value,
        };

        // Deferred: this runs inside a read, which cannot start an update.
        setTimeout(() => this.ripple(edit), 0);
      }
    });
  }

  private rebase(
    done: Active,
    change: Change & { after: string },
    parsed: Parsed | null
  ) {
    done.end += change.after.length - done.before.length;
    done.before = change.after;
    done.text = change.text;

    if (parsed) {
      done.value = parsed.value;
    }
  }

  private restartSettle() {
    if (this.settle) {
      clearTimeout(this.settle);
    }

    this.settle = setTimeout(() => {
      if (this.active) {
        this.finish(this.active, true);
      }
    }, SETTLE_AFTER);
  }

  private $scheduleDirty(dirty: Map<string, unknown>) {
    for (const key of dirty.keys()) {
      if ($isLeaf($getNodeByKey(key))) {
        this.schedule(key);
      }
    }
  }

  private $leave(caret: Caret | null, edited: boolean) {
    const { active } = this;

    if (!active) {
      return;
    }

    const block = $getNodeByKey(active.key);
    const text = $isElementNode(block) ? block.getTextContent() : null;
    const delta = (text?.length ?? 0) - active.before.length;
    const inside =
      text !== null &&
      caret?.key === active.key &&
      caret.offset >= active.start &&
      caret.offset <= active.end + delta;

    if (inside) {
      if (edited) {
        this.restartSettle();
      }

      return;
    }

    this.active = null;
    this.finish(active, false);
  }

  private readonly onUpdate: UpdateListener = ({
    dirtyElements,
    editorState,
    tags,
  }) => {
    editorState.read(() => {
      if (tags.has("historic")) {
        this.active = null;

        return;
      }

      this.$scheduleDirty(dirtyElements);

      const caret = $caret();

      this.$leave(caret, dirtyElements.size > 0);

      if (!this.active && caret) {
        this.active = $factAt(caret, this.store);
      }
    });
  };
}

const NOTICE_FOR = 8000;

const plural = (count: number, one: string) =>
  `${count} ${count === 1 ? one : `${one}s`}`;

export function RipplePlugin({ store }: { store: FactStore }) {
  const [editor] = useLexicalComposerContext();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(
    null
  );

  useEffect(
    () => new Ripple(editor, store, { notice: setNotice }).start(),
    [editor, store]
  );

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), NOTICE_FOR);

    return () => clearTimeout(timer);
  }, [notice]);

  useLayoutEffect(() => {
    if (!notice) {
      setPlace(null);

      return;
    }

    const move = () => {
      const element = editor.getElementByKey(notice.key);

      if (!element) {
        setPlace(null);

        return;
      }

      const box = element.getBoundingClientRect();

      setPlace({
        left: Math.max(8, box.left),
        top: Math.min(Math.max(8, box.top - 38), window.innerHeight - 44),
      });
    };

    move();
    window.addEventListener("scroll", move, true);
    window.addEventListener("resize", move);

    const stop = editor.registerUpdateListener(move);

    return () => {
      window.removeEventListener("scroll", move, true);
      window.removeEventListener("resize", move);
      stop();
    };
  }, [editor, notice]);

  if (!(notice && place)) {
    return null;
  }

  return createPortal(
    <div
      className="motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 fixed z-[65] flex items-center gap-3 border bg-popover px-3 py-1.5 text-popover-foreground text-xs shadow-md motion-safe:animate-in motion-safe:duration-150"
      role="status"
      style={{ left: place.left, top: place.top }}
    >
      <span>
        Updated {plural(notice.count, "other place")} to match{" "}
        <span className="font-medium">{notice.to}</span>.
      </span>
      <button
        className="font-semibold text-primary uppercase tracking-widest hover:underline"
        onClick={() => {
          revertRipple(editor, store, notice.id);
          setNotice(null);
        }}
        type="button"
      >
        Undo
      </button>
    </div>,
    document.body
  );
}

const ago = (at: number) => {
  const minutes = Math.round((Date.now() - at) / 60_000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  return hours < 24
    ? `${hours} hr ago`
    : new Date(at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
};

export function RippleLog({
  onOpen,
  store,
}: {
  onOpen?: () => void;
  store: FactStore;
}) {
  const [editor] = useLexicalComposerContext();
  const data = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.data,
    () => store.data
  );
  const entries = [...data.log].reverse();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          onOpen?.();
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Ripple log"
            className="gap-1.5"
            data-tour="ripple-log"
            size="sm"
            variant="ghost"
          />
        }
      >
        <ClockCounterClockwiseIcon />
        {entries.length > 0 ? (
          <span className="tabular-nums">{entries.length}</span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ripple log</DropdownMenuLabel>
          {entries.length === 0 ? (
            <p className="px-2 pb-2 text-muted-foreground text-xs">
              Change a number or a date, and every other place in the doc that
              states it is updated. Each change shows up here.
            </p>
          ) : null}
          {entries.map((entry) => (
            <DropdownMenuItem
              className="flex items-start gap-3"
              disabled={entry.reverted}
              key={entry.id}
              onClick={() => revertRipple(editor, store, entry.id)}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{entry.label}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {entry.from} to {entry.to}, {plural(entry.places.length, "place")}
                  , {ago(entry.at)}
                </span>
              </div>
              <span className="shrink-0 font-semibold text-primary text-xs uppercase tracking-widest">
                {entry.reverted ? "Undone" : "Undo"}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

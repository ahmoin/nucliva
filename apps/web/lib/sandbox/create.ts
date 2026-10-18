import { db } from "@workspace/db";
import { documents, styleSamples } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { ingestText } from "@/lib/ai/embeddings";
import type { Solution } from "@/lib/content/solutions";
import {
  type SandboxDeck,
  type SandboxSheet,
  type Workspace,
  workspaces,
} from "@/lib/sandbox/data";
import { fillWorkspace } from "@/lib/sandbox/fill";

const DAY = 24 * 60 * 60 * 1000;

const text = (value: string) => ({
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: value,
  type: "text",
  version: 1,
});

const block = (type: string, value: string, extra: object = {}) => ({
  children: value ? [text(value)] : [],
  direction: null,
  format: "",
  indent: 0,
  type,
  version: 1,
  ...extra,
});

const bullets = (items: string[]) => ({
  children: items.map((item, index) => ({
    ...block("listitem", item),
    value: index + 1,
  })),
  direction: null,
  format: "",
  indent: 0,
  listType: "bullet",
  start: 1,
  tag: "ul",
  type: "list",
  version: 1,
});

// The saved shape of a document, which is what the editor opens: a title, then
// the lines of text, with "## " for a heading and "- " for a bullet.
export function docContent(title: string, body: string[]) {
  const nodes: object[] = [block("heading", title, { tag: "h1" })];
  let list: string[] = [];

  const closeList = () => {
    if (list.length > 0) {
      nodes.push(bullets(list));
      list = [];
    }
  };

  for (const line of body) {
    if (line.startsWith("- ")) {
      list.push(line.slice(2));

      continue;
    }

    closeList();
    nodes.push(
      line.startsWith("## ")
        ? block("heading", line.slice(3), { tag: "h2" })
        : block("paragraph", line)
    );
  }

  closeList();

  return {
    root: {
      children: [
        {
          children: nodes,
          direction: null,
          format: "",
          indent: 0,
          type: "page",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// The notes a guest writes from, in the document they land in.
const notesContent = (title: string, notes: string[]) =>
  docContent(title, [
    "Rough notes to write from:",
    ...notes.map((n) => `- ${n}`),
    "",
  ]);

const textLayer = (
  name: string,
  value: string,
  at: { height: number; size: number; weight: number; y: number }
) => ({
  cssVars: {
    "--color": "#111111",
    "--font-size": `${at.size}px`,
    "--font-weight": String(at.weight),
    "--height": `${at.height}px`,
    "--rotate": "0deg",
    "--text-align": "left",
    "--width": "800px",
    "--x": "80px",
    "--y": `${at.y}px`,
  },
  id: crypto.randomUUID(),
  name,
  type: "text" as const,
  value,
});

const accentLayer = () => ({
  cssVars: {
    "--fill": "#2ee59d",
    "--height": "8px",
    "--radius": "0px",
    "--rotate": "0deg",
    "--width": "96px",
    "--x": "80px",
    "--y": "120px",
  },
  id: crypto.randomUUID(),
  name: "Accent",
  type: "shape" as const,
});

// A deck in the shape the slide editor saves: an accent bar, a title and a
// line for each point.
export function deckContent(deck: Pick<SandboxDeck, "slides">) {
  return {
    slides: deck.slides.map((slide) => ({
      id: crypto.randomUUID(),
      layers: [
        accentLayer(),
        textLayer("Title", slide.title, {
          height: 80,
          size: 52,
          weight: 700,
          y: 150,
        }),
        ...slide.points.map((point, index) =>
          textLayer(`Point ${index + 1}`, point, {
            height: 56,
            size: 28,
            weight: 400,
            y: 280 + index * 64,
          })
        ),
      ],
    })),
  };
}

// A sheet in the shape the spreadsheet saves, with the first row as a header.
export function sheetContent(sheet: Pick<SandboxSheet, "rows">) {
  const celldata = sheet.rows.flatMap((row, r) =>
    row.map((value, c) => ({
      c,
      r,
      v: {
        bl: r === 0 ? 1 : 0,
        ct:
          typeof value === "number"
            ? { fa: "General", t: "n" }
            : { fa: "General", t: "g" },
        m: String(value),
        v: value,
      },
    }))
  );

  return {
    sheets: [
      {
        celldata,
        config: { columnlen: { 0: 190, 1: 130, 2: 130, 3: 170 } },
        name: "Sheet1",
      },
    ],
  };
}

const ago = (days: number) => new Date(Date.now() - days * DAY);

// Puts a workspace in the account: earlier documents, a deck and a sheet, which
// make it look like someone has been working here, and writing samples for a
// voice to match. Each only goes in once for a line of work.
async function seedWorkspace(
  userId: string,
  category: string,
  workspace: Workspace
) {
  const [first] = workspace.docs;

  if (first) {
    const [existing] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(eq(documents.userId, userId), eq(documents.title, first.title))
      )
      .limit(1);

    if (existing) {
      return [];
    }
  }

  const docs = workspace.docs.map((doc) => ({
    content: docContent(doc.title, doc.body),
    createdAt: ago(doc.ago + 2),
    id: crypto.randomUUID(),
    kind: "doc" as const,
    source: doc,
    starredAt: doc.starred ? ago(doc.ago) : null,
    title: doc.title,
    updatedAt: ago(doc.ago),
    userId,
  }));

  // The ordinary files around them, up to the size of a real account. The
  // oldest few are in the trash.
  const filled = fillWorkspace(category, workspace.docs.length + 3);
  const rest = [
    ...filled.docs.map((doc) => ({
      ago: doc.ago,
      content: docContent(doc.title, doc.body),
      kind: "doc" as const,
      starred: doc.starred,
      title: doc.title,
    })),
    ...filled.sheets.map((sheet) => ({
      ago: sheet.ago,
      content: sheetContent(sheet),
      kind: "sheet" as const,
      starred: sheet.starred,
      title: sheet.title,
    })),
    ...filled.decks.map((deck) => ({
      ago: deck.ago,
      content: deckContent(deck),
      kind: "slides" as const,
      starred: false,
      title: deck.title,
    })),
  ].sort((a, b) => b.ago - a.ago);

  await db.insert(documents).values([
    ...rest.map((file, index) => ({
      content: file.content,
      createdAt: ago(file.ago + 1),
      deletedAt: index < 3 ? ago(file.ago - 1 > 0 ? file.ago - 1 : 1) : null,
      kind: file.kind,
      starredAt: file.starred ? ago(file.ago) : null,
      title: file.title,
      updatedAt: ago(file.ago),
      userId,
    })),
    ...docs.map(({ source: _source, ...row }) => row),
    {
      content: deckContent(workspace.deck),
      createdAt: ago(workspace.deck.ago + 1),
      kind: "slides" as const,
      title: workspace.deck.title,
      updatedAt: ago(workspace.deck.ago),
      userId,
    },
    {
      content: sheetContent(workspace.sheet),
      createdAt: ago(workspace.sheet.ago + 1),
      kind: "sheet" as const,
      title: workspace.sheet.title,
      updatedAt: ago(workspace.sheet.ago),
      userId,
    },
  ]);

  if (workspace.samples.length > 0) {
    await db
      .insert(styleSamples)
      .values(workspace.samples.map((content) => ({ content, userId })));
  }

  return [
    ...workspace.samples.map((sample) => ({
      kind: "style" as const,
      text: sample,
    })),
    ...docs.map((doc) => ({
      documentId: doc.id,
      kind: "context" as const,
      text: `${doc.title}\n\n${doc.source.body.join("\n")}`,
    })),
  ];
}

export interface Embed {
  documentId?: string;
  kind: "context" | "style";
  text: string;
}

// Opens a solution in someone's account. The document of notes for the
// solution always goes in. A guest also gets the workspace around it, so it is
// a place with a history and not a blank page. Returns the id of the document,
// and what is left to index.
export async function createSandbox({
  guest,
  solution,
  userId,
}: {
  guest: boolean;
  solution: Solution;
  userId: string;
}) {
  const workspace = workspaces[solution.category];
  const [created] = await db
    .insert(documents)
    .values({
      content: notesContent(solution.title, workspace?.notes ?? []),
      title: solution.title,
      userId,
    })
    .returning({ id: documents.id });
  const embeds =
    guest && workspace
      ? await seedWorkspace(userId, solution.category, workspace)
      : [];

  return { documentId: created?.id, embeds };
}

// Makes the writing and the documents searchable, which is how Nucliva finds a
// voice and draws on what is already there. It runs after the guest has been
// sent on, and a failure only costs that.
export async function embedAll(userId: string, embeds: Embed[]) {
  for (const embed of embeds) {
    try {
      await ingestText({ ...embed, userId });
    } catch (error) {
      console.error("embedding a sandbox item failed:", error);
    }
  }
}

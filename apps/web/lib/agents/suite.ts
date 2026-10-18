import { db } from "@workspace/db";
import { agentRuns, documents } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  type AgentStep,
  type StepKey,
  waitingSteps,
} from "@/lib/agents/steps";
import { findSimilarChunks } from "@/lib/ai/embeddings";
import { getChatModel } from "@/lib/ai/nebius";
import { ghostwriterPrompt, researchPrompt } from "@/lib/ai/prompts";
import { type Edit, extractToneMarkers } from "@/lib/ai/style-engine";
import { type Source, searchWeb } from "@/lib/ai/tavily";
import { deckContent, sheetContent } from "@/lib/sandbox/create";

const MAX_QUERIES = 4;
const MAX_SOURCES = 8;
const SOURCE_EXCERPT = 1500;
const MAX_ROWS = 20;
const MAX_POINTS = 4;

// What a doc made by an agent waits with, until the editor puts it in as
// suggestions.
export interface PendingDoc {
  edits: Edit[];
  sources: Source[];
}

const planSchema = z.object({
  deck: z
    .string()
    .describe("The story the slides tell, slide by slide, in a few lines"),
  doc: z.string().describe("What the document says, as a short outline"),
  queries: z
    .array(z.string())
    .describe(
      "One to four web searches that would find the facts, numbers and recent news the files need"
    ),
  sheet: z
    .string()
    .describe("What the sheet tracks: what one row is, and its columns"),
  title: z
    .string()
    .describe("A short name for the set of files, like Q3 investor update"),
});

const sheetSchema = z.object({
  columns: z
    .array(z.string())
    .describe("Two to six column headers. The last one is Source"),
  rows: z
    .array(z.array(z.string()))
    .describe(
      "Up to 20 rows, one value for each column. Numbers are written plainly, like 4200000 or 12.5, with no units or commas"
    ),
});

const deckSchema = z.object({
  slides: z
    .array(
      z.object({
        points: z
          .array(z.string())
          .describe("Up to four short points, under twelve words each"),
        title: z.string(),
      })
    )
    .describe(
      "Five to eight slides. The first is the title slide, with one point under the title"
    ),
});

// Where the run is, written down after every change so the page can show it.
class Progress {
  readonly steps: AgentStep[] = waitingSteps();
  private readonly runId: string;

  constructor(runId: string) {
    this.runId = runId;
  }

  start(key: StepKey, detail?: string) {
    return this.set(key, "running", detail);
  }

  done(key: StepKey, detail?: string) {
    return this.set(key, "done", detail);
  }

  // What was going on when it stopped is what failed.
  fail() {
    for (const step of this.steps) {
      if (step.status === "running") {
        step.status = "failed";
      }
    }

    return this.save();
  }

  set(key: StepKey, status: AgentStep["status"], detail?: string) {
    const step = this.steps.find((item) => item.key === key);

    if (step) {
      step.status = status;
      step.detail = detail ?? step.detail;
    }

    return this.save();
  }

  private async save() {
    await db
      .update(agentRuns)
      .set({ steps: this.steps, updatedAt: new Date() })
      .where(eq(agentRuns.id, this.runId));
  }
}

// A search that fails leaves the files with fewer sources, not no files.
async function search(query: string) {
  try {
    return await searchWeb(query);
  } catch (error) {
    console.error("agent search failed:", error);

    return [];
  }
}

const withoutFences = (text: string) =>
  text
    .trim()
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

const plainNumber = /^-?\d+(?:\.\d+)?$/;

// A value written as a plain number is a number in the sheet, so it adds up.
const cell = (value: string) => {
  const trimmed = value.trim();

  return plainNumber.test(trimmed) ? Number(trimmed) : trimmed;
};

const sourceList = (sources: Source[]) =>
  sources
    .map((source, index) => `[${index + 1}] ${source.title} (${source.url})`)
    .join("\n");

// Makes a document, a sheet and a deck for one request, in the user's voice and
// from what the web says, then leaves them as suggestions to accept. Returns
// whether it got to the end.
export async function runSuite(runId: string) {
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.id, runId))
    .limit(1);

  // A run that is already going or over is not done twice.
  if (!run || run.status !== "queued") {
    return false;
  }

  await db
    .update(agentRuns)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(agentRuns.id, runId));

  const progress = new Progress(runId);
  const { prompt, userId } = run;

  try {
    // ----- Plan -----
    await progress.start("plan");

    const context = await findSimilarChunks({
      kind: "context",
      limit: 6,
      query: prompt,
      userId,
    });
    const known =
      context.length > 0
        ? `From the user's own files, which come before anything on the web:\n${context.join("\n---\n")}`
        : "";
    const plan = await getChatModel("super", { temperature: 0.2 })
      .withStructuredOutput(planSchema)
      .invoke([
        [
          "system",
          `You plan a set of three linked files for the user's request: a document, a sheet and a slide deck. They tell one story with the same facts and numbers. ${known}`,
        ],
        ["human", prompt],
      ]);
    const title = plan.title.trim() || prompt.slice(0, 80);

    await db
      .update(agentRuns)
      .set({ title, updatedAt: new Date() })
      .where(eq(agentRuns.id, runId));
    await progress.done("plan", title);

    // ----- Research -----
    const queries = plan.queries
      .map((query) => query.trim())
      .filter(Boolean)
      .slice(0, MAX_QUERIES);

    await progress.start("research", queries.join(" · "));

    const found = (await Promise.all(queries.map(search))).flat();
    const seen = new Set<string>();
    const sources = found
      .filter((source) => !seen.has(source.url) && seen.add(source.url))
      .slice(0, MAX_SOURCES)
      .map((source) => ({
        ...source,
        content: source.content.slice(0, SOURCE_EXCERPT),
      }));

    await progress.done(
      "research",
      sources.length > 0
        ? `${sources.length} sources from ${queries.length} ${queries.length === 1 ? "search" : "searches"}`
        : "Nothing found, so the files lean on what you already have"
    );

    // ----- Voice -----
    await progress.start("voice");

    const samples = await findSimilarChunks({
      kind: "style",
      query: prompt,
      userId,
    });
    const tone = samples.length > 0 ? await extractToneMarkers(samples) : null;

    await progress.done(
      "voice",
      tone
        ? `From ${samples.length} passages of your writing`
        : "No writing samples yet, so a plain voice"
    );

    // ----- Doc -----
    await progress.start("doc");

    const written = await getChatModel("ultra", { temperature: 0.7 }).invoke([
      [
        "system",
        [
          ghostwriterPrompt(tone, samples),
          sources.length > 0 ? researchPrompt(sources, true) : null,
          known || null,
          `The plan for the document:\n${plan.doc}\n\nStart with a # title. A sheet and a slide deck are made from this document, so state each number once, plainly, with its unit.`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      ],
      ["human", prompt],
    ]);
    const markdown = withoutFences(written.text);

    if (!markdown) {
      throw new Error("The model wrote an empty document.");
    }

    await progress.done("doc", `${markdown.split(/\s+/).length} words`);

    // ----- Sheet and deck -----
    // Both are made from the document, so they say the same things, and they
    // do not depend on each other. Both are marked as started before either
    // request is sent, so neither can fail while nothing is waiting on it.
    await progress.start("sheet");
    await progress.start("deck");

    const sheetJob = getChatModel("super", { temperature: 0.1 })
      .withStructuredOutput(sheetSchema)
      .invoke([
        [
          "system",
          `You turn a document into a sheet of its facts and numbers. What the sheet tracks: ${plan.sheet}\n\nUse only numbers the document or the sources state, never new ones. In the Source column put the source number, like [2], or Doc when the number comes from the document alone.\n\nSources:\n${sourceList(sources) || "(none)"}`,
        ],
        ["human", markdown],
      ]);
    const deckJob = getChatModel("super", { temperature: 0.4 })
      .withStructuredOutput(deckSchema)
      .invoke([
        [
          "system",
          `You turn a document into a slide deck that tells the same story with the same numbers. The story: ${plan.deck}\n\nWrite it the way the document is written. Keep each point short enough to read from across a room.`,
        ],
        ["human", markdown],
      ]);
    const [sheet, deck] = await Promise.all([
      sheetJob.then(async (result) => {
        await progress.done(
          "sheet",
          `${Math.min(result.rows.length, MAX_ROWS)} rows`
        );

        return result;
      }),
      deckJob.then(async (result) => {
        await progress.done("deck", `${result.slides.length} slides`);

        return result;
      }),
    ]);
    const columns = sheet.columns.map((column) => column.trim()).filter(Boolean);
    const rows = [
      columns,
      ...sheet.rows
        .slice(0, MAX_ROWS)
        .map((row) => columns.map((_, index) => cell(row[index] ?? ""))),
    ];
    const slides = deck.slides
      .filter((slide) => slide.title.trim())
      .map((slide) => ({
        points: slide.points.slice(0, MAX_POINTS),
        title: slide.title.trim(),
      }));

    // ----- Link -----
    await progress.start("link");

    const pendingDoc: PendingDoc = {
      edits: [{ action: "insert", block: -1, markdown }],
      sources,
    };

    await db.insert(documents).values([
      { kind: "doc", pending: pendingDoc, runId, title, userId },
      {
        kind: "sheet",
        pending: sheetContent({ rows }),
        runId,
        title: `${title} figures`,
        userId,
      },
      {
        kind: "slides",
        pending: deckContent({ slides }),
        runId,
        title: `${title} deck`,
        userId,
      },
    ]);
    await progress.done("link", "Waiting for you to accept");
    await db
      .update(agentRuns)
      .set({ status: "done", updatedAt: new Date() })
      .where(eq(agentRuns.id, runId));

    return true;
  } catch (error) {
    console.error("suite agent failed:", error);

    await progress.fail().catch(() => undefined);

    await db
      .update(agentRuns)
      .set({
        error: "The agent stopped partway. Try again in a moment.",
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(agentRuns.id, runId));

    return false;
  }
}

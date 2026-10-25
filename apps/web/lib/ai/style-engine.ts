import { z } from "zod";
import { findSimilarChunks } from "@/lib/ai/embeddings";
import { getChatModel } from "@/lib/ai/nebius";
import {
  editPrompt,
  ghostwriterPrompt,
  knowledgePrompt,
  researchPrompt,
  toneAnalysisPrompt,
} from "@/lib/ai/prompts";
import { type Source, searchWeb } from "@/lib/ai/tavily";

const toneMarkersSchema = z.object({
  formality: z
    .string()
    .describe("How formal or casual the writing is, with a short example"),
  sentenceStructure: z
    .string()
    .describe("Typical sentence length, rhythm, punctuation and structure"),
  vocabulary: z
    .string()
    .describe("Word choice, jargon, favorite phrases and level of complexity"),
});

export function extractToneMarkers(samples: string[]) {
  return getChatModel("super", { temperature: 0 })
    .withStructuredOutput(toneMarkersSchema)
    .invoke(toneAnalysisPrompt(samples));
}

const editsSchema = z.object({
  reply: z
    .string()
    .describe(
      "What to say to the user, in Markdown: an answer to a question, or a short account of the changes"
    ),
  edits: z.array(
    z.object({
      action: z.enum(["insert", "replace", "delete"]),
      block: z
        .number()
        .int()
        .describe(
          "The number of the block to replace or delete, or to insert after (-1 for the start)"
        ),
      markdown: z
        .string()
        .describe("The new text as Markdown, empty when deleting"),
    })
  ),
});

export type Edit = z.infer<typeof editsSchema>["edits"][number];

export interface Turn {
  role: "assistant" | "user";
  text: string;
}

export async function suggestEdits({
  blocks,
  cite = false,
  history = [],
  prompt,
  research = false,
  sources,
  userId,
}: {
  blocks: string[];
  cite?: boolean;
  history?: Turn[];
  prompt: string;
  research?: boolean;
  sources?: Source[];
  userId: string;
}) {
  const [samples, known, found] = await Promise.all([
    findSimilarChunks({ kind: "style", query: prompt, userId }),
    findSimilarChunks({ kind: "context", limit: 6, query: prompt, userId }),
    sources
      ? { error: null, sources }
      : research
        ? searchSafely(prompt)
        : { error: null, sources: [] },
  ]);
  const toneMarkers =
    samples.length > 0 ? await extractToneMarkers(samples) : null;
  const system = [
    ghostwriterPrompt(toneMarkers, samples),
    known.length > 0 ? knowledgePrompt(known) : null,
    found.sources.length > 0 ? researchPrompt(found.sources, cite) : null,
    editPrompt(blocks),
  ]
    .filter(Boolean)
    .join("\n\n");
  const messages: ["ai" | "human" | "system", string][] = [
    ["system", system],
    ...history.map(({ role, text }): ["ai" | "human", string] => [
      role === "user" ? "human" : "ai",
      text,
    ]),
    ["human", prompt],
  ];
  const model = getChatModel("ultra", { temperature: 0.7 });
  let reply: string;
  let edits: Edit[];

  try {
    ({ edits, reply } = await model
      .withStructuredOutput(editsSchema)
      .invoke(messages));
  } catch (error) {
    console.error("edits failed:", error);

    const response = await model.invoke(messages);

    reply = response.text;
    edits = [];
  }

  return {
    edits,
    reply,
    researchError: found.error,
    sources: found.sources,
    toneMarkers,
  };
}

async function searchSafely(query: string) {
  try {
    return { error: null, sources: await searchWeb(query) };
  } catch (error) {
    console.error("research failed:", error);

    return {
      error: "Web search is unavailable, so this draft has no sources.",
      sources: [],
    };
  }
}

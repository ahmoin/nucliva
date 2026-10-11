import { z } from "zod";
import {
  editPrompt,
  ghostwriterPrompt,
  researchPrompt,
  toneAnalysisPrompt,
} from "@/lib/ai/prompts";
import { findSimilarChunks } from "@/lib/embeddings";
import { getChatModel } from "@/lib/nebius";
import { type Source, searchWeb } from "@/lib/tavily";

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

// Answers the user, and carries out what they asked on their document, written
// in their voice, as edits to its blocks.
export async function suggestEdits({
  blocks,
  cite = false,
  history = [],
  prompt,
  research = false,
  sources,
  userId,
}: {
  // The document as text, one entry per top-level block.
  blocks: string[];
  // Mark in the text where each claim came from.
  cite?: boolean;
  // What was said before in this conversation.
  history?: Turn[];
  prompt: string;
  // Search the web first and write from what it finds.
  research?: boolean;
  // What a search already found, when the caller has searched itself.
  sources?: Source[];
  userId: string;
}) {
  // The search and the look at the user's style do not depend on each other.
  const [samples, found] = await Promise.all([
    findSimilarChunks({ kind: "style", query: prompt, userId }),
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
    found.sources.length > 0 ? researchPrompt(found.sources, cite) : null,
    editPrompt(blocks),
  ]
    .filter(Boolean)
    .join("\n\n");
  const messages: ["ai" | "human" | "system", string][] = [
    ["system", system],
    ...history.map(
      ({ role, text }): ["ai" | "human", string] => [
        role === "user" ? "human" : "ai",
        text,
      ]
    ),
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
    // A model that cannot give edits as data still answers. Its words are the
    // reply, and nothing is written into the document without being asked.
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

// A search that fails leaves a draft without sources, not no draft.
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

import { z } from "zod";
import { findSimilarChunks } from "@/lib/embeddings";
import { getChatModel } from "@/lib/nebius";

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
    .invoke(
      `Analyze the tone of the author of these writing samples.\n\n${samples.join("\n---\n")}`
    );
}

export async function writeInUserVoice({
  prompt,
  userId,
}: {
  prompt: string;
  userId: string;
}) {
  const samples = await findSimilarChunks({
    kind: "style",
    query: prompt,
    userId,
  });
  const toneMarkers =
    samples.length > 0 ? await extractToneMarkers(samples) : null;

  const system = toneMarkers
    ? `You are a ghostwriter. Write the requested draft in the author's own voice.

Tone markers:
- Formality: ${toneMarkers.formality}
- Sentence structure: ${toneMarkers.sentenceStructure}
- Vocabulary: ${toneMarkers.vocabulary}

Excerpts of the author's real writing:
${samples.join("\n---\n")}

Match the voice, but never copy sentences from the excerpts and never mention this analysis. Reply with the draft only, no options or commentary.`
    : "You are a ghostwriter. Write the requested draft clearly and naturally. Reply with the draft only, no options or commentary.";

  const response = await getChatModel("ultra", { temperature: 0.7 }).invoke([
    ["system", system],
    ["human", prompt],
  ]);

  return { draft: response.text, toneMarkers };
}

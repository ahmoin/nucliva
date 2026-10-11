import { z } from "zod";
import { ghostwriterPrompt, toneAnalysisPrompt } from "@/lib/ai/prompts";
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
    .invoke(toneAnalysisPrompt(samples));
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

  const response = await getChatModel("ultra", { temperature: 0.7 }).invoke([
    ["system", ghostwriterPrompt(toneMarkers, samples)],
    ["human", prompt],
  ]);

  return { draft: response.text, toneMarkers };
}

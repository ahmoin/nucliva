import { ChatOpenAI } from "@langchain/openai";

export const NEBIUS_BASE_URL = "https://api.studio.nebius.com/v1";

const MODELS = {
  nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  super: "nvidia/nemotron-3-super-120b-a12b",
  ultra: "nvidia/Nemotron-3-Ultra-550b-a55b",
} as const;

// The Nemotron models think before they answer unless told not to, which is
// what makes a short reply take ten seconds. Turning thinking off is passed to
// the chat template of the server.
export const getChatModel = (
  tier: keyof typeof MODELS,
  options?: { maxTokens?: number; temperature?: number; thinking?: boolean }
) =>
  new ChatOpenAI({
    apiKey: process.env.NEBIUS_API_KEY,
    configuration: { baseURL: NEBIUS_BASE_URL },
    maxTokens: options?.maxTokens,
    model: MODELS[tier],
    modelKwargs:
      options?.thinking === false
        ? { chat_template_kwargs: { enable_thinking: false } }
        : undefined,
    temperature: options?.temperature,
  });

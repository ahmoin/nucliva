import { ChatOpenAI } from "@langchain/openai";

export const NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1";

const MODELS = {
  nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  super: "nvidia/nemotron-3-super-120b-a12b",
  ultra: "nvidia/Nemotron-3-Ultra-550b-a55b",
} as const;

// Nemotron thinks by default (slow); enable_thinking must go via chat_template_kwargs.
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

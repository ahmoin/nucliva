import { ChatOpenAI } from "@langchain/openai";

export const NEBIUS_BASE_URL = "https://api.studio.nebius.com/v1";

const MODELS = {
  nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  super: "nvidia/nemotron-3-super-120b-a12b",
  ultra: "nvidia/Nemotron-3-Ultra-550b-a55b",
} as const;

export const getChatModel = (
  tier: keyof typeof MODELS,
  options?: { temperature?: number }
) =>
  new ChatOpenAI({
    apiKey: process.env.NEBIUS_API_KEY,
    configuration: { baseURL: NEBIUS_BASE_URL },
    model: MODELS[tier],
    temperature: options?.temperature,
  });

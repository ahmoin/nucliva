export const partners = [
  {
    description:
      "Every model call goes through Nebius Token Factory's OpenAI compatible API, and so does the embedding model that makes your writing searchable.",
    name: "Nebius Token Factory",
    role: "Runs the models",
  },
  {
    description:
      "Three Nemotron models share the work: Ultra for drafts and edits, Super for reading your tone, and Nano for fast autocomplete.",
    name: "NVIDIA Nemotron",
    role: "The models",
  },
  {
    description:
      "When you ask Nucliva to research something, Tavily runs the web search. The results become the sources you see next to the answer.",
    name: "Tavily",
    role: "Searches the web",
  },
  {
    description:
      "LangChain connects the pieces: chat models, structured output for edits, text splitting and embeddings, and the search tool.",
    name: "LangChain",
    role: "Wires it together",
  },
];

export const models = [
  {
    job: "Writes drafts and suggests edits, with reasoning behind each change",
    name: "Nemotron 3 Ultra",
  },
  {
    job: "Reads what you have written and describes your tone, rhythm and word choice",
    name: "Nemotron 3 Super",
  },
  {
    job: "Finishes your sentence as you type, fast enough to feel instant",
    name: "Nemotron 3 Nano",
  },
  {
    job: "Turns your writing into searchable vectors, so drafts can find what matters",
    name: "Qwen3 Embedding 8B",
  },
];

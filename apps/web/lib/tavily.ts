import { TavilySearch } from "@langchain/tavily";

export const getSearchTool = () =>
  new TavilySearch({
    includeAnswer: true,
    maxResults: 5,
    searchDepth: "advanced",
    tavilyApiKey: process.env.TAVILY_API_KEY,
  });

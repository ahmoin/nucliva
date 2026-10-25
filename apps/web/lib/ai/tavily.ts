import { TavilySearch } from "@langchain/tavily";

export interface Source {
  content: string;
  title: string;
  url: string;
}

export const getSearchTool = () =>
  new TavilySearch({
    includeAnswer: true,
    maxResults: 5,
    searchDepth: "advanced",
    tavilyApiKey: process.env.TAVILY_API_KEY,
  });

export async function searchWeb(query: string): Promise<Source[]> {
  const response = await getSearchTool().invoke({ query });

  if (!("results" in response)) {
    throw new Error(response.error);
  }

  const results: Partial<Source>[] = response.results;

  return results.flatMap(({ content, title, url }) =>
    url
      ? [{ content: content ?? "", title: title || new URL(url).hostname, url }]
      : []
  );
}

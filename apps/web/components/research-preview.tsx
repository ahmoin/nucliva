"use client";

import {
  Source as SourceLink,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { ChatMarkdown } from "@/components/chat-markdown";
import { SiteIcon } from "@/components/document-chat";

const sources = [
  { title: "Nebius Token Factory", url: "https://tokenfactory.nebius.com" },
  {
    title: "NVIDIA Nemotron",
    url: "https://www.nvidia.com/en-us/ai-data-science/foundation-models/nemotron/",
  },
  { title: "Tavily", url: "https://tavily.com" },
];

const question = "Research the stack Nucliva runs on, with sources";

const answer = `Nucliva writes with **NVIDIA Nemotron** models [[2]](${sources[1]?.url}), served through the OpenAI compatible API of **Nebius Token Factory** [[1]](${sources[0]?.url}). When a request needs facts, it searches the live web with **Tavily** [[3]](${sources[2]?.url}) and writes from what it finds.`;

// A research answer as the chat shows it, made of the same parts: the search
// step with the sites it found, the answer with its numbered sources, and the
// list of sources under it.
export function ResearchPreview() {
  return (
    <div className="flex flex-col gap-4 p-5 text-left">
      <div className="flex flex-col items-end gap-1">
        <span className="text-muted-foreground text-xs">You</span>
        <div className="max-w-[92%] bg-primary/15 px-3 py-2 text-sm">
          {question}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-muted-foreground text-xs">Nucliva</span>
        <Task>
          <TaskTrigger title={`Found ${sources.length} sources`} />
          <TaskContent>
            {sources.map((source) => (
              <TaskItem key={source.url}>
                <TaskItemFile>
                  <SiteIcon url={source.url} />
                  {new URL(source.url).hostname}
                </TaskItemFile>
              </TaskItem>
            ))}
          </TaskContent>
        </Task>
        <div className="text-sm">
          <ChatMarkdown markdown={answer} />
        </div>
        <Sources className="text-xs" defaultOpen>
          <SourcesTrigger count={sources.length}>
            <span className="flex -space-x-1.5">
              {sources.map((source) => (
                <SiteIcon
                  className="size-5 border"
                  key={source.url}
                  url={source.url}
                />
              ))}
            </span>
            <p className="font-medium">{sources.length} sources</p>
          </SourcesTrigger>
          <SourcesContent>
            {sources.map((source) => (
              <SourceLink href={source.url} key={source.url}>
                <SiteIcon url={source.url} />
                <span className="block font-medium">{source.title}</span>
              </SourceLink>
            ))}
          </SourcesContent>
        </Sources>
      </div>
    </div>
  );
}

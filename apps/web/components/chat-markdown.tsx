import type { ReactNode } from "react";

const inlinePattern =
  /(\*\*(?<bold>[^*]+)\*\*|\*(?<italic>[^*]+)\*|`(?<code>[^`]+)`|\[(?<label>[^\]]+)\]\((?<href>[^)\s]+)\))/g;

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const { bold, code, href, italic, label } = match.groups ?? {};
    const at = match.index ?? 0;

    if (at > last) {
      nodes.push(text.slice(last, at));
    }

    if (bold) {
      nodes.push(<strong key={at}>{inline(bold)}</strong>);
    } else if (italic) {
      nodes.push(<em key={at}>{inline(italic)}</em>);
    } else if (code) {
      nodes.push(
        <code className="bg-muted px-1 font-mono text-[0.9em]" key={at}>
          {code}
        </code>
      );
    } else if (label && href) {
      nodes.push(
        <a
          className="text-primary underline underline-offset-2"
          href={href}
          key={at}
          rel="noreferrer"
          target="_blank"
        >
          {label}
        </a>
      );
    }

    last = at + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

interface Block {
  items?: string[];
  ordered?: boolean;
  text?: string;
  type: "break" | "heading" | "list" | "paragraph";
}

function parse(markdown: string) {
  const blocks: Block[] = [];

  for (const line of markdown.split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const item = line.match(/^\s*(?:([-*])|(\d+)\.)\s+(.*)$/);
    const last = blocks.at(-1);

    if (heading) {
      blocks.push({ text: heading[1], type: "heading" });
    } else if (item) {
      const ordered = Boolean(item[2]);

      if (last?.type === "list" && last.ordered === ordered) {
        last.items?.push(item[3] ?? "");
      } else {
        blocks.push({ items: [item[3] ?? ""], ordered, type: "list" });
      }
    } else if (line.trim()) {
      if (last?.type === "paragraph") {
        last.text = `${last.text}\n${line.trim()}`;
      } else {
        blocks.push({ text: line.trim(), type: "paragraph" });
      }
    } else {
      blocks.push({ type: "break" });
    }
  }

  return blocks.filter((block) => block.type !== "break");
}

export function ChatMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-2 leading-6">
      {parse(markdown).map((block, index) => {
        if (block.type === "heading") {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: the blocks have no identity beyond their place
            <p className="font-semibold" key={index}>
              {inline(block.text ?? "")}
            </p>
          );
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";

          return (
            <List
              className={`pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
              // biome-ignore lint/suspicious/noArrayIndexKey: the blocks have no identity beyond their place
              key={index}
            >
              {block.items?.map((item, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the items have no identity beyond their place
                <li key={at}>{inline(item)}</li>
              ))}
            </List>
          );
        }

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: the blocks have no identity beyond their place
          <p className="whitespace-pre-wrap" key={index}>
            {inline(block.text ?? "")}
          </p>
        );
      })}
    </div>
  );
}

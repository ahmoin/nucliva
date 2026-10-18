import {
  FileTextIcon,
  LinkSimpleIcon,
  PresentationChartIcon,
  TableIcon,
} from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import type { RunFile } from "@/lib/agents/steps";

const icons = {
  doc: FileTextIcon,
  sheet: TableIcon,
  slides: PresentationChartIcon,
};

// The files an agent made together, one click from each other.
export function SuiteLinks({
  current,
  files,
}: {
  current: string;
  files: RunFile[];
}) {
  if (files.length < 2) {
    return null;
  }

  return (
    <nav
      aria-label="Files made together"
      className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-2 text-muted-foreground text-xs"
    >
      <LinkSimpleIcon className="size-4" />
      <span>Made together</span>
      {files.map((file) => {
        const Icon = icons[file.kind];

        return (
          <Button
            aria-current={file.id === current ? "page" : undefined}
            className="normal-case tracking-normal aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
            key={file.id}
            nativeButton={false}
            render={<Link href={file.href} />}
            size="xs"
            variant="ghost"
          >
            <Icon />
            {file.title}
          </Button>
        );
      })}
    </nav>
  );
}

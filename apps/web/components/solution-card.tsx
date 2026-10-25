import {
  FileTextIcon,
  PresentationChartIcon,
  TableIcon,
} from "@phosphor-icons/react/ssr";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { SolutionPreview } from "@/components/solution-preview";
import {
  categoryOf,
  detailOf,
  type Kind,
  type Solution,
  solutionPath,
} from "@/lib/content/solutions";

export const kindIcons: Record<Kind, typeof FileTextIcon> = {
  Doc: FileTextIcon,
  Sheet: TableIcon,
  Slides: PresentationChartIcon,
};

export function SolutionCard({ solution }: { solution: Solution }) {
  const line = categoryOf(solution.category);
  const KindIcon = kindIcons[solution.kind];

  return (
    <Link
      className="group flex h-full flex-col bg-background transition-colors hover:bg-muted/30"
      href={solutionPath(solution)}
    >
      <SolutionPreview
        kind={solution.kind}
        prompt={detailOf(solution.slug)?.prompt}
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{solution.title}</span>
          <span className="text-muted-foreground text-sm">
            {solution.summary}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5 border bg-muted/50 px-2 py-1">
            <span className={cn("size-1.5 rounded-full", line?.dot)} />
            {line?.name}
          </span>
          <span className="flex items-center gap-1.5 border bg-muted/50 px-2 py-1">
            <KindIcon className="size-3" />
            {solution.kind}
          </span>
        </div>
      </div>
    </Link>
  );
}

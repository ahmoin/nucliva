"use client";

import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { SolutionCard } from "@/components/solution-card";
import { TypingHint } from "@/components/typing-hint";
import {
  categories,
  categoryOf,
  type Solution,
  solutions,
} from "@/lib/solutions";

const matches = (solution: Solution, query: string) =>
  `${solution.title} ${solution.summary} ${solution.kind} ${categoryOf(solution.category)?.name}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());

// A catalog of what Nucliva writes, which can be searched and narrowed to one
// line of work.
export function SolutionsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      solutions.filter(
        (solution) =>
          (category === null || solution.category === category) &&
          matches(solution, query)
      ),
    [category, query]
  );
  // The results by the line of work they belong to, leaving out the empty ones.
  const groups = useMemo(
    () =>
      categories
        .map((line) => ({
          items: shown.filter((solution) => solution.category === line.slug),
          line,
        }))
        .filter((group) => group.items.length > 0),
    [shown]
  );

  const handleQuery = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setQuery(event.target.value),
    []
  );
  const pick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const { category: picked } = event.currentTarget.dataset;

      // Picking the one that is already picked lets go of it.
      setCategory((current) => (current === picked ? null : (picked ?? null)));
    },
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="group relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            aria-label="Search solutions"
            className="h-14 pl-13 text-base shadow-[0_0_0_0_var(--primary)] transition-shadow duration-300 focus-visible:shadow-[0_0_32px_-8px_var(--primary)]"
            onChange={handleQuery}
            value={query}
          />
          {query === "" ? (
            <TypingHint className="pointer-events-none absolute top-1/2 left-13 -translate-y-1/2 text-base text-muted-foreground" />
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((item) => (
          <button
            aria-pressed={category === item.slug}
            className="flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-1.5 text-sm transition-colors hover:bg-muted aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
            data-category={item.slug}
            key={item.slug}
            onClick={pick}
            type="button"
          >
            <span className={cn("size-1.5 rounded-full", item.dot)} />
            {item.name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="border border-dashed py-16 text-center text-muted-foreground text-sm">
          Nothing matches "{query}". Try a different word, or clear the filter.
        </p>
      ) : (
        <div className="flex flex-col gap-16 pt-6">
          {groups.map(({ items, line }) => (
            <section
              className="grid gap-6 motion-safe:fade-in-0 motion-safe:animate-in motion-safe:duration-300 lg:grid-cols-[15rem_1fr] lg:gap-10"
              key={line.slug}
            >
              <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
                <h2 className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                  <span className={cn("size-2 rounded-full", line.dot)} />
                  {line.name}
                </h2>
                <p className="text-muted-foreground text-sm">{line.blurb}</p>
                <Link
                  className="flex w-fit items-center gap-1 border-foreground border-b text-sm"
                  href={`/solutions/${line.slug}`}
                >
                  Nucliva for {line.name.toLowerCase()}
                  <ArrowRightIcon />
                </Link>
              </div>
              <ul className="grid gap-px border bg-border sm:grid-cols-2 xl:grid-cols-3">
                {items.map((solution) => (
                  <li key={solution.slug}>
                    <SolutionCard solution={solution} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

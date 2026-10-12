"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useCallback, useState } from "react";
import { SolutionPreview } from "@/components/solution-preview";
import {
  categories,
  detailOf,
  solutionPath,
  solutionsIn,
} from "@/lib/content/solutions";

// The lines of work Nucliva is for, as a list that opens one at a time: what
// the work is, what Nucliva does in it, and a few things it writes there.
export function SolutionsShowcase() {
  const [active, setActive] = useState(0);
  const category = categories[active] ?? categories[0];
  const examples = category ? solutionsIn(category.slug) : [];

  const open = useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement>) =>
      setActive(Number(event.currentTarget.dataset.index)),
    []
  );

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
            A workspace for serious work
            <span className="block text-muted-foreground">
              in every discipline.
            </span>
          </h2>
        </div>
        <div>
          <Button
            nativeButton={false}
            render={<Link href="/solutions" />}
            size="lg"
          >
            Explore solutions
            <ArrowRightIcon />
          </Button>
        </div>
        {examples[0] ? (
          <div
            className="group hidden border bg-card lg:block"
            key={category?.slug}
          >
            <div className="flex items-center gap-2 border-b px-4 py-2 text-muted-foreground text-xs">
              <span className={cn("size-1.5 rounded-full", category?.dot)} />
              {category?.name}
            </div>
            <SolutionPreview
              className="border-b-0 motion-safe:fade-in-0 motion-safe:animate-in motion-safe:duration-300"
              kind={examples[0].kind}
              prompt={detailOf(examples[0].slug)?.prompt}
            />
          </div>
        ) : null}
      </div>
      <ul className="flex flex-col border-t">
        {categories.map((item, index) => {
          const isOpen = index === active;

          return (
            <li className="border-b" key={item.slug}>
              <button
                aria-expanded={isOpen}
                className="group flex w-full items-baseline gap-6 py-5 text-left outline-none transition-colors focus-visible:bg-muted/50"
                data-index={index}
                onClick={open}
                onFocus={open}
                onMouseEnter={open}
                type="button"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 self-center rounded-full transition-all duration-300",
                    item.dot,
                    isOpen ? "scale-125" : "scale-75 opacity-50"
                  )}
                />
                <span
                  className={cn(
                    "text-2xl tracking-tight transition-colors",
                    isOpen
                      ? "font-medium text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.name}
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-5 pb-6 pl-6">
                    <p className="max-w-xl text-muted-foreground">
                      {item.blurb}
                    </p>
                    <ul className="flex flex-wrap gap-2 text-sm">
                      {solutionsIn(item.slug).map((solution) => (
                        <li key={solution.slug}>
                          <Link
                            className="border bg-muted/40 px-3 py-1.5 transition-colors hover:bg-muted"
                            href={solutionPath(solution)}
                            tabIndex={isOpen ? 0 : -1}
                          >
                            {solution.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      className="w-fit border-foreground border-b text-sm"
                      href={`/solutions/${item.slug}`}
                      tabIndex={isOpen ? 0 : -1}
                    >
                      Nucliva for {item.name}
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

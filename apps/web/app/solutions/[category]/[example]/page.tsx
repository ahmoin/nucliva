import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hotkeys } from "@/components/hotkeys";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { kindIcons, SolutionCard } from "@/components/solution-card";
import { SolutionPreview } from "@/components/solution-preview";
import {
  detailOf,
  findCategory,
  findSolution,
  solutionPath,
  solutions,
  solutionsIn,
} from "@/lib/solutions";

type Props = { params: Promise<{ category: string; example: string }> };

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

// The same three steps for every solution, because that is how Nucliva works.
const steps = [
  {
    body: "Say what you need in plain words, and add notes, files or a link if you have them.",
    title: "Ask",
  },
  {
    body: "Nucliva researches the web when it helps, learns your voice and writes the draft.",
    title: "Draft",
  },
  {
    body: "Every change shows up in your document. Accept the ones you like, reject the rest.",
    title: "Review",
  },
];

export const generateStaticParams = () =>
  solutions.map((solution) => ({
    category: solution.category,
    example: solution.slug,
  }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, example } = await params;
  const solution = findSolution(category, example);

  return solution
    ? { description: solution.summary, title: solution.title }
    : {};
}

export default async function SolutionPage({ params }: Props) {
  const { category: categorySlug, example } = await params;
  const solution = findSolution(categorySlug, example);
  const category = findCategory(categorySlug);

  if (!(solution && category)) {
    notFound();
  }

  const detail = detailOf(solution.slug);
  const KindIcon = kindIcons[solution.kind];
  const more = solutionsIn(category.slug).filter(
    (item) => item.slug !== solution.slug
  );

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pt-12 pb-24 md:pt-16">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm"
        >
          <Link className="hover:text-foreground" href="/solutions">
            Solutions
          </Link>
          <span>/</span>
          <Link
            className="hover:text-foreground"
            href={`/solutions/${category.slug}`}
          >
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{solution.title}</span>
        </nav>
        <section className="grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className={`flex flex-wrap gap-2 text-xs ${enter}`}>
              <span className="flex items-center gap-1.5 border bg-muted/50 px-2 py-1 text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", category.dot)} />
                {category.name}
              </span>
              <span className="flex items-center gap-1.5 border bg-muted/50 px-2 py-1 text-muted-foreground">
                <KindIcon className="size-3" />
                {solution.kind}
              </span>
            </div>
            <h1
              className={`text-balance font-bold text-5xl tracking-tighter delay-100 md:text-6xl ${enter}`}
            >
              {solution.title}
            </h1>
            <p
              className={`max-w-xl text-balance text-lg text-muted-foreground delay-200 md:text-xl ${enter}`}
            >
              {solution.summary}. {category.blurb}
            </p>
            <div className={`flex flex-wrap gap-3 delay-300 ${enter}`}>
              <Button
                className="h-11 px-6"
                nativeButton={false}
                render={<Link href="/signup" />}
                size="lg"
              >
                Try it free
                <ArrowRightIcon />
              </Button>
              <Button
                className="h-11 px-6"
                nativeButton={false}
                render={<Link href={`/solutions/${category.slug}`} />}
                size="lg"
                variant="outline"
              >
                More for {category.name.toLowerCase()}
              </Button>
            </div>
          </div>
          <div className={`group border delay-200 ${enter}`}>
            <SolutionPreview kind={solution.kind} prompt={detail?.prompt} />
            <div className="border-t px-4 py-2 text-muted-foreground text-xs">
              A {solution.kind.toLowerCase()} made by Nucliva
            </div>
          </div>
        </section>
        {detail ? (
          <section className="grid gap-10 border-t pt-12 md:grid-cols-2 md:gap-16">
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-xl tracking-tight">
                Try asking
              </h2>
              <p className="border bg-muted/40 p-5 font-mono text-sm leading-relaxed">
                {detail.prompt}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-semibold text-xl tracking-tight">
                What you get
              </h2>
              <ul className="flex flex-col gap-3">
                {detail.includes.map((item) => (
                  <li className="flex items-start gap-3" key={item}>
                    <CheckIcon className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        <section className="flex flex-col gap-8 border-t pt-12">
          <h2 className="font-semibold text-xl tracking-tight">How it works</h2>
          <ol className="grid gap-px border bg-border md:grid-cols-3">
            {steps.map((step) => (
              <li
                className="flex flex-col gap-2 bg-background p-6"
                key={step.title}
              >
                <span className="font-medium text-lg">{step.title}</span>
                <span className="text-muted-foreground text-sm">
                  {step.body}
                </span>
              </li>
            ))}
          </ol>
        </section>
        {more.length > 0 ? (
          <section className="flex flex-col gap-8 border-t pt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-bold text-2xl tracking-tight">
                More for {category.name.toLowerCase()}
              </h2>
              <Link
                className="flex items-center gap-1 text-primary text-sm hover:underline"
                href={`/solutions/${category.slug}`}
              >
                See all
                <ArrowRightIcon />
              </Link>
            </div>
            <ul className="grid gap-px border bg-border sm:grid-cols-2">
              {more.map((item) => (
                <li key={solutionPath(item)}>
                  <SolutionCard solution={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

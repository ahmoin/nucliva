import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hotkeys } from "@/components/hotkeys";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { SolutionCard } from "@/components/solution-card";
import { categories, findCategory, solutionsIn } from "@/lib/content/solutions";

type Props = { params: Promise<{ category: string }> };

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

export const generateStaticParams = () =>
  categories.map((category) => ({ category: category.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategory((await params).category);

  return category
    ? { description: category.blurb, title: `Nucliva for ${category.name}` }
    : {};
}

export default async function CategoryPage({ params }: Props) {
  const category = findCategory((await params).category);

  if (!category) {
    notFound();
  }

  const items = solutionsIn(category.slug);

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 pt-12 pb-24 md:pt-16">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-muted-foreground text-sm"
        >
          <Link className="hover:text-foreground" href="/solutions">
            Solutions
          </Link>
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>
        <section className="flex flex-col gap-6">
          <span
            className={`flex w-fit items-center gap-2 border bg-muted/40 px-3 py-1 text-sm ${enter}`}
          >
            <span className={cn("size-2 rounded-full", category.dot)} />
            {category.name}
          </span>
          <h1
            className={`text-balance font-bold text-5xl tracking-tighter delay-100 md:text-6xl ${enter}`}
          >
            Nucliva for
            <span className="block text-muted-foreground">
              {category.name.toLowerCase()}.
            </span>
          </h1>
          <p
            className={`max-w-2xl text-balance text-lg text-muted-foreground delay-200 md:text-xl ${enter}`}
          >
            {category.blurb}
          </p>
        </section>
        <ul className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {items.map((solution) => (
            <li key={solution.slug}>
              <SolutionCard solution={solution} />
            </li>
          ))}
        </ul>
        <section className="flex flex-col gap-4 border-t pt-10">
          <span className="text-muted-foreground text-xs uppercase tracking-widest">
            Other lines of work
          </span>
          <ul className="flex flex-wrap gap-2 text-sm">
            {categories
              .filter((item) => item.slug !== category.slug)
              .map((item) => (
                <li key={item.slug}>
                  <Link
                    className="flex items-center gap-2 border bg-muted/40 px-3 py-1.5 transition-colors hover:bg-muted"
                    href={`/solutions/${item.slug}`}
                  >
                    <span className={cn("size-1.5 rounded-full", item.dot)} />
                    {item.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
        <section className="flex flex-col items-center gap-6 border-t pt-16 text-center">
          <h2 className="max-w-xl text-balance font-bold text-3xl tracking-tight md:text-4xl">
            Start with one, then make it yours.
          </h2>
          <Button
            className="h-11 px-6"
            nativeButton={false}
            render={<Link href="/signup" />}
            size="lg"
          >
            Get started free
            <ArrowRightIcon />
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

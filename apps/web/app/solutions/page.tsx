import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { Hotkeys } from "@/components/hotkeys";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { SolutionsExplorer } from "@/components/solutions-explorer";

export const metadata: Metadata = {
  description:
    "Investor updates, proposals, reports, study guides and more. See what Nucliva writes for you, in your own voice.",
  title: "Solutions",
};

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

export default function SolutionsPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pt-16 pb-24 md:pt-24">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1
            className={`text-balance font-bold text-5xl tracking-tighter md:text-7xl ${enter}`}
          >
            Ready-made help for
            <span className="block text-muted-foreground">
              every kind of writing.
            </span>
          </h1>
          <p
            className={`max-w-2xl text-balance text-lg text-muted-foreground delay-100 md:text-xl ${enter}`}
          >
            Everything Nucliva already knows how to write. Each one learns your
            voice, researches what it needs and hands back a doc, a deck or a
            sheet you can edit.
          </p>
        </section>
        <SolutionsExplorer />
        <section className="flex flex-col items-center gap-6 border-t pt-16 text-center">
          <h2 className="max-w-xl text-balance font-bold text-3xl tracking-tight md:text-4xl">
            Not here? Ask for it in plain words.
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

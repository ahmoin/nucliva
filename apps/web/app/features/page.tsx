import {
  ArrowRightIcon,
  ChatsCircleIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  KeyboardIcon,
  MicrophoneStageIcon,
  PencilSimpleLineIcon,
  RulerIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hotkeys } from "@/components/hotkeys";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { features } from "@/lib/content/features";

export const metadata: Metadata = {
  description:
    "Everything Nucliva does: it learns your voice, researches the web, shows every change as a suggestion, and keeps docs, slides and sheets in one place.",
  title: "Features",
};

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

// The icon for each feature in lib/content/features.ts, in the same order.
const icons = [
  MicrophoneStageIcon,
  GlobeIcon,
  PencilSimpleLineIcon,
  ChatsCircleIcon,
  KeyboardIcon,
  RulerIcon,
  FileTextIcon,
  DatabaseIcon,
  SquaresFourIcon,
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-20 text-center md:pt-28">
          <h1
            className={`max-w-4xl text-balance font-bold text-5xl tracking-tighter md:text-7xl ${enter}`}
          >
            Everything you need
            <span className="block text-muted-foreground">
              to write like yourself.
            </span>
          </h1>
          <p
            className={`max-w-2xl text-balance text-lg text-muted-foreground delay-100 md:text-xl ${enter}`}
          >
            An editor, an assistant that knows your voice, and a way to check
            every change before it goes in.
          </p>
          <div className={`flex flex-wrap justify-center gap-3 delay-200 ${enter}`}>
            <Button
              className="h-11 px-6"
              nativeButton={false}
              render={<Link href="/signup" />}
              size="lg"
            >
              Get started free
              <ArrowRightIcon />
            </Button>
            <Button
              className="h-11 px-6"
              nativeButton={false}
              render={<Link href="/solutions" />}
              size="lg"
              variant="outline"
            >
              See solutions
            </Button>
          </div>
        </section>
        <section className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-8 md:pt-20">
          <div
            aria-hidden
            className="absolute inset-x-12 top-1/2 h-2/3 -translate-y-1/2 bg-primary/15 blur-3xl"
          />
          <Reveal className="relative">
            <div
              className="border bg-card/50 p-2 shadow-[0_0_80px_-30px_var(--primary)]"
              data-reveal
            >
              <Image
                alt="The Nucliva editor with the assistant's suggested changes marked in the document"
                className="h-auto w-full"
                height={805}
                priority
                src="/brand/editor-shot.png"
                width={1284}
              />
            </div>
          </Reveal>
        </section>
        <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
          <Reveal className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="flex flex-col gap-5" data-reveal>
              <h2 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
                <span className="text-primary">Suggestions,</span> not surprises
              </h2>
              <p className="text-balance text-lg text-muted-foreground">
                Nucliva never quietly rewrites your work. It shows what it would
                change, right where it would change it, and waits for you to
                say yes.
              </p>
            </div>
            <div
              className="border bg-card/50 p-2 shadow-[0_0_60px_-30px_var(--primary)]"
              data-reveal
            >
              <div className="flex flex-col gap-5 border bg-background p-6">
                <p className="leading-relaxed">
                  Revenue grew{" "}
                  <span className="bg-red-500/20 px-1 text-red-600 line-through dark:text-red-400">
                    12%
                  </span>{" "}
                  <span className="bg-emerald-500/20 px-1 text-emerald-700 dark:text-emerald-400">
                    18%
                  </span>{" "}
                  month over month, led by{" "}
                  <span className="bg-emerald-500/20 px-1 text-emerald-700 dark:text-emerald-400">
                    three new enterprise teams
                  </span>{" "}
                  and a steadier trial to paid rate.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-primary px-3 py-2 font-medium text-primary-foreground uppercase tracking-wider">
                    Accept
                  </span>
                  <span className="border px-3 py-2 font-medium uppercase tracking-wider">
                    Reject
                  </span>
                  <span className="ml-auto font-mono text-muted-foreground">
                    1 / 3
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
        <section className="border-y bg-muted/20">
          <Reveal className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
            <div
              className="order-2 border bg-card/50 p-2 shadow-[0_0_60px_-30px_var(--primary)] lg:order-1"
              data-reveal
            >
              <div className="flex flex-col divide-y border bg-background">
                {[
                  ["Sentence length", "Short, punchy"],
                  ["Tone", "Direct, warm"],
                  ["Vocabulary", "Plain, no jargon"],
                  ["Voice match", "96%"],
                ].map(([name, value], index, rows) => (
                  <div
                    className={`flex items-center justify-between gap-4 px-5 py-4 text-sm ${index === rows.length - 1 ? "bg-primary/5" : ""}`}
                    key={name}
                  >
                    <span className="text-muted-foreground">{name}</span>
                    <span
                      className={`font-medium ${index === rows.length - 1 ? "text-primary" : ""}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 flex flex-col gap-5 lg:order-2" data-reveal>
              <h2 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
                <span className="text-primary">Your voice,</span> not a
                chatbot&apos;s
              </h2>
              <p className="text-balance text-lg text-muted-foreground">
                Give it a few things you have written and it picks up how you
                sound. The next draft reads like you wrote it on a good day.
              </p>
            </div>
          </Reveal>
        </section>
        <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
          <Reveal className="flex flex-col gap-12">
            <h2
              className="max-w-2xl text-balance font-bold text-4xl tracking-tight md:text-5xl"
              data-reveal
            >
              All of it, in one place
            </h2>
            <ul
              className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3"
              data-reveal
            >
              {features.map(({ description, title }, index) => {
                const Icon = icons[index] ?? SquaresFourIcon;

                return (
                  <li
                    className="flex flex-col gap-3 bg-background p-6"
                    key={title}
                  >
                    <Icon className="size-6 text-primary" />
                    <h3 className="font-semibold text-lg tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </section>
        <section className="flex flex-col items-center gap-6 border-t px-6 py-24 text-center">
          <h2 className="max-w-xl text-balance font-bold text-3xl tracking-tight md:text-5xl">
            See it work on something real.
          </h2>
          <Button
            className="h-11 px-6"
            nativeButton={false}
            render={<Link href="/solutions" />}
            size="lg"
          >
            Try a solution
            <ArrowRightIcon />
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

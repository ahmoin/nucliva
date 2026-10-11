import { ArrowRightIcon, GithubLogoIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { Hotkeys } from "@/components/hotkeys";
import { type Partner, PartnerLogo } from "@/components/partner-logo";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { repoUrl } from "@/lib/site";

export const metadata: Metadata = {
  description:
    "Nucliva runs on NVIDIA Nemotron models served by Nebius Token Factory, searches the web with Tavily and is wired together with LangChain.",
  title: "Built with",
};

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

const partners: (Partner & { description: string; role: string })[] = [
  {
    darkLogo: "/logos/nebius.svg",
    description:
      "Every model call goes through Nebius Token Factory's OpenAI compatible API, and so does the embedding model that makes your writing searchable.",
    height: 36,
    lightLogo: "/logos/nebius.svg",
    name: "Nebius Token Factory",
    role: "Runs the models",
    width: 131,
  },
  {
    darkLogo: "/logos/nvidia-dark.svg",
    description:
      "Three Nemotron models share the work: Ultra for drafts and edits, Super for reading your tone, and Nano for fast autocomplete.",
    height: 180,
    lightLogo: "/logos/nvidia.svg",
    name: "NVIDIA Nemotron",
    role: "The models",
    width: 975,
  },
  {
    darkLogo: "/logos/tavily-dark.svg",
    description:
      "When you ask Nucliva to research something, Tavily runs the web search. The results become the sources you see next to the answer.",
    height: 109,
    lightLogo: "/logos/tavily.svg",
    name: "Tavily",
    role: "Searches the web",
    width: 362,
  },
  {
    darkLogo: "/logos/langchain-dark.svg",
    description:
      "LangChain connects the pieces: chat models, structured output for edits, text splitting and embeddings, and the search tool.",
    height: 24,
    lightLogo: "/logos/langchain.svg",
    name: "LangChain",
    role: "Wires it together",
    width: 131,
  },
];

const models = [
  {
    job: "Writes drafts and suggests edits, with reasoning behind each change",
    name: "Nemotron 3 Ultra",
  },
  {
    job: "Reads what you have written and describes your tone, rhythm and word choice",
    name: "Nemotron 3 Super",
  },
  {
    job: "Finishes your sentence as you type, fast enough to feel instant",
    name: "Nemotron 3 Nano",
  },
  {
    job: "Turns your writing into searchable vectors, so drafts can find what matters",
    name: "Qwen3 Embedding 8B",
  },
];

export default function BuiltWithPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-20 pb-16 text-center md:pt-28">
          <h1
            className={`max-w-4xl text-balance font-bold text-5xl tracking-tighter md:text-7xl ${enter}`}
          >
            Built with the best
            <span className="block text-muted-foreground">
              of AI infrastructure.
            </span>
          </h1>
          <p
            className={`max-w-2xl text-balance text-lg text-muted-foreground delay-100 md:text-xl ${enter}`}
          >
            Nucliva is built for the Nebius x NVIDIA hackathon. Here is what
            runs under it, and what each part does.
          </p>
        </section>
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <Reveal>
            <ul
              className="grid gap-px border bg-border sm:grid-cols-2"
              data-reveal
            >
              {partners.map((partner) => (
                <li
                  className="flex flex-col gap-5 bg-background p-8"
                  key={partner.name}
                >
                  <div className="flex h-10 items-center">
                    <PartnerLogo partner={partner} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-primary text-xs uppercase tracking-widest">
                      {partner.role}
                    </span>
                    <h2 className="font-semibold text-xl tracking-tight">
                      {partner.name}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {partner.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
        <section className="border-y bg-muted/20">
          <Reveal className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
            <div className="flex flex-col gap-4" data-reveal>
              <h2 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
                <span className="text-primary">The right model</span> for each
                job
              </h2>
              <p className="text-muted-foreground text-lg">
                Big models where thinking matters, small ones where speed does.
              </p>
            </div>
            <ul className="flex flex-col divide-y border" data-reveal>
              {models.map((model) => (
                <li
                  className="flex flex-col gap-1 bg-background p-5 sm:flex-row sm:items-baseline sm:gap-8"
                  key={model.name}
                >
                  <span className="shrink-0 font-medium sm:w-52">
                    {model.name}
                  </span>
                  <span className="text-muted-foreground">{model.job}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
        <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
          <h2 className="max-w-xl text-balance font-bold text-3xl tracking-tight md:text-5xl">
            Open source, and built in the open.
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Read the code, see how it works, or run it yourself.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              className="h-11 px-6"
              nativeButton={false}
              render={<a href={repoUrl} rel="noreferrer" target="_blank" />}
              size="lg"
            >
              <GithubLogoIcon />
              View on GitHub
            </Button>
            <Button
              className="h-11 px-6"
              nativeButton={false}
              render={<Link href="/signup" />}
              size="lg"
              variant="outline"
            >
              Get started free
              <ArrowRightIcon />
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

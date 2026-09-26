import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Chip } from "@/components/chip";
import { HeroDiagram } from "@/components/hero-diagram";
import { HeroPreview } from "@/components/hero-preview";
import { Hotkeys, KeyHint } from "@/components/hotkeys";
import { Wordmark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { SectionMark } from "@/components/section-mark";
import { SiteFooter } from "@/components/site-footer";
import { auth } from "@/lib/auth";

const hotkeys = {
  l: "/login",
  s: "/signup",
};

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

const poweredBy = [
  {
    darkLogo: "/logos/nebius.svg",
    height: 36,
    lightLogo: "/logos/nebius.svg",
    name: "Nebius",
    width: 131,
  },
  {
    darkLogo: "/logos/nvidia-dark.svg",
    height: 180,
    lightLogo: "/logos/nvidia.svg",
    name: "NVIDIA",
    width: 975,
  },
  {
    darkLogo: "/logos/tavily-dark.svg",
    height: 109,
    lightLogo: "/logos/tavily.svg",
    name: "Tavily",
    width: 362,
  },
  {
    darkLogo: "/logos/langchain-dark.svg",
    height: 24,
    lightLogo: "/logos/langchain.svg",
    name: "LangChain",
    width: 131,
  },
];

const showcases = [
  {
    description:
      "Upload a few things you have written and Nucliva maps your tone, rhythm and word choice. Every draft after that sounds like you, not like a chatbot.",
    lane: "left",
    preview: [
      { name: "Sentence length", value: "Short, punchy" },
      { name: "Tone", value: "Direct, warm" },
      { name: "Vocabulary", value: "Plain, no jargon" },
      { name: "Voice match", value: "96%" },
    ],
    title: ["It learns", "how you write"],
  },
  {
    description:
      "Ask for anything and Nucliva searches the live web, pulls in the facts that matter and cites every source so you can check the work.",
    lane: "center",
    preview: [
      { name: "nebius.com", value: "Cited" },
      { name: "nvidia.com", value: "Cited" },
      { name: "tavily.com", value: "Cited" },
      { name: "Sources", value: "3 of 3" },
    ],
    title: ["It researches", "so you do not have to"],
  },
  {
    description:
      "Turn rough notes into a polished doc, a set of slides or an organized sheet. One workspace, one voice, no copy and paste between tools.",
    lane: "right",
    preview: [
      { name: "Launch update", value: "Doc" },
      { name: "Q3 board slides", value: "Slides" },
      { name: "Competitor sheet", value: "Sheet" },
      { name: "Files", value: "3" },
    ],
    title: ["Docs, slides and sheets", "in one place"],
  },
] as const;

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={hotkeys} />
      <header className="motion-safe:fade-in sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md motion-safe:animate-in motion-safe:duration-500">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Wordmark className="h-7" />
          <nav className="hidden items-center gap-8 text-muted-foreground text-sm md:flex">
            <a className="hover:text-foreground" href="#features">
              Features
            </a>
            <a className="hover:text-foreground" href="#built-with">
              Built with
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              variant="ghost"
            >
              Log in
              <KeyHint>L</KeyHint>
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />}>
              Sign up
              <KeyHint>S</KeyHint>
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 md:pt-36 md:pb-24">
          <div className="flex flex-col items-center gap-8 text-center">
            <h1
              className={`max-w-4xl text-balance font-bold text-5xl tracking-tighter md:text-7xl ${enter}`}
            >
              The AI workspace that writes like you.
            </h1>
            <p
              className={`max-w-2xl text-balance text-lg text-muted-foreground delay-100 md:text-xl ${enter}`}
            >
              Nucliva learns your voice, researches the web and turns ideas into
              docs, slides and sheets, faster.
            </p>
            <div
              className={`flex flex-col items-center gap-4 delay-200 ${enter}`}
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  className="h-11 px-6"
                  nativeButton={false}
                  render={<Link href="/signup" />}
                  size="lg"
                >
                  Get started free
                  <KeyHint>S</KeyHint>
                  <ArrowRightIcon />
                </Button>
                <Button
                  className="h-11 px-6"
                  nativeButton={false}
                  render={<Link href="/login" />}
                  size="lg"
                  variant="outline"
                >
                  Log in
                  <KeyHint>L</KeyHint>
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Free to start. No credit card required.
              </p>
            </div>
          </div>
          <div
            className={`mt-16 hidden delay-300 motion-safe:duration-1000 md:mt-20 md:block ${enter}`}
          >
            <HeroDiagram />
          </div>
        </section>
        <section className="border-y py-10" id="built-with">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 md:flex-row md:items-center md:gap-12">
            <span className="max-w-32 text-muted-foreground text-xs uppercase tracking-widest">
              Built with leading AI infrastructure
            </span>
            <div className="group mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] relative flex min-w-0 flex-1 overflow-hidden">
              {[0, 1].map((copy) => (
                <ul
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-16 pr-16 motion-safe:animate-[marquee_30s_linear_infinite] motion-safe:group-hover:[animation-play-state:paused]"
                  key={copy}
                >
                  {poweredBy.map((item) => (
                    <li
                      className="flex shrink-0 items-center gap-3 font-semibold text-lg tracking-tight"
                      key={item.name}
                    >
                      {item.lightLogo === item.darkLogo ? (
                        <Image
                          alt={item.name}
                          className="h-8 w-auto"
                          height={item.height}
                          src={item.lightLogo}
                          width={item.width}
                        />
                      ) : (
                        <>
                          <Image
                            alt={item.name}
                            className="h-8 w-auto dark:hidden"
                            height={item.height}
                            src={item.lightLogo}
                            width={item.width}
                          />
                          <Image
                            alt={item.name}
                            className="hidden h-8 w-auto dark:block"
                            height={item.height}
                            src={item.darkLogo}
                            width={item.width}
                          />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
        <section className="relative mx-auto w-full max-w-6xl px-6 pt-24 pb-16 md:pt-32">
          <div
            aria-hidden
            className="absolute inset-x-12 top-1/2 h-2/3 -translate-y-1/2 bg-primary/10 blur-3xl"
          />
          <Reveal className="relative">
            <HeroPreview />
          </Reveal>
        </section>
        {showcases.map((item, index) => (
          <section
            className="mx-auto w-full max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32"
            id={index === 0 ? "features" : undefined}
            key={item.lane}
          >
            <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
              <SectionMark lane={item.lane} />
              <h2
                className="text-balance font-bold text-4xl tracking-tight md:text-6xl"
                data-reveal
              >
                <span className="text-primary">{item.title[0]}</span>{" "}
                {item.title[1]}
              </h2>
              <p
                className="text-balance text-lg text-muted-foreground md:text-xl"
                data-reveal
              >
                {item.description}
              </p>
            </Reveal>
            <Reveal className="mx-auto mt-14 w-full max-w-2xl md:mt-20">
              <div className="border bg-card/50 p-2 shadow-[0_0_60px_-30px_var(--primary)] transition-colors hover:bg-card">
                <div className="flex flex-col divide-y border bg-background">
                  {item.preview.map((row, rowIndex) => (
                    <div
                      className={`flex items-center justify-between gap-4 px-5 py-4 text-sm transition-colors hover:bg-muted/50 ${rowIndex === item.preview.length - 1 ? "bg-primary/5" : ""}`}
                      key={row.name}
                    >
                      <span className="text-muted-foreground">{row.name}</span>
                      <span
                        className={`font-medium ${rowIndex === item.preview.length - 1 ? "font-semibold text-primary" : ""}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        ))}
        <section className="relative overflow-hidden border-t">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 h-4/5 w-3/4 -translate-x-1/2 -translate-y-1/2 bg-primary/20 blur-3xl [mask-image:radial-gradient(ellipse_at_center,#000_15%,transparent_70%)]"
          />
          <Reveal className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-28 text-center md:py-36">
            <div className="group" data-active="true" data-reveal>
              <Chip className="size-24" />
            </div>
            <h2
              className="text-balance font-bold text-4xl tracking-tight md:text-6xl"
              data-reveal
            >
              Start writing like yourself, only faster.
            </h2>
            <div data-reveal>
              <Button
                className="h-11 px-6"
                nativeButton={false}
                render={<Link href="/signup" />}
                size="lg"
              >
                Get started free
                <ArrowRightIcon />
              </Button>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { Hotkeys, KeyHint } from "@/components/hotkeys";
import { Wordmark } from "@/components/logo";
import { NotFoundScene } from "@/components/not-found-scene";

const hotkeys = { d: "/dashboard", h: "/" };

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={hotkeys} />
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
        <Link href="/">
          <Wordmark className="h-7" />
        </Link>
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-3/5 w-4/5 -translate-x-1/2 -translate-y-1/2 bg-primary/10 blur-3xl [mask-image:radial-gradient(ellipse_at_center,#000_15%,transparent_70%)]"
        />
        <div className={`relative w-full max-w-5xl ${enter}`}>
          <NotFoundScene />
        </div>
        <div
          className={`relative flex max-w-xl flex-col items-center gap-4 delay-200 ${enter}`}
        >
          <h1 className="text-balance font-bold text-3xl tracking-tight md:text-5xl">
            This page is still a blank draft.
          </h1>
          <p className="text-balance text-lg text-muted-foreground">
            The link may be broken, or the page may have moved. Let&apos;s get
            you back to writing.
          </p>
        </div>
        <div
          className={`relative flex flex-wrap items-center justify-center gap-3 delay-300 ${enter}`}
        >
          <Button
            className="h-11 px-6"
            nativeButton={false}
            render={<Link href="/" />}
            size="lg"
          >
            Back to home
            <KeyHint>H</KeyHint>
            <ArrowRightIcon />
          </Button>
          <Button
            className="h-11 px-6"
            nativeButton={false}
            render={<Link href="/dashboard" />}
            size="lg"
            variant="outline"
          >
            Open dashboard
            <KeyHint>D</KeyHint>
          </Button>
        </div>
      </main>
    </div>
  );
}

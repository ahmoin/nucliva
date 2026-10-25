import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { KeyHint } from "@/components/hotkeys";
import { Wordmark } from "@/components/logo";

export const siteHotkeys = {
  l: "/login",
  s: "/signup",
};

export function SiteHeader() {
  return (
    <header className="motion-safe:fade-in sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md motion-safe:animate-in motion-safe:duration-500">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link aria-label="Nucliva home" href="/">
          <Wordmark className="h-7" />
        </Link>
        <nav className="hidden items-center gap-8 text-muted-foreground text-sm md:flex">
          <Link className="hover:text-foreground" href="/solutions">
            Solutions
          </Link>
          <Link className="hover:text-foreground" href="/features">
            Features
          </Link>
          <Link className="hover:text-foreground" href="/built-with">
            Built with
          </Link>
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
  );
}

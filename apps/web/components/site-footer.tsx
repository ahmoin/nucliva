import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 px-6 pt-16 pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <Wordmark className="h-7" />
          <p className="mt-2 text-muted-foreground text-sm">
            The AI workspace that writes like you.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Product</span>
          <Link
            className="text-muted-foreground hover:underline"
            href="/#features"
          >
            Features
          </Link>
          <Link
            className="text-muted-foreground hover:underline"
            href="/#built-with"
          >
            Built with
          </Link>
          <Link className="text-muted-foreground hover:underline" href="/login">
            Log in
          </Link>
          <Link
            className="text-muted-foreground hover:underline"
            href="/signup"
          >
            Sign up
          </Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Built with</span>
          <p className="text-muted-foreground">
            Nebius Token Factory, NVIDIA Nemotron and Tavily.
          </p>
          <p className="text-muted-foreground">© 2026 Nucliva</p>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl justify-end">
        <ThemeSwitcher />
      </div>
    </footer>
  );
}

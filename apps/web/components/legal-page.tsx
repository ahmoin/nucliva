import Link from "next/link";
import { Hotkeys } from "@/components/hotkeys";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, siteHotkeys } from "@/components/site-header";
import { contactEmail, legalUpdated } from "@/lib/site";

const enter =
  "motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out";

export function LegalPage({
  children,
  intro,
  title,
}: {
  children: React.ReactNode;
  intro: string;
  title: string;
}) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <Hotkeys keys={siteHotkeys} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-16 pb-24 md:pt-24">
        <div className={`flex flex-col gap-4 ${enter}`}>
          <h1 className="text-balance font-bold text-5xl tracking-tighter md:text-6xl">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">{intro}</p>
          <p className="text-muted-foreground text-sm">
            Last updated {legalUpdated}
          </p>
        </div>
        <div className="mt-14 flex flex-col gap-10 border-t pt-12">
          {children}
        </div>
        <nav
          aria-label="Legal"
          className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-muted-foreground text-sm"
        >
          <Link className="hover:text-foreground" href="/terms">
            Terms of Service
          </Link>
          <Link className="hover:text-foreground" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="hover:text-foreground" href="/cookies">
            Cookies
          </Link>
          <Link className="hover:text-foreground" href="/security">
            Security
          </Link>
          <a
            className="hover:text-foreground"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-muted-foreground leading-relaxed [&_a]:text-foreground [&_a]:underline [&_li]:mt-1.5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

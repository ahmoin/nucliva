import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Geist_Mono,
  Instrument_Sans,
} from "next/font/google";

import "@workspace/ui/globals.css";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { siteUrl } from "@/lib/site";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const description =
  "Nucliva is the AI writing workspace that learns your voice, researches the web and drafts docs, slides and sheets that sound like you.";

export const metadata: Metadata = {
  description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    description,
    siteName: "Nucliva",
    title: "Nucliva",
    type: "website",
  },
  title: {
    default: "Nucliva",
    template: "%s | Nucliva",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(
        "antialiased",
        fontMono.variable,
        bricolage.variable,
        "font-sans",
        instrumentSans.variable
      )}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

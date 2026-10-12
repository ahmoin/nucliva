import { md, SUMMARY, TAGLINE } from "@/lib/content/markdown";
import { categories, solutionPath, solutions } from "@/lib/content/solutions";

// A short guide to the site for language models and the tools that read it:
// what Nucliva is, and where to find a clean Markdown version of every page.
export function GET() {
  const body = [
    "# Nucliva",
    "",
    `> ${TAGLINE} ${SUMMARY}`,
    "",
    "Every page below is also served as Markdown. Add .md to its address, or ask for it with an Accept: text/markdown header.",
    "",
    "## Pages",
    "",
    `- [Home](${md("/")}): what Nucliva is`,
    `- [Features](${md("/features")}): what it does`,
    `- [Solutions](${md("/solutions")}): the ready-made starting points`,
    `- [Built with](${md("/built-with")}): the models and tools under it`,
    "",
    "## Legal",
    "",
    `- [Terms of Service](${md("/terms")})`,
    `- [Privacy Policy](${md("/privacy")})`,
    `- [Cookies](${md("/cookies")})`,
    `- [Security](${md("/security")})`,
    "",
    ...categories.flatMap((category) => [
      `## Solutions for ${category.name.toLowerCase()}`,
      "",
      `- [${category.name}](${md(`/solutions/${category.slug}`)}): ${category.blurb}`,
      ...solutions
        .filter((solution) => solution.category === category.slug)
        .map(
          (solution) =>
            `- [${solution.title}](${md(solutionPath(solution))}): ${solution.summary}`
        ),
      "",
    ]),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

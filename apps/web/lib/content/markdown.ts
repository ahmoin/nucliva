import { models, partners } from "@/lib/content/built-with";
import { features } from "@/lib/content/features";
import {
  categories,
  detailOf,
  findCategory,
  findSolution,
  solutionPath,
  solutions,
  solutionsIn,
} from "@/lib/content/solutions";
import { contactEmail, legalUpdated, repoUrl, siteUrl } from "@/lib/site";

// Plain Markdown versions of the public pages, for agents and tools that would
// rather read text than HTML. They come from the same data as the pages, so
// they stay in step with them. Each page is served at its own address with
// ".md" on the end, and at the normal address to anyone who asks for Markdown.

const TAGLINE = "The AI workspace that writes like you.";

const SUMMARY =
  "Nucliva learns your voice, researches the web and turns ideas into docs, slides and sheets, faster.";

// A page of the site, as the address of its Markdown version.
const md = (path: string) => `${siteUrl}${path === "/" ? "" : path}.md`;
const page = (path: string) => `${siteUrl}${path === "/" ? "" : path}`;

const link = (label: string, path: string) => `[${label}](${md(path)})`;

const site = [
  ["Features", "/features"],
  ["Solutions", "/solutions"],
  ["Built with", "/built-with"],
] as const;

const legal = [
  ["Terms of Service", "/terms"],
  ["Privacy Policy", "/privacy"],
  ["Cookies", "/cookies"],
  ["Security", "/security"],
] as const;

const footer = (path: string) =>
  [
    "---",
    `This page in the browser: ${page(path)}`,
    `Sign up: ${page("/signup")}`,
    `Contact: ${contactEmail}`,
  ].join("\n");

function home() {
  return [
    "# Nucliva",
    "",
    `> ${TAGLINE}`,
    "",
    SUMMARY,
    "",
    "## What it does",
    "",
    ...features.map(
      ({ description, title }) => `- **${title}.** ${description}`
    ),
    "",
    "## Find out more",
    "",
    ...site.map(([label, path]) => `- ${link(label, path)}`),
    "",
    "## Try it",
    "",
    "Every solution opens a sandbox workspace with no sign up, with notes and a request already set up.",
    "",
    `- ${link("Browse all solutions", "/solutions")}`,
    "",
    "## The small print",
    "",
    ...legal.map(([label, path]) => `- ${link(label, path)}`),
    "",
    `Source code: ${repoUrl}`,
    "",
    footer("/"),
  ].join("\n");
}

function featuresPage() {
  return [
    "# Features",
    "",
    "Everything you need to write like yourself: an editor, an assistant that knows your voice, and a way to check every change before it goes in.",
    "",
    ...features.flatMap(({ description, title }) => [
      `## ${title}`,
      "",
      description,
      "",
    ]),
    footer("/features"),
  ].join("\n");
}

function builtWith() {
  return [
    "# Built with",
    "",
    "Nucliva is built for the Nebius x NVIDIA hackathon. Here is what runs under it.",
    "",
    ...partners.flatMap(({ description, name, role }) => [
      `## ${name}`,
      "",
      `*${role}.* ${description}`,
      "",
    ]),
    "## The right model for each job",
    "",
    ...models.map(({ job, name }) => `- **${name}.** ${job}`),
    "",
    `Source code: ${repoUrl}`,
    "",
    footer("/built-with"),
  ].join("\n");
}

function solutionsIndex() {
  return [
    "# Solutions",
    "",
    "Ready-made help for every kind of writing. Each solution learns your voice, researches what it needs and hands back a doc, a deck or a sheet you can edit.",
    "",
    ...categories.flatMap((category) => [
      `## ${category.name}`,
      "",
      category.blurb,
      "",
      ...solutionsIn(category.slug).map(
        (solution) =>
          `- ${link(solution.title, solutionPath(solution))}: ${solution.summary}`
      ),
      "",
    ]),
    footer("/solutions"),
  ].join("\n");
}

function categoryPage(slug: string) {
  const category = findCategory(slug);

  if (!category) {
    return null;
  }

  return [
    `# Nucliva for ${category.name.toLowerCase()}`,
    "",
    category.blurb,
    "",
    "## Solutions",
    "",
    ...solutionsIn(slug).map(
      (solution) =>
        `- ${link(solution.title, solutionPath(solution))}: ${solution.summary}`
    ),
    "",
    footer(`/solutions/${slug}`),
  ].join("\n");
}

function solutionPageMarkdown(category: string, example: string) {
  const solution = findSolution(category, example);
  const line = findCategory(category);

  if (!(solution && line)) {
    return null;
  }

  const detail = detailOf(solution.slug);

  return [
    `# ${solution.title}`,
    "",
    `${solution.summary}. Part of ${link(`Nucliva for ${line.name.toLowerCase()}`, `/solutions/${line.slug}`)}. It makes a ${solution.kind.toLowerCase()}.`,
    "",
    ...(detail
      ? [
          "## Try asking",
          "",
          `> ${detail.prompt}`,
          "",
          "## What you get",
          "",
          ...detail.includes.map((item) => `- ${item}`),
          "",
        ]
      : []),
    "## How it works",
    "",
    "1. **Ask.** Say what you need in plain words, and add notes, files or a link if you have them.",
    "2. **Draft.** Nucliva researches the web when it helps, learns your voice and writes the draft.",
    "3. **Review.** Every change shows up in your document. Accept the ones you like, reject the rest.",
    "",
    `Try it now, no sign up needed: ${page(solutionPath(solution))}`,
    "",
    footer(solutionPath(solution)),
  ].join("\n");
}

// The legal pages are long, so here they are in short, with a link to the
// whole text, which is the one that counts.
const legalSummaries: Record<string, { points: string[]; title: string }> = {
  cookies: {
    points: [
      "Nucliva only uses cookies and browser storage that it needs to work.",
      "A session cookie keeps you signed in.",
      "Your theme, assistant chat history and a local copy of your documents are kept in your browser.",
      "There are no advertising cookies, and no analytics or tracking scripts.",
    ],
    title: "Cookies",
  },
  privacy: {
    points: [
      "Nucliva stores your account details and the things you write.",
      "When you use the AI, your text goes to the AI provider that runs the model, and your searches go to the search provider.",
      "Nucliva does not sell your data or show you ads, and does not train models on your content.",
      "You can ask for your data to be deleted at any time.",
    ],
    title: "Privacy Policy",
  },
  security: {
    points: [
      "Connections are encrypted, and passwords are hashed before they are stored.",
      "Each person's documents and writing are saved against their own account.",
      "Nucliva has not had an independent security audit and holds no certifications yet.",
      `Report a problem to ${contactEmail} with "Security" in the subject.`,
    ],
    title: "Security",
  },
  terms: {
    points: [
      "What you write is yours. Nucliva only uses it to run the service for you.",
      "AI output can be wrong, so check what matters before you rely on it.",
      "Use Nucliva fairly and lawfully.",
      "The service is in active development and is provided as is.",
    ],
    title: "Terms of Service",
  },
};

function legalPage(slug: string) {
  const summary = legalSummaries[slug];

  if (!summary) {
    return null;
  }

  return [
    `# ${summary.title}`,
    "",
    `Last updated ${legalUpdated}. In short:`,
    "",
    ...summary.points.map((point) => `- ${point}`),
    "",
    `This is a summary. Read the full text: ${page(`/${slug}`)}`,
    "",
    footer(`/${slug}`),
  ].join("\n");
}

// The Markdown for a page, given the parts of its address, or null when there
// is no such page. The home page is "home".
export function markdownFor(path: string[]) {
  const [first, second, third] = path;

  if (path.length === 1) {
    if (first === "home") {
      return home();
    }

    if (first === "features") {
      return featuresPage();
    }

    if (first === "built-with") {
      return builtWith();
    }

    if (first === "solutions") {
      return solutionsIndex();
    }

    return first ? legalPage(first) : null;
  }

  if (first === "solutions" && second && path.length === 2) {
    return categoryPage(second);
  }

  if (first === "solutions" && second && third && path.length === 3) {
    return solutionPageMarkdown(second, third);
  }

  return null;
}

// The address of the page a Markdown page is a version of.
export function canonicalFor(path: string[]) {
  return path[0] === "home" ? siteUrl : `${siteUrl}/${path.join("/")}`;
}

// Every page there is Markdown for, as the address of the page.
export function markdownPages() {
  return [
    "/",
    "/features",
    "/solutions",
    "/built-with",
    ...legal.map(([, path]) => path),
    ...categories.map((category) => `/solutions/${category.slug}`),
    ...solutions.map((solution) => solutionPath(solution)),
  ];
}

export { md, page, SUMMARY, TAGLINE };

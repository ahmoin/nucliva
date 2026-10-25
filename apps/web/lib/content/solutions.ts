export type Kind = "Doc" | "Sheet" | "Slides";

export interface Category {
  blurb: string;
  dot: string;
  name: string;
  slug: string;
}

export interface Solution {
  category: string;
  kind: Kind;
  slug: string;
  summary: string;
  title: string;
}

export const categories: Category[] = [
  {
    blurb:
      "Updates, decks and announcements that sound like the person who built the company, written in the hours between everything else.",
    dot: "bg-sky-500",
    name: "Founders",
    slug: "founders",
  },
  {
    blurb:
      "Briefs, posts and campaigns grounded in what is true on the web today, in a voice your audience already recognizes.",
    dot: "bg-fuchsia-500",
    name: "Marketing",
    slug: "marketing",
  },
  {
    blurb:
      "Outreach, proposals and call recaps that read like you wrote each one by hand, without spending your afternoon on them.",
    dot: "bg-emerald-500",
    name: "Sales",
    slug: "sales",
  },
  {
    blurb:
      "Client-ready reports and market scans with live research and sources behind every claim, in your firm's own tone.",
    dot: "bg-amber-500",
    name: "Consulting",
    slug: "consulting",
  },
  {
    blurb:
      "Notes, study guides and essay drafts that start from what you read and finish in your own words.",
    dot: "bg-violet-500",
    name: "Students and research",
    slug: "research",
  },
  {
    blurb:
      "Careful summaries and memos with the source for each point one click away, ready for a lawyer's review.",
    dot: "bg-red-500",
    name: "Legal",
    slug: "legal",
  },
  {
    blurb:
      "Procedures, policies and meeting notes turned from rough input into documents a team can follow.",
    dot: "bg-cyan-500",
    name: "Operations",
    slug: "operations",
  },
  {
    blurb:
      "Newsletters, briefs and releases researched, drafted and checked against their sources in the editor's voice.",
    dot: "bg-lime-500",
    name: "Media",
    slug: "media",
  },
];

export const solutions: Solution[] = [
  {
    category: "founders",
    kind: "Doc",
    slug: "investor-updates",
    summary: "Monthly updates from your notes, in your voice",
    title: "Investor updates",
  },
  {
    category: "founders",
    kind: "Slides",
    slug: "pitch-decks",
    summary: "Rough notes into a story of ten slides",
    title: "Pitch decks",
  },
  {
    category: "founders",
    kind: "Doc",
    slug: "launch-posts",
    summary: "Announcements that sound like you, not a press office",
    title: "Launch posts",
  },
  {
    category: "marketing",
    kind: "Doc",
    slug: "blog-posts",
    summary: "Researched drafts with every claim sourced",
    title: "Blog posts",
  },
  {
    category: "marketing",
    kind: "Doc",
    slug: "campaign-briefs",
    summary: "Audience, angle and channels on one page",
    title: "Campaign briefs",
  },
  {
    category: "marketing",
    kind: "Sheet",
    slug: "content-calendars",
    summary: "A quarter of ideas, laid out by week",
    title: "Content calendars",
  },
  {
    category: "sales",
    kind: "Doc",
    slug: "outreach-emails",
    summary: "Personal at scale, from what you know about them",
    title: "Outreach emails",
  },
  {
    category: "sales",
    kind: "Doc",
    slug: "proposals",
    summary: "Tailored from your last win and their website",
    title: "Proposals",
  },
  {
    category: "sales",
    kind: "Doc",
    slug: "call-recaps",
    summary: "Notes into next steps and a follow-up",
    title: "Call recaps",
  },
  {
    category: "consulting",
    kind: "Doc",
    slug: "client-reports",
    summary: "Findings, evidence and recommendations in your house style",
    title: "Client reports",
  },
  {
    category: "consulting",
    kind: "Doc",
    slug: "market-scans",
    summary: "Live web research with citations, in an afternoon",
    title: "Market scans",
  },
  {
    category: "consulting",
    kind: "Slides",
    slug: "workshop-decks",
    summary: "Agenda, exercises and takeaways, ready to present",
    title: "Workshop decks",
  },
  {
    category: "research",
    kind: "Doc",
    slug: "literature-notes",
    summary: "What a source says, what it means and where it came from",
    title: "Literature notes",
  },
  {
    category: "research",
    kind: "Doc",
    slug: "study-guides",
    summary: "A course's notes into questions you can answer",
    title: "Study guides",
  },
  {
    category: "research",
    kind: "Doc",
    slug: "essay-drafts",
    summary: "A first draft in your own words, with the references",
    title: "Essay drafts",
  },
  {
    category: "legal",
    kind: "Doc",
    slug: "matter-summaries",
    summary: "Facts, issues and next steps in plain language",
    title: "Matter summaries",
  },
  {
    category: "legal",
    kind: "Doc",
    slug: "policy-updates",
    summary: "What changed, who it affects and what to do",
    title: "Policy updates",
  },
  {
    category: "legal",
    kind: "Sheet",
    slug: "clause-checklists",
    summary: "Clauses to look for, and where each one is",
    title: "Clause checklists",
  },
  {
    category: "operations",
    kind: "Doc",
    slug: "procedures",
    summary: "Step-by-step guides from a walkthrough",
    title: "Procedures",
  },
  {
    category: "operations",
    kind: "Doc",
    slug: "meeting-notes",
    summary: "Decisions and owners from a messy transcript",
    title: "Meeting notes",
  },
  {
    category: "operations",
    kind: "Sheet",
    slug: "project-trackers",
    summary: "Tasks, owners and dates organized for you",
    title: "Project trackers",
  },
  {
    category: "media",
    kind: "Doc",
    slug: "newsletters",
    summary: "A weekly issue assembled from what you collected",
    title: "Newsletters",
  },
  {
    category: "media",
    kind: "Doc",
    slug: "research-briefs",
    summary: "Background on a story, with the sources to check",
    title: "Research briefs",
  },
  {
    category: "media",
    kind: "Doc",
    slug: "press-releases",
    summary: "A clear release from a handful of facts",
    title: "Press releases",
  },
];

export interface Detail {
  includes: string[];
  prompt: string;
}

const details: Record<string, Detail> = {
  "blog-posts": {
    includes: [
      "A researched draft with a link behind every claim",
      "Headings and structure that follow your past posts",
      "A short list of angles to try next",
    ],
    prompt:
      "Write a blog post on why small teams are switching to async standups. Research it and keep my tone.",
  },
  "call-recaps": {
    includes: [
      "What was agreed, in a few plain lines",
      "Next steps with an owner and a date",
      "A follow-up email ready to send",
    ],
    prompt:
      "Turn these call notes into a recap and a follow-up email to the client.",
  },
  "campaign-briefs": {
    includes: [
      "Audience, angle and the one thing to say",
      "Channels with a reason for each",
      "Success measures the team can check",
    ],
    prompt:
      "Write a campaign brief for our spring launch aimed at independent bookshops.",
  },
  "clause-checklists": {
    includes: [
      "A table of the clauses to look for",
      "Where each one sits in the document",
      "A flag on the ones that are missing or unusual",
    ],
    prompt:
      "Make a checklist of the key clauses in this supplier agreement and where each one is.",
  },
  "client-reports": {
    includes: [
      "Findings with the evidence beside each one",
      "Recommendations ranked by effort and impact",
      "Your firm's headings, tone and style throughout",
    ],
    prompt:
      "Draft a client report on our retail pricing review. Use the attached data and our house style.",
  },
  "content-calendars": {
    includes: [
      "A quarter laid out week by week in a table",
      "A topic, a format and a channel for each slot",
      "Gaps and repeats called out for you",
    ],
    prompt:
      "Plan a content calendar for next quarter around our three product launches.",
  },
  "essay-drafts": {
    includes: [
      "A first draft built on your own outline",
      "References gathered and cited as you go",
      "Suggested edits you accept or reject one by one",
    ],
    prompt:
      "Draft a 1,500 word essay on the causes of the 2008 financial crisis from my outline.",
  },
  "investor-updates": {
    includes: [
      "Highlights, metrics and asks in your own voice",
      "Last month's numbers set against this month's",
      "A short note on what you need from investors",
    ],
    prompt:
      "Write this month's investor update from my notes. Keep it short and honest, like the last one.",
  },
  "launch-posts": {
    includes: [
      "An announcement that sounds like you wrote it",
      "A short version for social and a long one for your blog",
      "Facts checked against your own notes",
    ],
    prompt:
      "Write a launch post for our new export feature. Plain, no hype, like my last post.",
  },
  "literature-notes": {
    includes: [
      "What each source says, in a few lines",
      "What it means for your question",
      "The reference, ready to cite",
    ],
    prompt:
      "Summarize these three papers on sleep and memory and note how they connect.",
  },
  "market-scans": {
    includes: [
      "Live web research on the players and the trends",
      "Citations you can open for every claim",
      "A short view on where the gaps are",
    ],
    prompt:
      "Research the European market for electric cargo bikes and give me the main players.",
  },
  "matter-summaries": {
    includes: [
      "The facts, the issues and the next steps",
      "Plain language a client can follow",
      "The source for each point, one click away",
    ],
    prompt:
      "Summarize this matter for the client in plain language, with the issues and next steps.",
  },
  "meeting-notes": {
    includes: [
      "Decisions, in the order they were made",
      "Action items with an owner and a date",
      "A clean summary to send to the team",
    ],
    prompt:
      "Turn this meeting transcript into notes with decisions and action items.",
  },
  newsletters: {
    includes: [
      "An issue assembled from the links you collected",
      "A line of context for each one, in your voice",
      "A subject line and an opening worth reading",
    ],
    prompt:
      "Assemble this week's newsletter from the links in my notes. Keep it friendly and brief.",
  },
  "outreach-emails": {
    includes: [
      "A first line that is about them, not you",
      "Several versions to test",
      "Facts taken from their site and the news",
    ],
    prompt:
      "Write a short cold email to the head of operations at this company, using their latest news.",
  },
  "pitch-decks": {
    includes: [
      "A story of about ten slides, one idea each",
      "Speaker notes for every slide",
      "Slides you can change line by line",
    ],
    prompt:
      "Turn my rough notes into a ten slide seed pitch deck with a clear story.",
  },
  "policy-updates": {
    includes: [
      "What changed, in a few lines",
      "Who it affects and from when",
      "What people need to do about it",
    ],
    prompt:
      "Explain what changed in the new data retention policy and what our staff should do.",
  },
  "press-releases": {
    includes: [
      "A clear headline and opening paragraph",
      "Quotes and facts from what you gave it",
      "A boilerplate and contact block",
    ],
    prompt:
      "Write a press release announcing our Series A from these facts and this quote.",
  },
  procedures: {
    includes: [
      "Numbered steps in the right order",
      "Warnings and checks where people slip",
      "A tidy page a new hire can follow",
    ],
    prompt:
      "Turn this walkthrough into a step by step procedure for onboarding a new supplier.",
  },
  "project-trackers": {
    includes: [
      "Tasks, owners and dates in one table",
      "Statuses sorted so the late ones show first",
      "A summary line for your weekly update",
    ],
    prompt:
      "Build a project tracker from these notes, with an owner and a due date for each task.",
  },
  proposals: {
    includes: [
      "Scope, timeline and price in your usual layout",
      "Language that echoes their own website",
      "Sections lifted from your last winning proposal",
    ],
    prompt:
      "Write a proposal for this prospect, based on our last win and what is on their website.",
  },
  "research-briefs": {
    includes: [
      "Background on the story in a few paragraphs",
      "The sources to check, with links",
      "Open questions to put to the people involved",
    ],
    prompt:
      "Give me a research brief on the port strike, with sources I can check.",
  },
  "study-guides": {
    includes: [
      "Key ideas from your notes, in short",
      "Questions you can use to test yourself",
      "Terms and definitions in a table",
    ],
    prompt: "Make a study guide from my lecture notes on the French Revolution.",
  },
  "workshop-decks": {
    includes: [
      "An agenda with timings",
      "Exercises with instructions for each group",
      "Takeaways slide to close the session",
    ],
    prompt:
      "Build a half day workshop deck on customer journey mapping, with two exercises.",
  },
};

export const categoryOf = (slug: string) =>
  categories.find((category) => category.slug === slug) ?? categories[0];

export const findCategory = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const solutionsIn = (slug: string) =>
  solutions.filter((solution) => solution.category === slug);

export const findSolution = (category: string, slug: string) =>
  solutions.find(
    (solution) => solution.category === category && solution.slug === slug
  );

export const detailOf = (slug: string): Detail | undefined => details[slug];

export const solutionPath = (solution: Solution) =>
  `/solutions/${solution.category}/${solution.slug}`;

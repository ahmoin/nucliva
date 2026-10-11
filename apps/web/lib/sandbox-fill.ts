import type {
  SandboxDeck,
  SandboxDoc,
  SandboxSheet,
} from "@/lib/sandbox-data";

// The rest of a sandbox workspace: dozens of ordinary files that a real
// account would have piled up over a year. They are made from templates, with
// the same result every time, so the workspace is always the same place.
interface Spec {
  deckTitles: string[];
  // How many files the workspace has in all, hand-written ones included.
  total: number;
  lines: string[];
  names: string[];
  points: string[];
  sheetTitles: string[];
  titles: string[];
}

const specs: Record<string, Spec> = {
  consulting: {
    deckTitles: [
      "Readout, {name}",
      "Workshop, {month}",
      "Steering committee, {month}",
      "Proposal, {name}",
    ],
    lines: [
      "The data points to a few clear causes, not one big one.",
      "{name} asked for the analysis to be repeatable without us.",
      "Three options are on the table, and the middle one is the safest.",
      "We checked the numbers twice against the source files.",
      "The biggest gap is between what leaders think happens and what the data shows.",
      "Quick wins could be live within {n} weeks.",
      "The team at {name} has been open and fast to respond.",
      "The risk is doing too much at once, so we suggest a short pilot.",
      "Savings are estimated at about {pct}% of the current cost.",
    ],
    names: [
      "Northgate Retail",
      "Halden Foods",
      "Bluepeak Energy",
      "Marlow Health",
      "Corvid Logistics",
      "Elmstead Bank",
      "Tidewater Group",
      "Ashby Motors",
    ],
    points: [
      "Where we started",
      "What the data shows",
      "Options considered",
      "Our recommendation",
      "Risks and how to manage them",
      "Timing and next steps",
      "What we need from you",
      "Quick wins",
    ],
    sheetTitles: [
      "Workplan, {month}",
      "Findings log, {name}",
      "Hours and budget, {month}",
      "Interview schedule, {name}",
    ],
    titles: [
      "{name}, kickoff notes",
      "{name}, interview notes",
      "Findings, {month}",
      "Status update, {month}",
      "Recommendations, {name}",
      "Market scan, {month}",
      "Workshop plan, {month}",
      "Weekly check in, {name}",
      "Draft report, {name}",
      "Lessons learned, {month}",
    ],
    total: 68,
  },
  founders: {
    deckTitles: [
      "Board update, {month}",
      "Product roadmap, {month}",
      "Investor intro, {name}",
      "All hands, {month}",
    ],
    lines: [
      "Revenue is up {pct}% on last month and churn held steady.",
      "We signed {n} new teams, most of them from referrals.",
      "The main risk is hiring fast enough to keep up with demand.",
      "We spoke with {name}, who asked for the churn numbers by cohort.",
      "The next step is a follow up call in two weeks.",
      "Support tickets fell by {pct}% after the last release.",
      "Engineering shipped {n} improvements this month, mostly around speed.",
      "Customers keep asking for better export and sharing.",
      "Cash is healthy, with about {n} months of runway at the current pace.",
      "Our biggest customer renewed for a second year.",
    ],
    names: [
      "Lumen Capital",
      "Cedar Ventures",
      "Northwind Angels",
      "Atlas Partners",
      "Juniper Fund",
      "Kestrel Capital",
      "Ridgeline VC",
      "Tern Ventures",
    ],
    points: [
      "Revenue and growth",
      "What we shipped",
      "Where we are stuck",
      "Hiring",
      "The plan for next month",
      "Risks",
      "Asks",
      "Customers and feedback",
    ],
    sheetTitles: [
      "Metrics, {month}",
      "Runway model, {month}",
      "Investor pipeline, {month}",
      "Hiring tracker, {month}",
    ],
    titles: [
      "Investor update, {month}",
      "Board notes, {month}",
      "Call with {name}",
      "Intro email to {name}",
      "Hiring plan, {month}",
      "Product roadmap, {month}",
      "Customer interview, {month}",
      "Weekly priorities, {month}",
      "Launch plan, {month}",
      "Follow up, {name}",
    ],
    total: 84,
  },
  legal: {
    deckTitles: [
      "Client briefing, {name}",
      "Training, {month}",
      "Policy overview, {month}",
      "Matter review, {name}",
    ],
    lines: [
      "The clause is common, but the wording here favours the other side.",
      "{name} wants a plain summary they can forward to their board.",
      "We suggest asking for {n} days notice in place of the current period.",
      "No change is needed, but the point is worth a note on file.",
      "The risk is low as drafted, and higher if the scope grows.",
      "This follows the same approach as the last agreement for {name}.",
      "The deadline is firm, so the review has to finish this week.",
      "Liability is limited to the fees paid, which is usual for this kind of deal.",
      "A short side letter would fix this without reopening the whole contract.",
    ],
    names: [
      "Fenwick Software",
      "Ridley Holdings",
      "Calder and Sons",
      "Orchard Health",
      "Pellham Media",
      "Quill Studios",
      "Hartwell Foods",
      "Stratton Labs",
    ],
    points: [
      "Background",
      "Key terms",
      "Where we would push",
      "Risks",
      "Recommendation",
      "Next steps",
      "Questions for the client",
      "Timeline",
    ],
    sheetTitles: [
      "Clause checklist, {name}",
      "Deadlines, {month}",
      "Matter tracker, {month}",
      "Billing, {month}",
    ],
    titles: [
      "Matter summary, {name}",
      "Contract review, {name}",
      "Policy update, {month}",
      "Client note, {name}",
      "Intake, {name}",
      "Research memo, {month}",
      "Call notes, {name}",
      "Clause comparison, {name}",
      "Advice letter, {name}",
      "File note, {month}",
    ],
    total: 64,
  },
  marketing: {
    deckTitles: [
      "Campaign plan, {month}",
      "Launch review, {month}",
      "Brand workshop, {month}",
      "Pitch to {name}",
    ],
    lines: [
      "The post with a real before and after did {pct}% better than the rest.",
      "{name} wants a version of this for their own newsletter.",
      "The audience responds to plain words, not big claims.",
      "Click through was {pct}% on this send, against {n}% last time.",
      "The big idea is simple, which is why it works.",
      "We should test two subject lines before the full send.",
      "The budget covers {n} weeks of paid posts, no more.",
      "Photos beat illustrations on every channel we tried.",
      "Reply rate was the best sign, more than opens or clicks.",
    ],
    names: [
      "Bramble Books",
      "Oakhurst Studio",
      "Lantern Press",
      "Finch Creative",
      "Meadow Agency",
      "Pixel and Pine",
      "Cobalt Coffee",
      "Sparrow Design",
    ],
    points: [
      "The audience",
      "The message",
      "Channels",
      "Timing",
      "Budget",
      "What we learned",
      "Ideas to test",
      "Results so far",
    ],
    sheetTitles: [
      "Content calendar, {month}",
      "Campaign results, {month}",
      "Ad spend, {month}",
      "Audience list, {name}",
    ],
    titles: [
      "Campaign brief, {month}",
      "Blog post, {month}",
      "Newsletter draft, {month}",
      "Social posts, {month}",
      "Ideas for {name}",
      "Launch copy, {month}",
      "Case study, {name}",
      "Brand notes, {month}",
      "Subject line tests, {month}",
      "Weekly content plan, {month}",
    ],
    total: 76,
  },
  media: {
    deckTitles: [
      "Editorial meeting, {month}",
      "Reader survey, {month}",
      "Pitch to {name}",
      "Season plan, {month}",
    ],
    lines: [
      "The story stands up, but one source still has to confirm on the record.",
      "{name} sent a statement late on Tuesday.",
      "Readers want context, not a summary of the news.",
      "The headline can be shorter without losing the point.",
      "We have {n} sources so far, and two more to reach.",
      "The figures come from a public report, linked below.",
      "This is the warm story for the end of the issue.",
      "Opens were {pct}% and the top link got the most clicks.",
      "A correction is needed on the date, and a note to readers.",
    ],
    names: [
      "Harbour Times",
      "The Weekly Ledger",
      "Citywire Daily",
      "Morning Post",
      "The Dispatch",
      "Fieldnotes Radio",
      "Granite Press",
      "North Star News",
    ],
    points: [
      "The lead",
      "Sources",
      "Context",
      "What readers asked",
      "The warm story",
      "Corrections",
      "Next issue",
      "Numbers",
    ],
    sheetTitles: [
      "Issue stats, {month}",
      "Source list, {month}",
      "Publishing calendar, {month}",
      "Freelancer invoices, {month}",
    ],
    titles: [
      "Issue draft, {month}",
      "Research brief, {month}",
      "Press release, {name}",
      "Interview notes, {name}",
      "Pitch to {name}",
      "Link pile, {month}",
      "Story ideas, {month}",
      "Fact check, {month}",
      "Headline tests, {month}",
      "Reader emails, {month}",
    ],
    total: 72,
  },
  operations: {
    deckTitles: [
      "Quarterly review, {month}",
      "Process update, {month}",
      "Supplier meeting, {name}",
      "Team offsite, {month}",
    ],
    lines: [
      "The new process saves about {n} hours a week.",
      "{name} is late on the last two orders, so we need a plan.",
      "Each step has one owner and one date.",
      "The checklist works, but step {n} still confuses new people.",
      "We will review this again in {n} weeks.",
      "Costs came in {pct}% under budget this month.",
      "The system does not do this, so it stays a manual step for now.",
      "Please tell the owner early if a date will slip.",
      "Nothing is blocked, but two items are waiting on approval.",
    ],
    names: [
      "Pine Supply",
      "Redwood Freight",
      "Atlas Packaging",
      "Summit Parts",
      "Clover Foods",
      "Delta Print",
      "Anchor Storage",
      "Maple Tools",
    ],
    points: [
      "What changed",
      "Owners and dates",
      "Open questions",
      "Costs",
      "Risks",
      "What is working",
      "What is not",
      "Next steps",
    ],
    sheetTitles: [
      "Project tracker, {month}",
      "Supplier list, {month}",
      "Orders, {month}",
      "Budget, {month}",
    ],
    titles: [
      "Team meeting, {month}",
      "Procedure: {name} orders",
      "Onboarding, {name}",
      "Process review, {month}",
      "Policy draft, {month}",
      "Checklist, {month}",
      "Supplier call, {name}",
      "Incident notes, {month}",
      "Handover notes, {month}",
      "Weekly plan, {month}",
    ],
    total: 88,
  },
  research: {
    deckTitles: [
      "Seminar, {month}",
      "Revision, {month}",
      "Presentation on {name}",
      "Study group, {month}",
    ],
    lines: [
      "The main finding is clear, but the sample was small.",
      "{name} makes the opposite argument, which is worth setting beside it.",
      "The key idea is easier to see with an example.",
      "I still need a source for the claim in the third paragraph.",
      "The method is simple: {n} groups, one change at a time.",
      "This links back to the idea from the earlier lecture.",
      "The result held in {pct}% of cases, which is not enough to be sure.",
      "I will check this against the reading list before the exam.",
      "In short, the evidence points one way, but not strongly.",
    ],
    names: [
      "Baddeley",
      "Kahneman",
      "Ebbinghaus",
      "Loftus",
      "Miller",
      "Craik",
      "Tulving",
      "Bartlett",
    ],
    points: [
      "The question",
      "The method",
      "What they found",
      "Why it matters",
      "Criticisms",
      "Key terms",
      "Practice questions",
      "How it connects",
    ],
    sheetTitles: [
      "Revision plan, {month}",
      "Reading tracker, {month}",
      "Reference list, {name}",
      "Practice scores, {month}",
    ],
    titles: [
      "Lecture notes, {month}",
      "Reading notes: {name}",
      "Essay plan, {month}",
      "Study guide, {month}",
      "Summary of {name}",
      "Lab report, {month}",
      "Seminar notes, {month}",
      "Practice answers, {month}",
      "Key terms, {month}",
      "Draft essay, {name}",
    ],
    total: 98,
  },
  sales: {
    deckTitles: [
      "Proposal, {name}",
      "Demo for {name}",
      "Quarterly review, {month}",
      "Kickoff, {name}",
    ],
    lines: [
      "{name} wants to move quickly, with a decision by the end of the month.",
      "The main pain is time spent on reports they do by hand.",
      "Budget is approved for this quarter, up to about ${n}k.",
      "They compared us with one other vendor and liked our support.",
      "The champion is on our side, but finance still has to sign.",
      "Next step is a short demo for the wider team.",
      "They asked for a reference from a company of the same size.",
      "No pressure on timing, but the offer holds until the end of {month}.",
      "A reply came within the hour, which is a good sign.",
    ],
    names: [
      "Northfield Logistics",
      "Harbor Supply",
      "Pinecrest Foods",
      "Brightline Freight",
      "Oakmont Retail",
      "Summit Health",
      "Copperleaf Co",
      "Vale Industries",
    ],
    points: [
      "What we heard",
      "What changes",
      "How it works",
      "Proof from a similar company",
      "Price",
      "Next steps",
      "Who needs to sign",
      "Timeline",
    ],
    sheetTitles: [
      "Pipeline, {month}",
      "Quota tracker, {month}",
      "Renewals, {month}",
      "Leads, {month}",
    ],
    titles: [
      "Call recap, {name}",
      "Outreach email, {name}",
      "Proposal, {name}",
      "Account notes, {name}",
      "Follow up, {name}",
      "Meeting prep, {name}",
      "Pricing options, {name}",
      "Renewal plan, {name}",
      "Weekly pipeline notes, {month}",
      "Lost deal review, {name}",
    ],
    total: 92,
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY = 24 * 60 * 60 * 1000;

// A small, repeatable source of numbers, so a workspace is the same each time.
function random(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const hash = (value: string) =>
  [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) | 0, 7);

export interface Filled {
  decks: (SandboxDeck & { starred?: boolean })[];
  docs: SandboxDoc[];
  sheets: (SandboxSheet & { starred?: boolean })[];
}

// The ordinary files to put around the hand-written ones, so that the whole
// workspace has about the number of files the line of work calls for.
export function fillWorkspace(category: string, written: number): Filled {
  const spec = specs[category];
  const empty: Filled = { decks: [], docs: [], sheets: [] };

  if (!spec) {
    return empty;
  }

  const next = random(hash(category));
  const pick = <T>(items: T[]) => items[Math.floor(next() * items.length)] as T;
  const count = Math.max(0, spec.total - written);
  const decks = Math.round(count * 0.1);
  const sheets = Math.round(count * 0.14);
  const docs = count - decks - sheets;
  const now = Date.now();
  const used = new Set<string>();

  // Each file has a day it was last changed, spread over about a year, and the
  // month of that day goes in its title.
  const make = (index: number, total: number, templates: string[]) => {
    const days = 1 + Math.round(((index + next() * 0.8) / total) * 330);
    const month = MONTHS[new Date(now - days * DAY).getMonth()] ?? "";
    const name = spec.names[(index + Math.floor(next() * 3)) % spec.names.length];
    let title = (templates[index % templates.length] ?? "")
      .replaceAll("{month}", month)
      .replaceAll("{name}", name ?? "");
    let attempt = 2;
    const base = title;

    while (used.has(title)) {
      title = `${base} (${attempt})`;
      attempt += 1;
    }

    used.add(title);

    return { days, name: name ?? "", title };
  };

  const sentence = (name: string, month: string) =>
    pick(spec.lines)
      .replaceAll("{name}", name)
      .replaceAll("{month}", month)
      .replaceAll("{pct}", String(5 + Math.floor(next() * 40)))
      .replaceAll("{n}", String(2 + Math.floor(next() * 11)));

  const fill: Filled = { decks: [], docs: [], sheets: [] };

  for (let index = 0; index < docs; index += 1) {
    const { days, name, title } = make(index, docs, spec.titles);
    const month = MONTHS[new Date(now - days * DAY).getMonth()] ?? "";
    const body = [
      "## Summary",
      sentence(name, month),
      sentence(name, month),
      "## Notes",
      `- ${sentence(name, month)}`,
      `- ${sentence(name, month)}`,
      `- ${sentence(name, month)}`,
    ];

    fill.docs.push({ ago: days, body, starred: next() < 0.06, title });
  }

  for (let index = 0; index < sheets; index += 1) {
    const { days, name, title } = make(index, sheets, spec.sheetTitles);
    const rows: (string | number)[][] = [["Item", "Owner", "Amount", "Status"]];

    for (let row = 0; row < 5; row += 1) {
      rows.push([
        pick(spec.points),
        spec.names[(index + row) % spec.names.length] ?? name,
        100 * (1 + Math.floor(next() * 90)),
        pick(["Done", "In progress", "Planned", "Waiting"]),
      ]);
    }

    fill.sheets.push({ ago: days, rows, starred: next() < 0.05, title });
  }

  for (let index = 0; index < decks; index += 1) {
    const { days, name, title } = make(index, decks, spec.deckTitles);
    const month = MONTHS[new Date(now - days * DAY).getMonth()] ?? "";

    fill.decks.push({
      ago: days,
      slides: [0, 1, 2].map((slide) => ({
        points: [sentence(name, month), sentence(name, month)],
        title: spec.points[(index + slide) % spec.points.length] ?? "Overview",
      })),
      title,
    });
  }

  return fill;
}

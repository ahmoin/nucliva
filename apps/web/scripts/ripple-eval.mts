//   pnpm dlx tsx scripts/ripple-eval.mts              reads facts with the model
//   pnpm dlx tsx scripts/ripple-eval.mts --runs 3     does that three times
//   pnpm dlx tsx scripts/ripple-eval.mts --offline    uses made-up model output
//                                                      to test the code alone
//   pnpm dlx tsx scripts/ripple-eval.mts --verbose    shows what was read from
//                                                      each paragraph
import { existsSync, readFileSync } from "node:fs";
import {
  cleanExtraction,
  emptyFactData,
  type FactData,
  hashText,
  locateMentions,
  mergeExtraction,
  parseMention,
  proposeRipple,
  type RawExtraction,
} from "../lib/editor/facts";

const args = process.argv.slice(2);
const offline = args.includes("--offline");
const verbose = args.includes("--verbose");
const runs = Number(args[args.indexOf("--runs") + 1]) || 1;
const TODAY = "2026-10-11";
const YEAR = 2026;

if (!process.env.NEBIUS_API_KEY && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^NEBIUS_API_KEY=(.*)$/);

    if (match) {
      process.env.NEBIUS_API_KEY = match[1]
        ?.trim()
        .replaceAll(/^["']|["']$/g, "");
    }
  }
}

interface Expected {
  from: string;
  paragraph: number;
  to: string;
}

interface Case {
  canned: RawExtraction[];
  edit: { from: string; paragraph: number; to: string };
  expected: Expected[];
  name: string;
  paragraphs: string[];
}

const said = (
  label: string,
  mentions: string[],
  sameAs: string | null = null,
  derivedFrom: string | null = null
) => ({ derivedFrom, label, mentions, sameAs });

const cases: Case[] = [
  {
    canned: [
      {
        dependents: [],
        facts: [
          said("Q3 revenue", ["$4,200,000"]),
          said("Q3 growth on Q2", ["12%"]),
        ],
      },
      { dependents: [], facts: [said("Q3 revenue", ["$4.2M"], "q3_revenue")] },
      {
        dependents: [],
        facts: [said("Q3 revenue", ["4.2 million dollars"], "q3_revenue")],
      },
      {
        dependents: [],
        facts: [said("Q3 revenue", ["$4.20 million"], "q3_revenue")],
      },
      {
        dependents: [],
        facts: [said("Q3 revenue", ["USD 4.2M"], "q3_revenue")],
      },
      { dependents: [], facts: [said("Seed funding raised", ["$4.2M"])] },
    ],
    edit: { from: "$4,200,000", paragraph: 0, to: "$4,500,000" },
    expected: [
      { from: "$4.2M", paragraph: 1, to: "$4.5M" },
      { from: "4.2 million dollars", paragraph: 2, to: "4.5 million dollars" },
      { from: "$4.20 million", paragraph: 3, to: "$4.50 million" },
      { from: "USD 4.2M", paragraph: 4, to: "USD 4.5M" },
    ],
    name: "Revenue written five ways, and a different $4.2M",
    paragraphs: [
      "Q3 revenue came in at $4,200,000, up 12% on the previous quarter.",
      "We expect Q3 revenue of $4.2M to hold through the end of the year.",
      "Revenue for the quarter was 4.2 million dollars, our best result yet.",
      "At $4.20 million, Q3 revenue beat the plan by a wide margin.",
      "The board noted Q3 revenue (USD 4.2M) in its summary.",
      "Separately, we closed a seed round and have raised $4.2M so far.",
    ],
  },
  {
    canned: [
      { dependents: [], facts: [said("Launch date", ["March 1"])] },
      {
        dependents: [],
        facts: [
          said(
            "Beta start date",
            ["January 18"],
            null,
            "launch_date - 6 weeks"
          ),
        ],
      },
      {
        dependents: [],
        facts: [said("Launch date", ["March 1"], "launch_date")],
      },
    ],
    edit: { from: "March 1", paragraph: 0, to: "May 1" },
    expected: [
      { from: "January 18", paragraph: 1, to: "March 20" },
      { from: "March 1", paragraph: 2, to: "May 1" },
    ],
    name: "A launch date, and a beta date worked out from it",
    paragraphs: [
      "We plan to launch on March 1.",
      "The beta starts 6 weeks before launch, on January 18.",
      "Launch day, March 1, is also when pricing goes live.",
    ],
  },
];

async function read(paragraph: string, data: FactData, canned?: RawExtraction) {
  let raw: RawExtraction = canned ?? { dependents: [], facts: [] };

  if (!offline) {
    const { extractRaw } = await import("../lib/ai/read-facts");

    raw = await extractRaw({ paragraph, table: data.facts, today: TODAY });
  }

  if (verbose) {
    console.log(`  model said: ${JSON.stringify(raw.facts)}`);
  }

  return cleanExtraction(paragraph, raw, data.facts, YEAR);
}

async function run(test: Case) {
  let data = emptyFactData();

  for (const [index, paragraph] of test.paragraphs.entries()) {
    // biome-ignore lint/performance/noAwaitInLoops: the order is the point
    const extraction = await read(paragraph, data, test.canned[index]);

    if (verbose) {
      console.log(
        `  read ${index}: ${
          extraction.facts
            .map(
              (item) =>
                `${item.id}[${item.unit}] ${JSON.stringify(item.mentions)}${item.derivedFrom ? ` = ${item.derivedFrom}` : ""}`
            )
            .join("; ") || "no facts"
        }`
      );
    }

    data = mergeExtraction(data, paragraph, extraction);
  }

  const { from, paragraph: at, to } = test.edit;
  const original = test.paragraphs[at] ?? "";
  const mention = locateMentions(
    original,
    data.mentions[hashText(original)] ?? []
  ).find((item) => item.text === from);
  const fact = data.facts.find((item) => item.id === mention?.factId);
  const parsed = fact ? parseMention(to, fact.unit, YEAR) : null;

  if (!(mention && fact && parsed)) {
    return {
      found: false as const,
      note: `the edited value was not read as a fact (${mention ? "no parse" : "no mention"})`,
      proposed: [] as Expected[],
    };
  }

  const blocks = test.paragraphs.map((text, index) => ({
    key: String(index),
    text: index === at ? original.replace(from, to) : text,
  }));
  const { proposals } = proposeRipple({
    blocks,
    change: {
      factId: fact.id,
      source: { blockKey: String(at), end: mention.end, start: mention.start },
      value: parsed.value,
    },
    data,
    refYear: YEAR,
  });

  return {
    found: true as const,
    note: "",
    proposed: proposals.map((item) => ({
      from: item.from,
      paragraph: Number(item.blockKey),
      to: item.to,
    })),
  };
}

const same = (a: Expected, b: Expected) =>
  a.paragraph === b.paragraph && a.from === b.from && a.to === b.to;

const totals = { correct: 0, expected: 0, proposed: 0 };

console.log(
  offline
    ? "OFFLINE: the model's part is made up, so this tests the code only.\n"
    : `LIVE: facts are read by the model, ${runs} run${runs === 1 ? "" : "s"}.\n`
);

if (!(offline || process.env.NEBIUS_API_KEY)) {
  console.log(
    "No NEBIUS_API_KEY found, so there is no model to ask. Use --offline."
  );
  process.exit(1);
}

for (let round = 1; round <= runs; round += 1) {
  for (const test of cases) {
    let result: Awaited<ReturnType<typeof run>>;

    try {
      // biome-ignore lint/performance/noAwaitInLoops: one test at a time, so the model is not asked for everything at once
      result = await run(test);
    } catch (error) {
      console.log(
        `${test.name}\n  failed: ${error instanceof Error ? error.name : "unknown"}\n`
      );
      totals.expected += test.expected.length;
      continue;
    }

    const correct = result.proposed.filter((item) =>
      test.expected.some((want) => same(item, want))
    );
    const wrong = result.proposed.filter(
      (item) => !test.expected.some((want) => same(item, want))
    );
    const missed = test.expected.filter(
      (want) => !result.proposed.some((item) => same(item, want))
    );

    totals.correct += correct.length;
    totals.expected += test.expected.length;
    totals.proposed += result.proposed.length;

    console.log(`${test.name}${runs > 1 ? ` (run ${round})` : ""}`);
    console.log(
      `  proposed ${result.proposed.length}, correct ${correct.length} of ${test.expected.length} expected${result.note ? `, ${result.note}` : ""}`
    );

    for (const item of correct) {
      console.log(
        `    ok     paragraph ${item.paragraph}: ${item.from} -> ${item.to}`
      );
    }

    for (const item of wrong) {
      console.log(
        `    WRONG  paragraph ${item.paragraph}: ${item.from} -> ${item.to}`
      );
    }

    for (const item of missed) {
      console.log(
        `    MISSED paragraph ${item.paragraph}: ${item.from} -> ${item.to}`
      );
    }

    console.log("");
  }
}

const percent = (part: number, whole: number) =>
  whole === 0 ? "n/a" : `${((part / whole) * 100).toFixed(0)}%`;

console.log(
  `${totals.correct} of ${totals.proposed} suggestions were correct: precision ${percent(totals.correct, totals.proposed)}, recall ${percent(totals.correct, totals.expected)} (${totals.correct} of ${totals.expected} expected).`
);

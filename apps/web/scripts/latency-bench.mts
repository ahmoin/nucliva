//   pnpm dlx tsx scripts/latency-bench.mts
//   pnpm dlx tsx scripts/latency-bench.mts --runs 20
//   pnpm dlx tsx scripts/latency-bench.mts --thinking
import { existsSync, readFileSync } from "node:fs";
import { getChatModel } from "../lib/ai/nebius";
import { autocompleteInput, autocompletePrompt } from "../lib/ai/prompts";

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf("--runs") + 1]) || 10;
const thinking = args.includes("--thinking");

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

if (!process.env.NEBIUS_API_KEY) {
  console.error("Set NEBIUS_API_KEY (or put it in .env.local).");
  process.exit(1);
}

const SENTENCES = [
  "Next month we",
  "Revenue is $48k a month, up from",
  "Thanks for the call yesterday. As promised, here is",
  "The main risk to the launch is",
  "We shipped export to PDF and Markdown, two weeks late, but",
];

const ask = async (context: string, think: boolean) => {
  const model = getChatModel("nano", {
    maxTokens: think ? 1024 : 64,
    temperature: 0.3,
    thinking: think ? undefined : false,
  });
  const started = performance.now();
  await model.invoke([
    ["system", autocompletePrompt],
    ["human", autocompleteInput(context, "")],
  ]);

  return performance.now() - started;
};

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

const report = (label: string, times: number[]) => {
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const ms = (t: number) => `${Math.round(t)}ms`.padStart(7);

  console.log(
    `${label.padEnd(24)} n=${String(times.length).padStart(3)}  median ${ms(percentile(sorted, 50))}  p90 ${ms(percentile(sorted, 90))}  mean ${ms(mean)}  min ${ms(sorted[0] ?? 0)}  max ${ms(sorted.at(-1) ?? 0)}`
  );
};

const bench = async (label: string, think: boolean) => {
  await ask(SENTENCES[0] ?? "", think);
  const times: number[] = [];

  for (let run = 0; run < runs; run++) {
    for (const sentence of SENTENCES) {
      times.push(await ask(sentence, think));
    }
  }

  report(label, times);
};

console.log(`Autocomplete latency, Nemotron 3 Nano on Nebius Token Factory, ${runs} runs x ${SENTENCES.length} sentences\n`);
await bench("Nano, thinking off", false);

if (thinking) {
  await bench("Nano, thinking on", true);
}

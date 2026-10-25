import { z } from "zod";
import { getChatModel } from "@/lib/ai/nebius";
import {
  cleanExtraction,
  type Extraction,
  type Fact,
  type RawExtraction,
} from "@/lib/editor/facts";

const extractionSchema = z.object({
  dependents: z
    .array(
      z.object({
        about: z
          .string()
          .describe("The id or the label of the fact the sentence leans on"),
        sentence: z
          .string()
          .describe("The sentence, copied exactly as it is in the paragraph"),
      })
    )
    .describe(
      "Sentences that depend on a fact without containing its value, like 'which is our best quarter yet'. Usually empty."
    ),
  facts: z.array(
    z.object({
      derivedFrom: z
        .string()
        .nullable()
        .describe(
          "Only if this paragraph says the value follows from another fact in the table: an expression over table ids with + - * / and durations like '6 weeks', such as 'launch_date - 6 weeks'. Otherwise null."
        ),
      label: z
        .string()
        .describe("A short name for the fact, like 'Q3 revenue'"),
      mentions: z
        .array(z.string())
        .describe(
          "Each place the paragraph states the value, copied exactly as written, with its symbol and scale, like '$4.2M' or 'March 1'. Only the value, not the words around it."
        ),
      sameAs: z
        .string()
        .nullable()
        .describe(
          "The id of the fact in the table if this is that fact, however it is written. Otherwise null."
        ),
    })
  ),
});

const tableLines = (table: Fact[]) =>
  table.length === 0
    ? "(none yet)"
    : table
        .map(
          (fact) =>
            `${fact.id} | ${fact.label} | ${fact.value} | ${fact.unit}${fact.derivedFrom ? ` | worked out as ${fact.derivedFrom}` : ""}`
        )
        .join("\n");

const extractionPrompt = (table: Fact[], today: string) =>
  `You find the facts in one paragraph of a document: amounts of money, percentages, dates, and counts or measurements with a unit, like 12 employees. For each, say what it is called, where the paragraph states it, and whether it is a fact the document already has.

Today is ${today}.

The facts the document already has (id | label | value | unit):
${tableLines(table)}

Rules:
- If a fact in the paragraph is one in the table, set sameAs to its id, even when it is written differently: "$4.2M", "4.2 million dollars" and "$4,200,000" are one fact.
- The same number can be a different fact. "$4.2M raised" is not the Q3 revenue just because both are $4.2M: give it its own label and set sameAs to null.
- A mention is the value exactly as written, like "$4.2M", "12%" or "March 1". Never the words around it.
- Only set derivedFrom when the paragraph says the value follows from another fact, like "the beta starts 6 weeks before launch". Write it with the ids from the table.
- Skip years on their own, list numbers, section or page numbers, phone numbers, version numbers, and any bare number with no unit or context.
- If you are not sure something is a fact worth keeping in step across a document, leave it out. A paragraph with no facts gets an empty list.

Example. Table:
q3_revenue | Q3 revenue | 4200000 | USD
launch_date | Launch date | 2026-03-01 | date
Paragraph: "Revenue for the quarter was 4.2 million dollars. We also raised $4.2M in a seed round, and the beta starts 6 weeks before launch, on January 18."
Answer:
- label "Q3 revenue", mentions ["4.2 million dollars"], sameAs "q3_revenue", derivedFrom null
- label "Seed funding raised", mentions ["$4.2M"], sameAs null, derivedFrom null
- label "Beta start date", mentions ["January 18"], sameAs null, derivedFrom "launch_date - 6 weeks"`;

export async function extractRaw({
  paragraph,
  table,
  today = new Date().toISOString().slice(0, 10),
}: {
  paragraph: string;
  table: Fact[];
  today?: string;
}): Promise<RawExtraction> {
  return (await getChatModel("super", { temperature: 0, thinking: false })
    .withStructuredOutput(extractionSchema)
    .invoke([
      ["system", extractionPrompt(table, today)],
      ["human", paragraph],
    ])) as RawExtraction;
}

export async function extractFacts(input: {
  paragraph: string;
  table: Fact[];
  today?: string;
}): Promise<Extraction> {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  return cleanExtraction(
    input.paragraph,
    await extractRaw({ ...input, today }),
    input.table,
    Number(today.slice(0, 4))
  );
}

const rewriteSchema = z.object({
  sentence: z
    .string()
    .describe("The sentence, changed only as much as it needs to be"),
});

export async function rewriteSentence({
  from,
  label,
  sentence,
  to,
}: {
  from: string;
  label: string;
  sentence: string;
  to: string;
}) {
  const result = await getChatModel("super", {
    temperature: 0,
    thinking: false,
  })
    .withStructuredOutput(rewriteSchema)
    .invoke([
      [
        "system",
        `A fact in a document has changed, so a sentence that depends on it may no longer be true. Rewrite only that sentence so it is true again. Keep its voice, tense and length, and change as little as you can. If it is still true as written, return it unchanged. Do not add anything new.

The fact: ${label}, which was ${from} and is now ${to}.`,
      ],
      ["human", sentence],
    ]);

  return result.sentence.trim();
}

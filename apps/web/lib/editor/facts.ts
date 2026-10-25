export interface Fact {
  derivedFrom?: string;
  id: string;
  label: string;
  unit: string;
  value: number | string;
}

export interface Mention {
  factId: string;
  text: string;
}

export interface Dependent {
  factId: string;
  sentence: string;
}

export interface RippleEntry {
  at: number;
  from: string;
  id: string;
  label: string;
  places: { after: string; before: string }[];
  reverted: boolean;
  to: string;
}

export const MAX_LOG = 30;

export interface FactData {
  dependents: Record<string, Dependent[]>;
  facts: Fact[];
  log: RippleEntry[];
  mentions: Record<string, Mention[]>;
}

export const emptyFactData = (): FactData => ({
  dependents: {},
  facts: [],
  log: [],
  mentions: {},
});

export interface Located extends Mention {
  end: number;
  start: number;
}

export interface Parsed {
  unit: string;
  value: number | string;
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const DAY_MS = 24 * 60 * 60 * 1000;

const SCALES: Record<string, number> = {
  b: 1e9,
  billion: 1e9,
  bn: 1e9,
  k: 1e3,
  m: 1e6,
  million: 1e6,
  mm: 1e6,
  thousand: 1e3,
};

const CURRENCY: Record<string, string> = {
  $: "USD",
  dollar: "USD",
  dollars: "USD",
  eur: "EUR",
  euro: "EUR",
  euros: "EUR",
  gbp: "GBP",
  pound: "GBP",
  pounds: "GBP",
  usd: "USD",
  "£": "GBP",
  "€": "EUR",
};

const currentYear = () => new Date().getFullYear();

export function hashText(text: string) {
  let first = 7;
  let second = 11;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    first = (first * 131 + code) % 4_294_967_291;
    second = (second * 257 + code) % 2_147_483_647;
  }

  return `${first.toString(36)}${second.toString(36)}`;
}

const DIGIT = /\d/;
const FACT_SIGNS = [
  /[$€£%]/,
  /\b\d[\d,.]*\s?(?:k|m|mm|bn|b|million|billion|thousand|percent|pct|dollars?|euros?|usd)\b/i,
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b/i,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,
  /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/,
  /\b\d[\d,.]*\s+[a-z]{3,}/i,
];

export function hasFact(text: string) {
  return (
    text.length >= 8 &&
    DIGIT.test(text) &&
    FACT_SIGNS.some((sign) => sign.test(text))
  );
}

interface DateStyle {
  comma: boolean;
  dot: boolean;
  kind: "dmy" | "iso" | "mdy" | "us";
  month: "full" | "short";
  ordinal: boolean;
  year: boolean;
}

const monthFrom = (name: string) => {
  const word = name.toLowerCase().replace(".", "");

  if (word.length < 3) {
    return -1;
  }

  return MONTHS.findIndex((month) => month.startsWith(word));
};

const toIso = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const fullYear = (year: string) => {
  const value = Number(year);

  return year.length === 2 ? 2000 + value : value;
};

interface ParsedDate {
  iso: string;
  style: DateStyle;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
const MONTH_FIRST =
  /^([A-Za-z]{3,9})(\.?)\s+(\d{1,2})(st|nd|rd|th)?(?:(,?)\s+(\d{4}))?$/;
const DAY_FIRST =
  /^(\d{1,2})(st|nd|rd|th)?\s+(?:of\s+)?([A-Za-z]{3,9})(\.?)(?:(,?)\s+(\d{4}))?$/;

const makeStyle = (
  parts: Partial<DateStyle> & Pick<DateStyle, "kind">
): DateStyle => ({
  comma: false,
  dot: false,
  month: "full",
  ordinal: false,
  year: true,
  ...parts,
});

function parseIsoDate(text: string): ParsedDate | null {
  const match = text.match(ISO_DATE);
  const iso = match
    ? toIso(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : null;

  return iso ? { iso, style: makeStyle({ kind: "iso" }) } : null;
}

function parseUsDate(text: string, refYear: number): ParsedDate | null {
  const match = text.match(US_DATE);
  const iso = match
    ? toIso(
        match[3] ? fullYear(match[3]) : refYear,
        Number(match[1]) - 1,
        Number(match[2])
      )
    : null;

  return match && iso
    ? { iso, style: makeStyle({ kind: "us", year: Boolean(match[3]) }) }
    : null;
}

function parseMonthFirst(text: string, refYear: number): ParsedDate | null {
  const match = text.match(MONTH_FIRST);
  const month = match ? monthFrom(match[1] ?? "") : -1;
  const iso =
    match && month >= 0
      ? toIso(match[6] ? Number(match[6]) : refYear, month, Number(match[3]))
      : null;

  return match && iso
    ? {
        iso,
        style: makeStyle({
          comma: match[5] === ",",
          dot: match[2] === ".",
          kind: "mdy",
          month: isFullMonth(match[1] ?? "") ? "full" : "short",
          ordinal: Boolean(match[4]),
          year: Boolean(match[6]),
        }),
      }
    : null;
}

function parseDayFirst(text: string, refYear: number): ParsedDate | null {
  const match = text.match(DAY_FIRST);
  const month = match ? monthFrom(match[3] ?? "") : -1;
  const iso =
    match && month >= 0
      ? toIso(match[6] ? Number(match[6]) : refYear, month, Number(match[1]))
      : null;

  return match && iso
    ? {
        iso,
        style: makeStyle({
          comma: match[5] === ",",
          dot: match[4] === ".",
          kind: "dmy",
          month: isFullMonth(match[3] ?? "") ? "full" : "short",
          ordinal: Boolean(match[2]),
          year: Boolean(match[6]),
        }),
      }
    : null;
}

const parseDateText = (text: string, refYear: number) => {
  const t = text.trim();

  return (
    parseIsoDate(t) ??
    parseUsDate(t, refYear) ??
    parseMonthFirst(t, refYear) ??
    parseDayFirst(t, refYear)
  );
};

const isFullMonth = (written: string) => {
  const word = written.replace(".", "").toLowerCase();

  return word === "may" || (word.length > 3 && word !== "sept");
};

const ordinal = (day: number) => {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return "th";
  }

  return ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : day % 10] ?? "th";
};

function writeDate(iso: string, style: DateStyle, refYear: number) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];

  if (style.kind === "iso") {
    return iso;
  }

  const showYear = style.year || y !== refYear;

  if (style.kind === "us") {
    return `${m}/${d}${showYear ? `/${y}` : ""}`;
  }

  const full = MONTHS[m - 1] ?? "";
  const name = `${full.charAt(0).toUpperCase()}${full.slice(1)}`;
  const month =
    style.month === "full"
      ? name
      : `${name.slice(0, 3)}${style.dot ? "." : ""}`;
  const day = `${d}${style.ordinal ? ordinal(d) : ""}`;

  if (style.kind === "dmy") {
    return `${day} ${month}${showYear ? `${style.comma ? "," : ""} ${y}` : ""}`;
  }

  return `${month} ${day}${showYear ? `${style.comma || !style.year ? "," : ""} ${y}` : ""}`;
}

const NUMBER_SHAPE = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;
const SCALE_SHAPE = /^(\s*)(million|billion|thousand|mm|bn|k|m|b)\b(.*)$/is;
const PERCENT_SHAPE = /^\s*(?:%|percent|per cent|pct)/i;

const toNumber = (digits: string) => Number(digits.replaceAll(",", ""));

const CURRENCY_SYMBOL = /[$€£]/;
const CURRENCY_WORD = /\b(dollars?|usd|euros?|eur|pounds?|gbp)\b/i;

const currencyOf = (text: string) => {
  const symbol = text.match(CURRENCY_SYMBOL)?.[0];

  if (symbol) {
    return CURRENCY[symbol];
  }

  const word = text.match(CURRENCY_WORD)?.[0];

  return word ? CURRENCY[word.toLowerCase()] : undefined;
};

export function parseMention(
  text: string,
  hint = "",
  refYear = currentYear()
): Parsed | null {
  const t = text.trim();
  const date = parseDateText(t, refYear);

  if (date) {
    return { unit: "date", value: date.iso };
  }

  const shape = t.match(NUMBER_SHAPE);

  if (!shape) {
    return null;
  }

  const [, prefix = "", digits = "", rest = ""] = shape;
  const base = toNumber(digits);

  if (Number.isNaN(base)) {
    return null;
  }

  if (PERCENT_SHAPE.test(rest)) {
    return { unit: "%", value: base };
  }

  const scale = rest.match(SCALE_SHAPE);
  const factor = scale ? (SCALES[(scale[2] ?? "").toLowerCase()] ?? 1) : 1;
  const currency = currencyOf(`${prefix}${rest}`);

  return {
    unit: currency ?? (hint || "count"),
    value: Math.round(base * factor * 1e6) / 1e6,
  };
}

export const compatible = (a: string, b: string) =>
  a === b ||
  (a === "count" && !["%", "date"].includes(b)) ||
  (b === "count" && !["%", "date"].includes(a));

export const sameValue = (a: number | string, b: number | string) => {
  if (typeof a === "string" || typeof b === "string") {
    return a === b;
  }

  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
};

const neededDecimals = (value: number, limit: number) =>
  Number(value.toFixed(limit)).toString().split(".")[1]?.length ?? 0;

function writeNumber(value: number, decimals: number, commas: boolean) {
  const fixed = value.toFixed(decimals);
  const [whole = "", fraction] = fixed.split(".");
  const grouped = commas ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : whole;

  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function formatLike(
  original: string,
  value: number | string,
  refYear = currentYear()
): string | null {
  if (typeof value === "string") {
    const date = parseDateText(original, refYear);

    return date ? writeDate(value, date.style, refYear) : null;
  }

  const shape = original.match(NUMBER_SHAPE);

  if (!shape) {
    return null;
  }

  const [, prefix = "", digits = "", rest = ""] = shape;
  const decimals = digits.split(".")[1]?.length ?? 0;
  const money = Boolean(currencyOf(`${prefix}${rest}`));
  const limit = money ? 2 : 4;

  if (PERCENT_SHAPE.test(rest)) {
    return `${prefix}${writeNumber(
      value,
      Math.max(decimals, neededDecimals(value, 2)),
      false
    )}${rest}`;
  }

  const scale = rest.match(SCALE_SHAPE);

  if (scale) {
    const factor = SCALES[(scale[2] ?? "").toLowerCase()] ?? 1;
    const mantissa = value / factor;
    const places = Math.min(3, Math.max(decimals, neededDecimals(mantissa, 3)));

    return `${prefix}${writeNumber(mantissa, places, digits.includes(","))}${rest}`;
  }

  const commas =
    digits.includes(",") ||
    (Math.abs(value) >= 1000 && toNumber(digits) < 1000);

  return `${prefix}${writeNumber(
    value,
    Math.max(decimals, neededDecimals(value, limit)),
    commas
  )}${rest}`;
}

type Quantity =
  | { kind: "date"; ms: number }
  | { kind: "duration"; days: number; months: number }
  | { kind: "number"; n: number };

const UNIT_WORDS = new Set([
  "day",
  "days",
  "week",
  "weeks",
  "month",
  "months",
  "year",
  "years",
]);

const TOKEN =
  /\s*(?:(\d+(?:\.\d+)?)\s*(days?|weeks?|months?|years?)\b|(\d+(?:\.\d+)?)|([a-z][a-z0-9_]*)|([-+*/()]))/iy;

function tokenize(expression: string) {
  const tokens: { text: string; type: "id" | "num" | "op" | "span" }[] = [];
  let position = 0;

  while (position < expression.length) {
    TOKEN.lastIndex = position;

    const match = TOKEN.exec(expression);

    if (!match) {
      return expression.slice(position).trim() ? null : tokens;
    }

    position = TOKEN.lastIndex;

    if (match[1] !== undefined) {
      tokens.push({ text: `${match[1]} ${match[2]}`, type: "span" });
    } else if (match[3] !== undefined) {
      tokens.push({ text: match[3], type: "num" });
    } else if (match[4] !== undefined) {
      tokens.push({ text: match[4].toLowerCase(), type: "id" });
    } else if (match[5] !== undefined) {
      tokens.push({ text: match[5], type: "op" });
    }
  }

  return tokens;
}

export function dependsOn(expression: string) {
  return (tokenize(expression) ?? [])
    .filter((token) => token.type === "id" && !UNIT_WORDS.has(token.text))
    .map((token) => token.text);
}

const dateMs = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);

  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

function addMonths(ms: number, months: number) {
  const date = new Date(ms);
  const day = date.getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);

  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();

  date.setUTCDate(Math.min(day, last));

  return date.getTime();
}

function combine(op: string, a: Quantity, b: Quantity): Quantity | null {
  if (a.kind === "number" && b.kind === "number") {
    const n = {
      "-": a.n - b.n,
      "*": a.n * b.n,
      "/": a.n / b.n,
      "+": a.n + b.n,
    }[op];

    return n === undefined || !Number.isFinite(n)
      ? null
      : { kind: "number", n };
  }

  if (
    a.kind === "date" &&
    b.kind === "duration" &&
    (op === "+" || op === "-")
  ) {
    const sign = op === "+" ? 1 : -1;

    return {
      kind: "date",
      ms: addMonths(a.ms, sign * b.months) + sign * b.days * DAY_MS,
    };
  }

  if (a.kind === "date" && b.kind === "date" && op === "-") {
    return { kind: "number", n: Math.round((a.ms - b.ms) / DAY_MS) };
  }

  if (a.kind === "duration" && b.kind === "number" && op === "*") {
    return { days: a.days * b.n, kind: "duration", months: a.months * b.n };
  }

  return null;
}

const DAYS = /^day/i;
const WEEKS = /^week/i;
const YEARS = /^year/i;

function durationOf(text: string): Quantity {
  const [amount = "0", unit = ""] = text.split(" ");
  const n = Number(amount);

  if (DAYS.test(unit)) {
    return { days: n, kind: "duration", months: 0 };
  }

  if (WEEKS.test(unit)) {
    return { days: n * 7, kind: "duration", months: 0 };
  }

  return { days: 0, kind: "duration", months: YEARS.test(unit) ? n * 12 : n };
}

function lookup(
  values: Map<string, number | string>,
  id: string
): Quantity | null {
  const value = values.get(id);

  if (typeof value === "number") {
    return { kind: "number", n: value };
  }

  return typeof value === "string" ? { kind: "date", ms: dateMs(value) } : null;
}

export function evaluate(
  expression: string,
  values: Map<string, number | string>
): number | string | null {
  const found = tokenize(expression);

  if (!found || found.length === 0) {
    return null;
  }

  const tokens = found;
  let at = 0;

  const atom = (): Quantity | null => {
    const token = tokens[at];

    at += 1;

    if (!token) {
      return null;
    }

    if (token.type === "num") {
      return { kind: "number", n: Number(token.text) };
    }

    if (token.type === "span") {
      return durationOf(token.text);
    }

    if (token.type === "id") {
      return lookup(values, token.text);
    }

    if (token.text === "(") {
      const inner = sum();

      at += 1;

      return inner;
    }

    return null;
  };

  const product = (): Quantity | null => {
    let left = atom();

    while (left && (tokens[at]?.text === "*" || tokens[at]?.text === "/")) {
      const op = tokens[at]?.text ?? "*";

      at += 1;

      const right = atom();

      left = right ? combine(op, left, right) : null;
    }

    return left;
  };

  function sum(): Quantity | null {
    let left = product();

    while (left && (tokens[at]?.text === "+" || tokens[at]?.text === "-")) {
      const op = tokens[at]?.text ?? "+";

      at += 1;

      const right = product();

      left = right ? combine(op, left, right) : null;
    }

    return left;
  }

  const result = sum();

  if (!result || at < tokens.length) {
    return null;
  }

  if (result.kind === "date") {
    return new Date(result.ms).toISOString().slice(0, 10);
  }

  return result.kind === "number" ? Math.round(result.n * 1e6) / 1e6 : null;
}

export function followFrom(
  facts: Fact[],
  changedId: string,
  value: number | string
) {
  const values = new Map(facts.map((fact) => [fact.id, fact.value]));
  const updated = new Map<string, number | string>([[changedId, value]]);

  values.set(changedId, value);

  for (let pass = 0; pass < 8; pass += 1) {
    let moved = false;

    for (const fact of facts) {
      if (
        !fact.derivedFrom ||
        fact.id === changedId ||
        !dependsOn(fact.derivedFrom).some((id) => updated.has(id))
      ) {
        continue;
      }

      const next = evaluate(fact.derivedFrom, values);
      const right =
        next !== null && (fact.unit === "date") === (typeof next === "string");

      if (right && !sameValue(next, values.get(fact.id) ?? "")) {
        values.set(fact.id, next);
        updated.set(fact.id, next);
        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return updated;
}

export function locateMentions(text: string, mentions: Mention[]): Located[] {
  const found: Located[] = [];
  const taken = (start: number, end: number) =>
    found.some((item) => start < item.end && end > item.start);

  for (const mention of mentions) {
    let from = 0;

    while (from <= text.length) {
      const start = text.indexOf(mention.text, from);

      if (start < 0) {
        break;
      }

      const end = start + mention.text.length;

      if (taken(start, end)) {
        from = start + 1;
        continue;
      }

      found.push({ ...mention, end, start });
      break;
    }
  }

  return found.sort((a, b) => a.start - b.start);
}

export interface Block {
  key: string;
  text: string;
}

export interface Proposal {
  blockKey: string;
  end: number;
  factId: string;
  from: string;
  kind: "derived" | "same";
  start: number;
  to: string;
}

export interface Change {
  factId: string;
  source: { blockKey: string; end: number; start: number };
  value: number | string;
}

function rewritten(
  text: string,
  unit: string,
  next: number | string,
  refYear: number
) {
  const parsed = parseMention(text, unit, refYear);

  if (
    !(parsed && compatible(parsed.unit, unit)) ||
    sameValue(parsed.value, next)
  ) {
    return null;
  }

  const to = formatLike(text, next, refYear);

  return to && to !== text ? to : null;
}

export function proposeRipple({
  blocks,
  change,
  data,
  refYear = currentYear(),
}: {
  blocks: Block[];
  change: Change;
  data: FactData;
  refYear?: number;
}) {
  const updated = followFrom(data.facts, change.factId, change.value);
  const proposals: Proposal[] = [];

  for (const block of blocks) {
    const mentions = data.mentions[hashText(block.text)] ?? [];

    for (const mention of locateMentions(block.text, mentions)) {
      const here =
        block.key === change.source.blockKey &&
        mention.start < change.source.end &&
        mention.end > change.source.start;
      const next = updated.get(mention.factId);
      const fact = data.facts.find((item) => item.id === mention.factId);
      const to =
        here || next === undefined || !fact
          ? null
          : rewritten(mention.text, fact.unit, next, refYear);

      if (to) {
        proposals.push({
          blockKey: block.key,
          end: mention.end,
          factId: mention.factId,
          from: mention.text,
          kind: mention.factId === change.factId ? "same" : "derived",
          start: mention.start,
          to,
        });
      }
    }
  }

  return {
    facts: data.facts.map((fact) => {
      const value = updated.get(fact.id);

      return value === undefined ? fact : { ...fact, value };
    }),
    proposals,
    updated,
  };
}

const MONTH_WORDS = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*";
const VALUE_SPANS = [
  new RegExp(
    `\\b${MONTH_WORDS}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b|\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_WORDS}\\.?(?:,?\\s+\\d{4})?\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?\\b`,
    "i"
  ),
  /\d+(?:\.\d+)?\s?(?:%|percent|per cent|pct)/i,
  /(?:(?:US\$|USD\s?|EUR\s?|GBP\s?|[$€£])\s?)?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|thousand|mm|bn|k|m|b)\b)?(?:\s(?:dollars?|usd|euros?|eur|pounds?|gbp)\b)?/i,
];

export function valueIn(text: string) {
  for (const pattern of VALUE_SPANS) {
    const found = text.match(pattern)?.[0];

    if (found) {
      return found.trim();
    }
  }

  return null;
}

export interface Extraction {
  dependents: Dependent[];
  facts: {
    derivedFrom?: string | null;
    id: string;
    label: string;
    mentions: string[];
    unit: string;
    value: number | string;
  }[];
}

export interface RawExtraction {
  dependents: { about: string; sentence: string }[];
  facts: {
    derivedFrom: string | null;
    label: string;
    mentions: string[];
    sameAs: string | null;
  }[];
}

const FILLER = new Set([
  "a",
  "amount",
  "an",
  "and",
  "at",
  "for",
  "in",
  "number",
  "of",
  "on",
  "our",
  "the",
  "to",
  "total",
  "value",
]);

const WORD = /[a-z0-9]+/g;
const NOT_ID = /[^a-z0-9]+/g;
const EDGE_UNDERSCORES = /^_+|_+$/g;

const wordsOf = (label: string) =>
  new Set(
    (label.toLowerCase().match(WORD) ?? []).filter((word) => !FILLER.has(word))
  );

function similar(a: string, b: string) {
  const x = wordsOf(a);
  const y = wordsOf(b);
  let shared = 0;

  for (const word of x) {
    if (y.has(word)) {
      shared += 1;
    }
  }

  return x.size > 0 && y.size > 0 && shared / (x.size + y.size - shared) >= 0.6;
}

const slugOf = (label: string) =>
  label
    .toLowerCase()
    .replaceAll(NOT_ID, "_")
    .replaceAll(EDGE_UNDERSCORES, "")
    .slice(0, 40);

function freshId(label: string, taken: Set<string>) {
  const base = slugOf(label) || "fact";
  let id = base;
  let attempt = 1;

  while (taken.has(id)) {
    attempt += 1;
    id = `${base}_${attempt}`;
  }

  taken.add(id);

  return id;
}

const mentionsIn = (paragraph: string, texts: string[]) => [
  ...new Set(
    texts.flatMap((text) => {
      const value = valueIn(text);

      return value && paragraph.includes(value) ? [value] : [];
    })
  ),
];

function knownFact(
  table: Fact[],
  found: Extraction["facts"],
  item: RawExtraction["facts"][number],
  unit: string
) {
  const sameAs = item.sameAs?.trim().toLowerCase();
  const named = sameAs ? table.find((fact) => fact.id === sameAs) : undefined;

  return named && compatible(named.unit, unit)
    ? named
    : [...table, ...found].find(
        (fact) => compatible(fact.unit, unit) && similar(fact.label, item.label)
      );
}

export function cleanExtraction(
  paragraph: string,
  raw: RawExtraction,
  table: Fact[],
  refYear = currentYear()
): Extraction {
  const facts: Extraction["facts"] = [];
  const taken = new Set(table.map((fact) => fact.id));

  for (const item of raw.facts) {
    const mentions = mentionsIn(paragraph, item.mentions);
    const [first] = mentions;
    const parsed = first ? parseMention(first, "", refYear) : null;
    const label = item.label.trim().slice(0, 80);

    if (!(first && parsed && label)) {
      continue;
    }

    const match = knownFact(table, facts, { ...item, label }, parsed.unit);
    const unit = match?.unit ?? parsed.unit;
    const kept = mentions.filter((text) => {
      const mention = parseMention(text, unit, refYear);

      return mention !== null && compatible(mention.unit, unit);
    });

    if (kept.length === 0) {
      continue;
    }

    const id = match?.id ?? freshId(label, taken);
    const again = facts.find((fact) => fact.id === id);

    if (again) {
      again.mentions = [...new Set([...again.mentions, ...kept])];
    } else {
      facts.push({
        derivedFrom: item.derivedFrom?.trim() || null,
        id,
        label: match?.label ?? label,
        mentions: kept,
        unit,
        value: parsed.value,
      });
    }
  }

  const dependents: Dependent[] = [];

  for (const item of raw.dependents) {
    const target = [...facts, ...table].find(
      (fact) =>
        fact.id === item.about.trim().toLowerCase() ||
        similar(fact.label, item.about)
    );

    if (target && item.sentence && paragraph.includes(item.sentence)) {
      dependents.push({ factId: target.id, sentence: item.sentence });
    }
  }

  return { dependents, facts };
}

export function mergeExtraction(
  data: FactData,
  paragraph: string,
  extraction: Extraction
): FactData {
  const facts = [...data.facts];
  const values = new Map(facts.map((fact) => [fact.id, fact.value]));

  for (const found of extraction.facts) {
    if (!values.has(found.id)) {
      values.set(found.id, found.value);
    }
  }

  const derivation = (found: Extraction["facts"][number]) => {
    const expression = found.derivedFrom?.trim();
    const needs = expression ? dependsOn(expression) : [];

    if (
      !expression ||
      needs.length === 0 ||
      needs.some((id) => id === found.id || !values.has(id))
    ) {
      return;
    }

    const result = evaluate(expression, values);

    return result !== null && sameValue(result, found.value)
      ? expression
      : undefined;
  };

  for (const found of extraction.facts) {
    const at = facts.findIndex((fact) => fact.id === found.id);
    const known = at >= 0 ? facts[at] : undefined;

    if (!known) {
      facts.push({
        derivedFrom: derivation(found),
        id: found.id,
        label: found.label,
        unit: found.unit,
        value: found.value,
      });
    } else if (!known.derivedFrom) {
      facts[at] = { ...known, derivedFrom: derivation(found) };
    }
  }

  const sound = facts;
  const mentions = extraction.facts
    .flatMap((fact) => fact.mentions.map((text) => ({ factId: fact.id, text })))
    .sort((a, b) => paragraph.indexOf(a.text) - paragraph.indexOf(b.text));

  return {
    dependents: {
      ...data.dependents,
      [hashText(paragraph)]: extraction.dependents,
    },
    facts: sound,
    log: data.log,
    mentions: { ...data.mentions, [hashText(paragraph)]: mentions },
  };
}

const isEntry = (value: unknown): value is RippleEntry => {
  const entry = value as Partial<RippleEntry> | null;

  return (
    typeof entry?.id === "string" &&
    typeof entry.at === "number" &&
    typeof entry.from === "string" &&
    typeof entry.to === "string" &&
    typeof entry.label === "string" &&
    Array.isArray(entry.places)
  );
};

export function readFactData(value: unknown): FactData {
  const data = value as Partial<FactData> | null | undefined;

  if (
    !(data && Array.isArray(data.facts)) ||
    typeof data.mentions !== "object" ||
    data.mentions === null
  ) {
    return emptyFactData();
  }

  return {
    dependents:
      typeof data.dependents === "object" && data.dependents !== null
        ? data.dependents
        : {},
    facts: data.facts.filter(
      (fact) => typeof fact?.id === "string" && typeof fact.unit === "string"
    ),
    log: Array.isArray(data.log)
      ? data.log.filter(isEntry).slice(-MAX_LOG)
      : [],
    mentions: data.mentions,
  };
}

export function kindOf(unit: string) {
  if (unit === "date") {
    return "date";
  }

  if (unit === "%") {
    return "percentage";
  }

  return ["USD", "EUR", "GBP"].includes(unit) ? "amount" : "number";
}

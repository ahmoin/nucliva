# Nucliva

### [nucliva.com](https://nucliva.com)

![Nucliva, the AI workspace that writes like you](apps/web/app/opengraph-image.png)

An AI writing workspace that writes in your voice. Docs, slides and sheets in one place, with an assistant that researches the web, drafts, and shows every change as a suggestion you accept or reject.

> **Work in progress.** Nucliva is being built for the Nebius x NVIDIA Global AI Hackathon (deadline Oct 30, 2026). Things move fast, some parts are rough, and this README will grow with the project. If something here does not match what you see, the code is right and the README is behind.

## What works today

- **Docs editor.** A Lexical-based page editor with styles, lists, quotes, tables, alignment, indentation, a Google Docs style ruler with margins and tab stops, and zoom.
- **AI chat and edits.** Ask for a change and the edit lands in the document as green and red suggestions, down to single words, each with its own Accept and Reject, plus Accept All and Reject All. Chat history is saved per document and works as a tree, so you can go back, edit, branch and copy.
- **Web research.** Ask it to research something and it searches with Tavily, shows the steps and sources, and cites only when you ask.
- **Inline autocomplete.** Ghost text as you type, accepted with Tab.
- **The ripple.** Change a number, amount, percentage or date and Nucliva suggests the same change everywhere else the document states it, each written the way that place writes it (`$4.2M` stays short, `$4,200,000` stays long). Dates that follow from other dates ("the beta starts 6 weeks before launch") are recalculated. Tab accepts the next suggestion, Esc dismisses them all. See [How the ripple works](#how-the-ripple-works).
- **Sheets and slides.** Early versions built on FortuneSheet and a custom designer.
- **Style profile and knowledge base.** Paste past writing so drafts sound like you. Text is chunked and embedded into pgvector.
- **Accounts.** Email and password, plus Google and GitHub sign in.
- **Landing site.** A home page and a public `/solutions` catalog with a page for every solution.

## What is not done yet

- The slides and sheets editors need much more work.
- Research-to-deck and document-to-style workflows are only partly wired.
- Mobile layouts for the editor are rough.
- Tests. There are none yet.

## Built with

- **Models:** NVIDIA Nemotron (Nano, Super and Ultra) served on [Nebius Token Factory](https://tokenfactory.nebius.com), through its OpenAI compatible API
- **Web grounding:** [Tavily](https://tavily.com) for search and sources
- **Orchestration:** LangChain
- **App:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui on Base UI
- **Editor:** Lexical
- **Auth:** Better Auth
- **Data:** Neon Postgres with pgvector, via Drizzle ORM
- **Monorepo:** pnpm workspaces and Turborepo

## Layout

```
apps/web                 the Next.js app
packages/db              Drizzle client and schema
packages/ui              shared shadcn components and styles
packages/typescript-config
```

## Getting started

You need Node 20 or newer and [pnpm](https://pnpm.io).

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in `apps/web/.env.local`:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (pooled) |
| `BETTER_AUTH_SECRET` | any long random string |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | the app URL, `http://localhost:3000` locally |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub OAuth (optional) |
| `NEBIUS_API_KEY` | a Nebius Token Factory key |
| `TAVILY_API_KEY` | a Tavily key |
| `LANGSMITH_*` | LangSmith tracing (optional) |

In production (nucliva.com), set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://nucliva.com`, and add `https://nucliva.com/api/auth/callback/google` as an authorized redirect URI in the Google console. For GitHub, add `https://nucliva.com/api/auth/callback/github` (and `http://localhost:3000/api/auth/callback/github` for local work) to the OAuth app's redirect URIs.

Set up the database, then start the app:

```bash
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000.

## Scripts

```bash
pnpm dev          # run the app
pnpm build        # production build
pnpm typecheck    # type check every package
pnpm lint         # check with Ultracite (Biome)
pnpm format       # fix formatting
pnpm db:studio    # browse the database
```

## How the ripple works

A model understands, and code does the math.

1. **Reading.** In the background, each paragraph that looks like it has a fact in it is read by a Nemotron model, which says what each fact is called and where the paragraph states it. Its answer is checked in code: every value is read from the words, not taken from the model.
2. **Noticing.** When the caret leaves a fact that was changed (or pauses on it), the new value is read from the text.
3. **Rippling.** Every other place that states the same fact gets a suggestion, written in that place's own format. Facts worked out from others, like dates, are recalculated in code. A model never does the arithmetic.
4. **Settling.** The suggestions are the same green and red ones the chat makes. Sentences that lean on a fact without stating it are rewritten by the model and shown more quietly, with a dashed underline.

Everything stays in one document. The facts it has found are saved with it.

### How well does it work?

`apps/web/scripts/ripple-eval.mts` runs two test documents through the same code the editor uses. In one, Q3 revenue is written five ways next to a different `$4.2M`. In the other, a beta date is worked out from a launch date. It changes one fact in each, and checks the suggestions against the right ones.

```bash
cd apps/web
pnpm dlx tsx scripts/ripple-eval.mts --runs 5    # with the model (needs NEBIUS_API_KEY)
pnpm dlx tsx scripts/ripple-eval.mts --offline   # the code alone, no model
```

With the model, over 5 runs: **30 of 30 suggestions were correct** (precision 100%, recall 100%), and the different `$4.2M` was never touched. That is two small documents, so read it as a check that the idea holds, not as a measure of every document. Pass `--verbose` to see what the model said about each paragraph.

## Try it

There is no shared demo login. Every page under `/solutions` (for example `/solutions/founders/investor-updates`) has a **Try it now** button that opens a sandbox workspace for that solution, with no sign up. It creates a guest account with a lived-in workspace for that line of work: earlier documents, a slide deck, a sheet, writing samples to match a voice, and a knowledge base of indexed sources. You land in a document of rough notes with the request for that solution already typed in. Press Enter, then accept or reject what comes back. The home page has a **Try the sandbox** button for this, and an interactive tour takes over from there. It dims everything except the thing to use, waits for you to actually do each step (send the request, accept the changes, try the ripple on an example it adds for you), and then sends you around the workspace: My Files, another file, Style Profile and Knowledge Base. Every step can be skipped, and the **Tour** button brings it back. If you sign up afterwards, your work moves to your account. Guests have a small hourly allowance of AI requests. Try it at [nucliva.com](https://nucliva.com).

## Roadmap

- A stronger slides editor and a research-to-deck flow
- Document-to-style drafting from a few bullet points
- Connectors for Drive, Notion and Slack
- An architecture diagram and a demo video
- Sandbox notes written for each solution, not just each line of work
- Tests and a deployment

## License

[MIT](LICENSE.md)

# Nucliva

An AI writing workspace that writes in your voice. Docs, slides and sheets in one place, with an assistant that researches the web, drafts, and shows every change as a suggestion you accept or reject.

> **Work in progress.** Nucliva is being built for the Nebius x NVIDIA Global AI Hackathon (deadline 30 Oct 2026). Things move fast, some parts are rough, and this README will grow with the project. If something here does not match what you see, the code is right and the README is behind.

## What works today

- **Docs editor.** A Lexical-based page editor with styles, lists, quotes, tables, alignment, indentation, a Google Docs style ruler with margins and tab stops, and zoom.
- **AI chat and edits.** Ask for a change and the edit lands in the document as green and red suggestions, down to single words, each with its own Accept and Reject, plus Accept All and Reject All. Chat history is saved per document and works as a tree, so you can go back, edit, branch and copy.
- **Web research.** Ask it to research something and it searches with Tavily, shows the steps and sources, and cites only when you ask.
- **Inline autocomplete.** Ghost text as you type, accepted with Tab.
- **Sheets and slides.** Early versions built on FortuneSheet and a custom designer.
- **Style profile and knowledge base.** Paste past writing so drafts sound like you. Text is chunked and embedded into pgvector.
- **Accounts.** Email and password, plus Google sign in.
- **Landing site.** A home page and a public `/solutions` catalogue with a page for every solution.

## What is not done yet

- The slides and sheets editors need much more work.
- Research-to-deck and document-to-style workflows are only partly wired.
- GitHub sign in is in the code but has no live credentials or button.
- Mobile layouts for the editor are rough.
- Tests. There are none yet.

The running checklist lives in `TASK.md`.

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
| `NEBIUS_API_KEY` | a Nebius Token Factory key |
| `TAVILY_API_KEY` | a Tavily key |
| `LANGSMITH_*` | LangSmith tracing (optional) |

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

## Try it

There will be no shared demo login. Instead, every page under `/solutions` (for example `/solutions/founders/investor-updates`) will open a ready-made sandbox workspace for that solution, with sample documents, style and sources already loaded, so you can try it without signing up. This is planned and not built yet. For now those pages show the prompt and a preview, and "Try it free" goes to sign up. A live link will go here once Nucliva is deployed.

## Roadmap

- A stronger slides editor and a research-to-deck flow
- Document-to-style drafting from a few bullet points
- Connectors for Drive, Notion and Slack
- An architecture diagram and a demo video
- A sandbox workspace behind every solution page, as the live demo
- Tests and a deployment

## License

[MIT](LICENSE.md)

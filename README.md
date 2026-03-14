# UIGen (UI Generator)

<p align="center">
  <img src="./public/uigen-logo.svg" alt="UIGen logo" width="140" height="140" />
</p>

<p align="center">
  <b>UIGen</b> is a Next.js application that helps you generate modern, aesthetic UI by chatting with an AI agent.
  It integrates authentication (Clerk), persistence (Postgres + Prisma), and background workflows (Inngest + E2B sandbox) to generate and iterate on UI code.
</p>

---

## What this project does

- **Chat-to-UI**: a UI-first experience for generating website/app UI.
- **AI coding agent**: an Inngest function spins up an isolated E2B sandbox and uses `@inngest/agent-kit` (Gemini model) to run iterative “coding agent” steps.
- **Auth + user persistence**: Clerk handles sign-in/up and Prisma persists a `User` record keyed by `clerkId`.

## Tech stack

- **Framework**: Next.js (App Router), React
- **Auth**: Clerk (`@clerk/nextjs`)
- **DB / ORM**: Postgres (Docker) + Prisma (Postgres adapter)
- **Background jobs**: Inngest (`inngest/next`)
- **Sandbox execution**: E2B (`@e2b/code-interpreter`)
- **UI**: Tailwind CSS + shadcn/ui components + Radix + Sonner

## Project structure (high-level)

- **`app/`**: Next.js routes, layouts, and API handlers
  - **`app/(root)/`**: main pages (home, sign-in, sign-up)
  - **`app/api/inngest/`**: Inngest handler + functions
- **`modules/`**: feature modules (auth, home UI)
- **`lib/`**: shared utilities (e.g., Prisma connection in `lib/db.ts`)
- **`prisma/`**: schema + migrations
- **`inngest/`**: Inngest client + helpers
- **`public/`**: static assets

## Prerequisites

- **Node.js**: recent LTS recommended
- **Docker Desktop**: required for local Postgres via `docker compose`
- **Accounts/keys** (for full functionality):
  - Clerk project keys
  - E2B API key (if required by your E2B setup)
  - Inngest configuration (if you plan to run Inngest outside of local mode)

## Environment variables

Create a `.env` file in `uigen/` (this repository does not include one by default).

### Required (local development)

- **`DATABASE_URL`**: Postgres connection string used by Prisma

Example for the provided Docker compose database (note port **5431** on host):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5431/postgres"
```

### Clerk (recommended / required for auth flows)

Clerk typically expects:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

Depending on your Clerk configuration you may also need redirect URLs and webhook secrets.

### E2B (for sandbox execution)

E2B may require an API key in your environment (var name depends on your setup/provider). If sandbox creation fails, check your E2B docs and configure the required key(s).

## Setup & run (development)

From the `uigen/` directory:

```bash
npm install
npm run dev
```

What `npm run dev` does:

- Starts Postgres using the repo-root `docker-compose.yml`
- Starts the Next.js dev server

Open:

- **App**: `http://localhost:3000`
- **Database** (host): `localhost:5431`

## Database & Prisma

The Prisma schema is in `prisma/schema.prisma` and currently includes a `User` model persisted after Clerk authentication.

Common Prisma commands (run from `uigen/`):

```bash
npx prisma migrate dev
npx prisma studio
```

## Inngest (background functions)

This project exposes an Inngest handler at:

- **`/api/inngest`** (see `app/api/inngest/route.ts`)

The main function lives in:

- **`app/api/inngest/functions.ts`**

In particular, the `code-agent` function:

- Creates an E2B sandbox
- Runs an agent network (Gemini model via `@inngest/agent-kit`)
- Writes files into the sandbox and triggers a rebuild
- Returns a sandbox URL and a generated task summary

## Scripts

- **`npm run dev`**: start Postgres (Docker) + Next.js dev server
- **`npm run build`**: production build
- **`npm run start`**: run the built app
- **`npm run lint`**: lint the codebase

## Deployment notes

- Provide a managed Postgres (or a production DB) and set `DATABASE_URL`.
- Configure Clerk environment variables for your deployed domain.
- Inngest + E2B integrations may require additional production configuration (signing keys, secrets, network access).

## Troubleshooting

- **Postgres won’t start**: ensure Docker Desktop is running and port `5431` is free.
- **Auth pages fail**: confirm Clerk keys are present and match your Clerk dashboard config.
- **Prisma connection errors**: verify `DATABASE_URL` points to the correct host/port and credentials.
- **Inngest/sandbox fails**: confirm E2B sandbox template availability and required E2B credentials.

## License

Add your license here (e.g., MIT) or reference a `LICENSE` file.


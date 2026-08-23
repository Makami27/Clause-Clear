# ClauseClear

AI-powered contract analysis for non-lawyers. Upload a contract, get a plain-English summary, ranked red flags, and a chat interface to ask questions about it.

## Structure

```
backend/    Express + TypeScript + Prisma + Anthropic API
frontend/   Next.js (App Router) + Tailwind
```

## Local setup

### Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET
npx prisma migrate dev --name init
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                 # http://localhost:3000
```

You'll need a Postgres database — easiest local option is `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres` or a free instance on Neon/Supabase.

## What's built

- Auth (register/login, JWT, bcrypt)
- Contract upload (PDF/DOCX/TXT) with text extraction
- AI analysis: summary + risk level (versioned prompt, `src/services/prompts.ts`)
- AI red-flag detection: per-clause risk with recommendations
- Contract chat (grounded in the uploaded contract's text, with history)
- Free-tier usage limit (3 contracts/month) — Prisma model supports PRO/TEAM plans
- Landing page, auth pages, dashboard, contract detail page — dark theme

## What's NOT built yet (next steps toward "fully operational")

1. **File storage** — uploaded files aren't persisted anywhere (only extracted text is saved to Postgres). Not blocking for launch — the app only ever needs the extracted text, not the original file. Wire up S3/R2 later if you want "download original" support.
2. **Payments** — `Plan` enum exists in the schema but there's no Stripe integration. Needed to actually gate PRO/TEAM and take payment.
3. **Report export** — `Report` model exists but there's no endpoint to generate/download a PDF report yet.
4. **Contract comparison** — prompt exists (`comparison` task type) but no route/UI uses it yet.
5. **Email verification / password reset** — auth is bare-bones (register/login only).
6. **Tests** — none yet.

~~Rate limiting~~ — done: `backend/src/middleware/rateLimit.ts`, an in-memory per-user limiter (10 AI calls/min, 20 uploads/min). No new dependency. Note: it's per-process, so if you ever scale the backend to multiple instances, swap it for a Redis-backed limiter.

## Deployment plan

- **Backend**: Railway or Render (Node + Postgres addon, or point at Neon). Set env vars from `.env.example`.
- **Frontend**: Vercel. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- **Database**: Neon or Supabase (managed Postgres, free tier works for launch).

## Priority order for next session

1. Get it running locally end-to-end (backend + frontend + local Postgres) — biggest unknown is whether anything breaks on first run.
2. Wire up file storage (R2 is cheapest).
3. Deploy backend + frontend + DB so there's a live URL.
4. Add Stripe for the paywall.
5. Report export.

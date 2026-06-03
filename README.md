# FutureSelf AI

FutureSelf AI is a Chrome Extension and dashboard that pauses important internet actions, runs a multi-agent decision engine, and shows a Future Impact Report before the action completes.

Tagline: "See the consequences before making the decision."

## What is included

- Manifest V3 Chrome extension with content scripts, popup settings, background service worker, and Chrome Storage history.
- Interceptors for Amazon, Flipkart, Gmail, LinkedIn Jobs, Naukri, Indeed, Zerodha, and Groww.
- Next.js dashboard and API routes.
- Parallel agent orchestration for financial impact, opportunity cost, risk, emotion detection, and memory.
- Demo data generator for hackathon judging.
- PostgreSQL schema with Prisma.
- Optional OpenAI enrichment and ChromaDB memory storage.

## Project structure

```text
apps/
  extension/   Chrome MV3 extension built with React, TypeScript, TailwindCSS, Framer Motion
  web/         Next.js dashboard and API backend
```

## Install

```bash
npm install
```

## Run the dashboard and API

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

## Build the Chrome extension

```bash
npm run build:extension
```

Then load this folder in Chrome:

```text
apps/extension/dist
```

Chrome steps:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select `apps/extension/dist`.

## Demo mode

Demo mode is enabled in the extension popup by default. The extension tries to call:

```text
http://localhost:3000/api/analyze
```

If the backend is unavailable, it falls back to a local demo report so judges can still see the full modal flow.

Dashboard demo data is available at:

```text
GET /api/demo
```

## API

Analyze a decision:

```http
POST /api/analyze
Content-Type: application/json
```

Example body:

```json
{
  "decisionType": "purchase",
  "website": "Amazon",
  "title": "iPhone 17 Pro",
  "price": 149900,
  "category": "Smartphones",
  "actionLabel": "Buy Now",
  "url": "https://www.amazon.in/demo",
  "capturedAt": "2026-06-03T00:00:00.000Z"
}
```

Output:

```json
{
  "decisionType": "purchase",
  "regretProbability": 68,
  "confidenceScore": 84,
  "recommendation": "Wait 48 hours",
  "insights": []
}
```

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local`.

```text
OPENAI_API_KEY=optional
OPENAI_MODEL=gpt-4.1-mini
DISABLE_OPENAI=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/futureself
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=futureself_decisions
```

Set `DISABLE_OPENAI=false` to enrich reports with OpenAI. Without an API key, the custom agent engine still works.

## Deployment

Dashboard and API:

- Deploy `apps/web` to Vercel.
- Set the environment variables in Vercel.
- Update the extension popup Backend API URL to the deployed Vercel URL.

Database:

- Create PostgreSQL on Railway, Render, Supabase, or Neon.
- Set `DATABASE_URL`.
- Use `apps/web/prisma/schema.prisma` as the schema.

Vector memory:

- Run ChromaDB separately.
- Set `CHROMA_URL` and `CHROMA_COLLECTION`.

## Hackathon script

1. Start the dashboard with `npm run dev`.
2. Build and load `apps/extension/dist`.
3. Open the dashboard and click Generate Demo.
4. Visit a supported site or use the extension fallback demo mode.
5. Click Buy Now, Send, Apply, Subscribe, or Invest.
6. Present the Future Impact Report and the decision dashboard.

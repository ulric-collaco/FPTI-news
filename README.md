# FPTI News – Indian Regulatory Summaries

Fetches and displays concise bullet summaries of the latest Indian financial and tax regulatory news using a Vercel serverless function and Gemini API.

## Overview
- Next.js 14 (App Router) frontend.
- Serverless API route at `/api/news` calls Gemini (`gemini-1.5-flash`).
- Summaries fetched on page load, with loading and error UI.
- `GEMINI_API_KEY` stored as a Vercel environment variable.

## Setup

1. Prerequisites
   - Node.js 18+ and npm
   - A Google AI Studio (Gemini) API key

2. Configure environment variables
    - Create `.env.local` in the project root:

     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
       # Optional: set to the exact model ID available to you in Google AI Studio/Vertex AI
       # Keep default or provide a Computer Use-capable model ID if you have access
       GEMINI_MODEL_ID=gemini-2.5-flash
     ```

3. Install dependencies and run locally

   ```powershell
   npm install
   npm run dev
   ```

   Visit http://localhost:3000

## Deployment (Vercel)

1. Push this repository to GitHub (or your Git provider).
2. Import the repo in Vercel.
3. In the Vercel Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY = your_gemini_api_key_here`
   - `GEMINI_MODEL_ID = gemini-2.5-flash` (or the Computer Use model ID provided in your account)
4. Deploy. The app will fetch summaries on each visit via `/api/news`.

## Notes & Best Practices
- The API route is marked `force-dynamic` so the request is fresh each time.
- Basic timeout and retry logic guard against transient errors and rate limits.
- The frontend parses and renders bullet lines; if none detected, it falls back to paragraphs.
- This project does not perform actual web scraping; it relies on Gemini to produce summaries based on the prompt.
 - You can target different Gemini models by setting `GEMINI_MODEL_ID`. If you have access to the Gemini 2.5 Computer Use model, set the exact model ID from Google AI Studio/Vertex AI.

## File Structure
- `app/page.tsx` – Client page that fetches and renders summaries.
- `app/api/news/route.ts` – Serverless function calling Gemini.
- `next.config.mjs`, `tsconfig.json` – Project config.

## Troubleshooting
- If `/api/news` returns 500, verify `GEMINI_API_KEY` is set in your environment.
- Check Vercel function logs for errors during API calls.
- API quotas/rate limits may affect availability; the route retries a few times automatically.
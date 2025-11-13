import { NextResponse } from "next/server";
import { getAllDataSources } from "@/lib/data-sources";
import { scrapeMultipleSources } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// In-memory cache
let cachedResponse: { text: string; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Fallback AI prompt if scraping fails
const PROMPT = `DO NOT USE THINKING MODE
You are an AI assistant specializing in Indian financial and tax regulations. Please provide a concise summary of recent (last 7-14 days) significant developments in Indian financial laws, tax regulations, government notifications, and compliance requirements.

Focus on:
- Key regulatory changes or announcements
- Government/regulatory bodies involved (RBI, SEBI, CBDT, GST Council, etc.)
- Announcement or effective dates
- Major implications for businesses, taxpayers, or financial advisors

Format your response as a chronological bullet list (newest first), with each point covering one development. Use this EXACT format:
- [Brief headline](URL): Key details including regulatory body, date if known, and primary implication

IMPORTANT: 
- Include actual working URLs from reliable Indian news sources (Economic Times, LiveMint, Business Standard, Moneycontrol, etc.)
- Each bullet MUST have a clickable link in markdown format: [Headline Text](https://actual-url.com)
- Provide 5-8 bullet points
- Keep tone formal, concise, and information-dense
- Only include actual regulatory/compliance news, not market commentary or opinions`;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: unknown;
  error?: { code?: number; message?: string };
};

export async function GET() {
  try {
    // Check cache first
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log("[News API] Returning cached response");
      return NextResponse.json({ text: cachedResponse.text }, { status: 200, headers: noStore() });
    }

    console.log("[News API] Attempting to scrape real data sources...");

    // Try scraping real sources first
    try {
      const prioritySources = getAllDataSources().filter((source) =>
        [
          "Income Tax Notifications",
          "RBI Notifications", 
          "CBIC GST",
          "SEBI Circulars",
        ].includes(source.name)
      );

      const items = await scrapeMultipleSources(prioritySources, 3);

      if (items.length > 0) {
        // Format scraped items as markdown bullets
        const text = items
          .map((item) => {
            const date = item.date ? ` (${item.date})` : "";
            return `- [${item.title}${date}](${item.url}): ${item.source}`;
          })
          .join("\n");

        console.log(`[News API] Successfully scraped ${items.length} items`);
        
        // Cache the response
        cachedResponse = { text, timestamp: Date.now() };
        
        return NextResponse.json({ text }, { status: 200, headers: noStore() });
      }
    } catch (scrapeError: any) {
      console.warn("[News API] Scraping failed, falling back to AI:", scrapeError.message);
    }

    // Fallback to AI if scraping fails
    console.log("[News API] Using AI fallback...");
    const text = await generateSummaries(PROMPT);
    
    // Cache the response
    cachedResponse = { text, timestamp: Date.now() };
    
    return NextResponse.json({ text }, { status: 200, headers: noStore() });
  } catch (err: any) {
    const message = err?.message || "Failed to generate summaries";
    const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: noStore() }
    );
  }
}

export async function POST() {
  // Mirror GET; allows explicit POST if desired from client
  return GET();
}

async function generateSummaries(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const e: any = new Error("Missing GEMINI_API_KEY environment variable");
    e.statusCode = 500;
    throw e;
  }

  const modelId = process.env.GEMINI_MODEL_ID || "gemini-pro";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      topP: 0.95,
      topK: 40,
    },
  };

  const url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;
  console.log(`[API] Calling Gemini model: ${modelId}`);
  
  // Retry with exponential backoff
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s max
        console.log(`[API] Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
        await sleep(waitTime);
      }
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const message = await readErrorMessage(res);
        
        // If rate limited (429), retry
        if (res.status === 429 && attempt < maxRetries - 1) {
          console.warn(`[API] Rate limited (429), will retry...`);
          lastError = new Error(message || "Rate limited by Gemini API");
          lastError.statusCode = 429;
          continue;
        }
        
        const e: any = new Error(message || `Gemini request failed: ${res.status}`);
        e.statusCode = res.status;
        throw e;
      }
      
      // Success - parse and return response
      const data = (await res.json()) as GeminiResponse;
      const text = await parseGeminiResponse(data);
      return text;
      
    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries - 1) {
        throw err;
      }
    }
  }
  
  throw lastError || new Error("Failed after retries");
}

async function parseGeminiResponse(data: GeminiResponse): Promise<string> {
  // Log full response to console
  console.log("[API] Gemini response:", JSON.stringify(data, null, 2));
  
  // Check for API error in response
  if (data?.error) {
    const e: any = new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
    e.statusCode = data.error.code || 500;
    throw e;
  }
  
  // Check if response was blocked or filtered
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error("No candidates in Gemini response. Response may have been filtered.");
  }
  
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    console.warn(`[API] Gemini finished with reason: ${candidate.finishReason}`);
  }
  
  const text = candidate?.content?.parts?.map((p) => p.text || "").join("\n").trim() || "";
  if (!text) {
    const reason = candidate.finishReason || "unknown";
    if (reason === "MAX_TOKENS") {
      throw new Error(`Model used all tokens for internal reasoning. Consider using gemini-2.5-flash instead of gemini-2.5-pro, or the response was cut off.`);
    }
    throw new Error(`Empty text from Gemini. Finish reason: ${reason}. Full response logged to console.`);
  }
  
  console.log(`[API] Success! Returning ${text.length} characters`);
  return text.slice(0, 10_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as any;
    return data?.error?.message || data?.message || null;
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

function noStore() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  } as Record<string, string>;
}

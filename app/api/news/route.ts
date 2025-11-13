import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Always fetch fresh on each visit
export const runtime = "nodejs"; // Ensure Node runtime for compatibility

const PROMPT = ` DO NOT THINK 
You are an AI assistant specializing in Indian financial and tax regulations. Please provide a concise summary of recent (last 7-14 days) significant developments in Indian financial laws, tax regulations, government notifications, and compliance requirements.

Focus on:
- Key regulatory changes or announcements
- Government/regulatory bodies involved (RBI, SEBI, CBDT, GST Council, etc.)
- Announcement or effective dates
- Major implications for businesses, taxpayers, or financial advisors

Format your response as a chronological bullet list (newest first), with each point covering one development. Use this format:
- [Brief headline]: [Key details including regulatory body, date if known, and primary implication]

Provide 5-8 bullet points. Keep tone formal, concise, and information-dense. Only include actual regulatory/compliance news, not market commentary or opinions.`;

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
    const text = await generateSummaries(PROMPT);
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

  const modelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";
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
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res);
    const e: any = new Error(message || `Gemini request failed: ${res.status}`);
    e.statusCode = res.status;
    throw e;
  }

  const data = (await res.json()) as GeminiResponse;
  
  // Log full response to console
  console.log("[API] Gemini response:", JSON.stringify(data, null, 2));
  
  // Check for API error in response
  if (data?.error) {
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
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

import { NextResponse } from "next/server";
import { analyzeRegulation } from "@/lib/huggingface";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalysisRequest {
  title: string;
  source: string;
  date?: string;
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.title || !body.source) {
      return NextResponse.json(
        { error: "Missing required fields: title and source" },
        { status: 400 }
      );
    }

    console.log(`[Analysis API] Analyzing: ${body.title}`);
    
    const actionItems = await analyzeRegulation(
      body.title,
      body.source,
      body.date
    );

    return NextResponse.json(
      { actionItems },
      { 
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
        }
      }
    );
  } catch (error: any) {
    console.error("[Analysis API] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to analyze regulation" },
      { status: 500 }
    );
  }
}

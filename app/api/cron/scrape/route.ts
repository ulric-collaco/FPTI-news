import { NextResponse } from "next/server";
import { getAllDataSources } from "@/lib/data-sources";
import { scrapeMultipleSources } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const prioritySources = getAllDataSources().filter((source) =>
      [
        "Income Tax Notifications",
        "RBI Notifications",
        "CBIC GST",
        "SEBI Circulars",
        "Maharashtra GST Notifications",
      ].includes(source.name)
    );

    const items = await scrapeMultipleSources(prioritySources, 4, 14);
    console.log(`[Cron] Scraped ${items.length} items`);
    return NextResponse.json({ ok: true, count: items.length }, { status: 200 });
  } catch (error: any) {
    console.error("[Cron] Scrape failed:", error?.message || error);
    return NextResponse.json({ ok: false, error: error?.message || "failed" }, { status: 500 });
  }
}

export const POST = GET;

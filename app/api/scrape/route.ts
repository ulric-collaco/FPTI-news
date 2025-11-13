import { NextResponse } from "next/server";
import { getAllDataSources } from "@/lib/data-sources";
import { scrapeMultipleSources, ScrapedItem } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Cache scraped data
let cachedData: { items: ScrapedItem[]; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

export async function GET() {
  try {
    // Check cache first
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log("[Scrape API] Returning cached data");
      return NextResponse.json(
        { items: cachedData.items, cached: true },
        { status: 200, headers: noStore() }
      );
    }

    console.log("[Scrape API] Starting fresh scrape...");
    
    // Get priority sources (most reliable ones)
    const prioritySources = getAllDataSources().filter((source) =>
      [
        "Income Tax Notifications",
        "RBI Notifications",
        "CBIC GST",
        "SEBI Circulars",
        "Maharashtra GST Notifications"
      ].includes(source.name)
    );

    // Scrape 3-4 items from each source
    const items = await scrapeMultipleSources(prioritySources, 4);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No data could be scraped from sources" },
        { status: 500, headers: noStore() }
      );
    }

    // Sort by date if available (newest first)
    items.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });

    // Cache the results
    cachedData = { items, timestamp: Date.now() };

    console.log(`[Scrape API] Successfully scraped ${items.length} items`);

    return NextResponse.json(
      { items, cached: false },
      { status: 200, headers: noStore() }
    );
  } catch (error: any) {
    console.error("[Scrape API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scrape data sources" },
      { status: 500, headers: noStore() }
    );
  }
}

function noStore() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  } as Record<string, string>;
}

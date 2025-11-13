import * as cheerio from "cheerio";
import axios from "axios";
import { DataSource } from "./data-sources";
import { parseIndianDate, isWithinDays } from "./date-utils";

export interface ScrapedItem {
  title: string;
  url: string;
  date?: string;
  parsedDate?: Date;
  source: string;
  category: string;
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function scrapeDataSource(
  source: DataSource,
  maxItems: number = 5
): Promise<ScrapedItem[]> {
  try {
    console.log(`[Scraper] Fetching from ${source.name}...`);
    
    const response = await axios.get(source.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const items: ScrapedItem[] = [];

    // Different scraping strategies based on the source
    if (source.url.includes("incometaxindia.gov.in")) {
      items.push(...scrapeIncomeTaxSite($, source, maxItems));
    } else if (source.url.includes("rbi.org.in")) {
      items.push(...scrapeRBISite($, source, maxItems));
    } else if (source.url.includes("cbic.gov.in")) {
      items.push(...scrapeCBICSite($, source, maxItems));
    } else if (source.url.includes("sebi.gov.in")) {
      items.push(...scrapeSEBISite($, source, maxItems));
    } else if (source.url.includes("mahagst.gov.in")) {
      items.push(...scrapeMahaGSTSite($, source, maxItems));
    } else if (source.url.includes("pib.gov.in")) {
      items.push(...scrapePIBSite($, source, maxItems));
    } else {
      // Generic scraper - look for links
      items.push(...scrapeGeneric($, source, maxItems));
    }

    console.log(`[Scraper] Found ${items.length} items from ${source.name}`);
    return items.slice(0, maxItems);
  } catch (error: any) {
    console.error(`[Scraper] Error scraping ${source.name}:`, error.message);
    return [];
  }
}

function scrapeIncomeTaxSite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // Income Tax site uses SharePoint lists
  $("table tr, .ms-listviewtable tr").each((i, row) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $row = $(row);
    const $link = $row.find("a").first();
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url) {
      // Handle relative URLs
      if (url.startsWith("/")) {
        url = `https://incometaxindia.gov.in${url}`;
      }
      
      const dateText = $row.find("td").eq(1).text().trim();
      
      items.push({
        title,
        url,
        date: dateText || undefined,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapeRBISite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // RBI uses table structure
  $("table tr").each((i, row) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $row = $(row);
    const $link = $row.find("a").first();
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url && !title.toLowerCase().includes("notification")) {
      if (url.startsWith("/")) {
        url = `https://www.rbi.org.in${url}`;
      }
      
      const dateText = $row.find("td").first().text().trim();
      
      items.push({
        title,
        url,
        date: dateText || undefined,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapeCBICSite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // CBIC site structure
  $("table a, .contentpaneopen a, ul li a").each((i, elem) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $link = $(elem);
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url && title.length > 10) {
      if (url.startsWith("/")) {
        url = `https://www.cbic.gov.in${url}`;
      } else if (!url.startsWith("http")) {
        url = `https://www.cbic.gov.in/${url}`;
      }
      
      items.push({
        title,
        url,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapeSEBISite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // SEBI circulars page
  $("table tr").each((i, row) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $row = $(row);
    const $link = $row.find("a").first();
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url) {
      if (url.startsWith("/")) {
        url = `https://www.sebi.gov.in${url}`;
      }
      
      const dateText = $row.find("td").eq(0).text().trim();
      
      items.push({
        title,
        url,
        date: dateText || undefined,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapeMahaGSTSite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // Maharashtra GST site
  $("article, .notification-item, .update-item").each((i, elem) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $elem = $(elem);
    const $link = $elem.find("a").first();
    const title = $link.text().trim() || $elem.find("h3, h4, .title").text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url) {
      if (url.startsWith("/")) {
        url = `https://mahagst.gov.in${url}`;
      }
      
      const dateText = $elem.find(".date, time").text().trim();
      
      items.push({
        title,
        url,
        date: dateText || undefined,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapePIBSite(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // PIB press releases
  $(".content-area a, table tr").each((i, elem) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $elem = $(elem);
    const $link = $elem.is("a") ? $elem : $elem.find("a").first();
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    if (title && url && title.length > 15) {
      if (url.startsWith("/")) {
        url = `https://pib.gov.in${url}`;
      }
      
      items.push({
        title,
        url,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

function scrapeGeneric(
  $: cheerio.CheerioAPI,
  source: DataSource,
  maxItems: number
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  
  // Generic scraper - look for news/notification patterns
  $("a").each((i, elem) => {
    void i;
    if (items.length >= maxItems) return false;
    
    const $link = $(elem);
    const title = $link.text().trim();
    let url = $link.attr("href") || "";
    
    // Filter for meaningful content
    const isRelevant =
      title.length > 20 &&
      (title.toLowerCase().includes("notification") ||
        title.toLowerCase().includes("circular") ||
        title.toLowerCase().includes("order") ||
        title.toLowerCase().includes("amendment"));
    
    if (isRelevant && url) {
      if (url.startsWith("/")) {
        const baseUrl = new URL(source.url).origin;
        url = `${baseUrl}${url}`;
      }
      
      items.push({
        title,
        url,
        source: source.name,
        category: source.category,
      });
    }
  });
  
  return items;
}

export async function scrapeMultipleSources(
  sources: DataSource[],
  maxItemsPerSource: number = 3,
  filterDays: number = 14
): Promise<ScrapedItem[]> {
  const results = await Promise.allSettled(
    sources.map((source) => scrapeDataSource(source, maxItemsPerSource))
  );

  const allItems: ScrapedItem[] = [];
  
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    } else {
      console.error(
        `[Scraper] Failed to scrape ${sources[index].name}:`,
        result.reason
      );
    }
  });

  // Parse dates and filter recent items
  const itemsWithDates = allItems.map(item => {
    if (item.date) {
      const parsed = parseIndianDate(item.date);
      if (parsed) {
        item.parsedDate = parsed;
      }
    }
    return item;
  });

  // Filter to items within specified days, or items without dates (keep as potentially recent)
  const filtered = itemsWithDates.filter(item => {
    if (!item.parsedDate) return true; // Keep items without parseable dates
    return isWithinDays(item.parsedDate, filterDays);
  });

  console.log(`[Scraper] Filtered ${filtered.length}/${allItems.length} items within ${filterDays} days`);

  return filtered;
}

import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/lib/sentiment";

interface MarketNewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceLabel: string;
}

// --- Finnhub general market news ---
async function fetchFinnhubNews(): Promise<MarketNewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.slice(0, 25).map((item: Record<string, unknown>) => ({
      title: (item.headline as string) || "",
      publisher: (item.source as string) || "Finnhub",
      link: (item.url as string) || "",
      publishedAt: item.datetime
        ? new Date((item.datetime as number) * 1000).toISOString()
        : null,
      sentiment: analyzeSentiment(
        ((item.headline as string) || "") + " " + ((item.summary as string) || "")
      ),
      source: "finnhub",
      sourceLabel: "Finnhub",
    }));
  } catch {
    return [];
  }
}

// --- RSS feed parser ---
function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleRegex = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    "i"
  );
  const simpleMatch = xml.match(simpleRegex);
  return simpleMatch ? simpleMatch[1].trim() : null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

async function fetchRSSFeed(
  feedUrl: string,
  source: string,
  sourceLabel: string
): Promise<MarketNewsArticle[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: MarketNewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const itemXml = match[1];
      const title = extractTag(itemXml, "title");
      const link = extractTag(itemXml, "link");
      const pubDate = extractTag(itemXml, "pubDate");
      const description = extractTag(itemXml, "description");

      if (title && link) {
        items.push({
          title: decodeHtmlEntities(title),
          publisher: sourceLabel,
          link: decodeHtmlEntities(link),
          publishedAt: pubDate
            ? new Date(pubDate).toISOString()
            : null,
          sentiment: analyzeSentiment(
            decodeHtmlEntities(title) + " " + (description ? decodeHtmlEntities(description) : "")
          ),
          source,
          sourceLabel,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

// RSS feed configurations
const RSS_FEEDS = [
  {
    url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    source: "marketwatch",
    label: "MarketWatch",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    source: "cnbc",
    label: "CNBC",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069",
    source: "cnbc",
    label: "CNBC",
  },
];

export async function GET(request: NextRequest) {
  const sourceFilter = request.nextUrl.searchParams.get("source");

  try {
    // Fetch all sources in parallel
    const results = await Promise.allSettled([
      fetchFinnhubNews(),
      ...RSS_FEEDS.map((feed) =>
        fetchRSSFeed(feed.url, feed.source, feed.label)
      ),
    ]);

    // Collect all successful results
    let allArticles: MarketNewsArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    // Apply source filter if provided
    if (sourceFilter && sourceFilter !== "all") {
      allArticles = allArticles.filter((a) => a.source === sourceFilter);
    }

    // Sort by publishedAt (newest first), nulls last
    allArticles.sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });

    // Deduplicate by similar title
    const seen = new Set<string>();
    const deduped = allArticles.filter((a) => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sentiment counts
    const positive = deduped.filter((a) => a.sentiment === "positive");
    const negative = deduped.filter((a) => a.sentiment === "negative");
    const neutral = deduped.filter((a) => a.sentiment === "neutral");

    // Available sources for filter UI
    const sourceMap = new Map<string, string>();
    for (const a of deduped) {
      if (!sourceMap.has(a.source)) {
        sourceMap.set(a.source, a.sourceLabel);
      }
    }
    const availableSources = Array.from(sourceMap.entries()).map(
      ([id, label]) => ({ id, label })
    );

    return NextResponse.json({
      articles: deduped.slice(0, 60),
      summary: {
        total: deduped.length,
        positive: positive.length,
        negative: negative.length,
        neutral: neutral.length,
        overallSentiment:
          positive.length > negative.length
            ? "positive"
            : negative.length > positive.length
              ? "negative"
              : "neutral",
      },
      availableSources,
    });
  } catch (error) {
    console.error("Market news API error:", error);
    return NextResponse.json(
      { articles: [], summary: { total: 0, positive: 0, negative: 0, neutral: 0, overallSentiment: "neutral" }, availableSources: [] },
      { status: 200 }
    );
  }
}

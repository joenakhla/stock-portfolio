import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/lib/sentiment";

interface MarketNewsArticle {
  title: string;
  description: string | null;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceLabel: string;
  relatedSymbols: string[];
}

// --- Well-known tickers for extraction (3+ chars to avoid false positives) ---
const WELL_KNOWN_TICKERS = new Set([
  "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "TSLA", "META", "NVDA",
  "AMD", "INTC", "NFLX", "CRM", "ORCL", "ADBE", "PYPL", "SHOP",
  "UBER", "LYFT", "COIN", "SNAP", "PINS", "ROKU", "PLTR", "RIVN",
  "LCID", "NIO", "JPM", "MRNA", "SBUX", "WMT", "TGT", "COST",
  "DIS", "BABA", "PFE", "JNJ", "UNH", "XOM", "CVX", "BAC",
  "WFC", "CSCO", "QCOM", "AVGO", "TXN", "NOW", "PANW", "SNOW",
  "DDOG", "CRWD", "ZS", "NET", "SQ", "HOOD", "SOFI", "UPST",
  "RBLX", "ABNB", "DASH", "SE", "MELI", "SPOT", "ROKU", "TTD",
  "ENPH", "SEDG", "FSLR", "RUN", "PLUG", "CHPT", "SPCE", "DKNG",
  "PENN", "MGM", "LVS", "WYNN", "MAR", "HLT", "DAL", "UAL",
  "AAL", "LUV", "CCL", "RCL", "NCLH", "BA", "RTX", "LMT",
  "NOC", "GD", "CAT", "DE", "MMM", "HON", "GE", "ABT",
  "TMO", "DHR", "MDT", "ISRG", "SYK", "BDX", "EW",
  "LULU", "NKE", "DECK", "CROX", "GPS", "ANF", "BBWI",
  "MCD", "YUM", "CMG", "DPZ", "QSR", "WING",
  "PEP", "KO", "MNST", "KDP", "STZ", "SAM",
  "HD", "LOW", "FIVE", "DG", "DLTR",
  "SPY", "QQQ", "IWM", "DIA", "VOO", "VTI", "ARKK",
]);

function extractTickersFromText(text: string): string[] {
  const tickers = new Set<string>();

  // Pattern 1: $TICKER
  const dollarPattern = /\$([A-Z]{1,5})\b/g;
  let match;
  while ((match = dollarPattern.exec(text)) !== null) {
    if (match[1].length >= 2) tickers.add(match[1]);
  }

  // Pattern 2: (TICKER) — very common in financial headlines
  const parenPattern = /\(([A-Z]{1,5})\)/g;
  while ((match = parenPattern.exec(text)) !== null) {
    if (match[1].length >= 2) tickers.add(match[1]);
  }

  // Pattern 3: NASDAQ: TICKER or NYSE: TICKER
  const exchangePattern = /(?:NASDAQ|NYSE|AMEX|NYSEAMERICAN):\s*([A-Z]{1,5})\b/gi;
  while ((match = exchangePattern.exec(text)) !== null) {
    tickers.add(match[1].toUpperCase());
  }

  // Pattern 4: Known tickers as whole words (3+ chars only)
  for (const ticker of Array.from(WELL_KNOWN_TICKERS)) {
    if (ticker.length >= 3) {
      const regex = new RegExp(`\\b${ticker}\\b`);
      if (regex.test(text)) {
        tickers.add(ticker);
      }
    }
  }

  return Array.from(tickers);
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

    return data.slice(0, 30).map((item: Record<string, unknown>) => {
      // Use the actual article source (e.g., "Reuters", "Yahoo"), not "Finnhub"
      const articleSource = (item.source as string) || "Unknown";
      const headline = (item.headline as string) || "";
      const summary = (item.summary as string) || "";

      // Extract tickers from Finnhub's `related` field + text
      const relatedField = (item.related as string) || "";
      const finnhubSymbols = relatedField
        .split(",")
        .map((s: string) => s.trim().toUpperCase())
        .filter((s: string) => s.length >= 2 && s.length <= 5);

      const textSymbols = extractTickersFromText(headline + " " + summary);
      const allSymbols = Array.from(new Set([...finnhubSymbols, ...textSymbols]));

      return {
        title: headline,
        description: summary || null,
        publisher: articleSource,
        link: (item.url as string) || "",
        publishedAt: item.datetime
          ? new Date((item.datetime as number) * 1000).toISOString()
          : null,
        sentiment: analyzeSentiment(headline + " " + summary),
        source: articleSource.toLowerCase().replace(/[^a-z0-9]/g, ""),
        sourceLabel: articleSource,
        relatedSymbols: allSymbols,
      };
    });
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
        const titleText = decodeHtmlEntities(title);
        const descText = description ? decodeHtmlEntities(description) : "";
        const relatedSymbols = extractTickersFromText(titleText + " " + descText);

        items.push({
          title: titleText,
          description: descText || null,
          publisher: sourceLabel,
          link: decodeHtmlEntities(link),
          publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
          sentiment: analyzeSentiment(titleText + " " + descText),
          source: sourceLabel.toLowerCase().replace(/[^a-z0-9]/g, ""),
          sourceLabel,
          relatedSymbols,
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
    label: "MarketWatch",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    label: "CNBC",
  },
  {
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069",
    label: "CNBC",
  },
];

export async function GET(request: NextRequest) {
  const sourceFilter = request.nextUrl.searchParams.get("source");

  try {
    // Fetch all sources in parallel
    const results = await Promise.allSettled([
      fetchFinnhubNews(),
      ...RSS_FEEDS.map((feed) => fetchRSSFeed(feed.url, feed.label)),
    ]);

    // Collect all successful results
    let allArticles: MarketNewsArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    // Only keep stock-related articles (at least 1 ticker mentioned)
    allArticles = allArticles.filter((a) => a.relatedSymbols.length > 0);

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

    // Available sources for filter UI (use actual publisher names)
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
      {
        articles: [],
        summary: { total: 0, positive: 0, negative: 0, neutral: 0, overallSentiment: "neutral" },
        availableSources: [],
      },
      { status: 200 }
    );
  }
}

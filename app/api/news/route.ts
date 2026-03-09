import { NextRequest, NextResponse } from "next/server";
import { analyzeSentiment } from "@/lib/sentiment";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceLabel: string;
}

interface YahooNewsItem {
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
}

// Fetch stock-specific news from Yahoo Finance
async function fetchYahooNews(symbol: string): Promise<NewsArticle[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=20&quotesCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    const data = await res.json();
    const rawNews: YahooNewsItem[] = data.news || [];

    return rawNews
      .filter((n) => n.title)
      .map((n) => ({
        title: n.title || "",
        publisher: n.publisher || "Unknown",
        link: n.link || "",
        publishedAt: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString()
          : null,
        sentiment: analyzeSentiment(n.title || ""),
        source: "yahoo",
        sourceLabel: "Yahoo Finance",
      }));
  } catch {
    return [];
  }
}

// Fetch stock-specific news from Finnhub
async function fetchFinnhubCompanyNews(
  symbol: string
): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0];
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${weekAgo}&to=${today}&token=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 15).map((item: Record<string, unknown>) => ({
      title: (item.headline as string) || "",
      publisher: (item.source as string) || "Finnhub",
      link: (item.url as string) || "",
      publishedAt: item.datetime
        ? new Date((item.datetime as number) * 1000).toISOString()
        : null,
      sentiment: analyzeSentiment(
        ((item.headline as string) || "") +
          " " +
          ((item.summary as string) || "")
      ),
      source: "finnhub",
      sourceLabel: "Finnhub",
    }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch from both sources in parallel
    const [yahooArticles, finnhubArticles] = await Promise.all([
      fetchYahooNews(symbol),
      fetchFinnhubCompanyNews(symbol),
    ]);

    // Merge and deduplicate
    const allArticles = [...yahooArticles, ...finnhubArticles];
    const seen = new Set<string>();
    const articles = allArticles.filter((a) => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (newest first)
    articles.sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return (
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
      );
    });

    const positive = articles.filter((a) => a.sentiment === "positive");
    const negative = articles.filter((a) => a.sentiment === "negative");
    const neutral = articles.filter((a) => a.sentiment === "neutral");

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      positive,
      negative,
      neutral,
      summary: {
        total: articles.length,
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
    });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

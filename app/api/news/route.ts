import { NextRequest, NextResponse } from "next/server";

const POSITIVE_WORDS = [
  "surge", "soar", "rally", "gain", "rise", "jump", "climb", "beat",
  "exceed", "upgrade", "bullish", "growth", "profit", "record", "high",
  "boost", "strong", "positive", "outperform", "buy", "upbeat", "recover",
  "breakout", "momentum", "opportunity", "win", "success", "expand",
  "optimistic", "raises", "raised", "upside", "top", "best", "love",
  "innovation", "revolutionary", "impressive", "accelerate", "approval",
];

const NEGATIVE_WORDS = [
  "fall", "drop", "decline", "crash", "plunge", "sink", "loss", "miss",
  "downgrade", "bearish", "weak", "negative", "underperform", "sell",
  "cut", "warning", "risk", "concern", "fear", "slump", "downturn",
  "tumble", "plummet", "layoff", "lawsuit", "investigation", "recall",
  "debt", "bankruptcy", "fraud", "scandal", "worst", "trouble", "struggle",
  "disappointing", "fails", "failed", "crisis", "threat", "volatile",
];

function analyzeSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  let posScore = 0;
  let negScore = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) posScore++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negScore++;
  }

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

interface YahooNewsItem {
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=20&quotesCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawNews: YahooNewsItem[] = data.news || [];

    const articles = rawNews
      .filter((n) => n.title)
      .map((n) => {
        const sentiment = analyzeSentiment(n.title || "");
        return {
          title: n.title || "",
          publisher: n.publisher || "Unknown",
          link: n.link || "",
          publishedAt: n.providerPublishTime
            ? new Date(n.providerPublishTime * 1000).toISOString()
            : null,
          sentiment,
        };
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

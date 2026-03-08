import { NextResponse } from "next/server";

interface TrendingQuote {
  symbol: string;
}

interface QuoteMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  shortName?: string;
  longName?: string;
  regularMarketVolume?: number;
  averageDailyVolume10Day?: number;
}

async function fetchWithUA(url: string) {
  return fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  });
}

export async function GET() {
  try {
    // 1. Get trending tickers
    const trendingRes = await fetchWithUA(
      "https://query1.finance.yahoo.com/v1/finance/trending/US?count=20"
    );
    let trendingSymbols: string[] = [];

    if (trendingRes.ok) {
      const trendingData = await trendingRes.json();
      const quotes: TrendingQuote[] =
        trendingData.finance?.result?.[0]?.quotes || [];
      trendingSymbols = quotes
        .map((q) => q.symbol)
        .filter((s) => !s.includes("=") && !s.includes("^"))
        .slice(0, 15);
    }

    if (trendingSymbols.length === 0) {
      // Fallback: well-known momentum stocks to check
      trendingSymbols = [
        "NVDA", "PLTR", "SMCI", "ARM", "IONQ", "RKLB",
        "SOFI", "HOOD", "MARA", "RIOT", "AFRM", "UPST",
        "DKNG", "CRWD", "NET",
      ];
    }

    // 2. Fetch quote data for each symbol
    const results = [];

    for (const sym of trendingSymbols) {
      try {
        const quoteRes = await fetchWithUA(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1mo`
        );

        if (!quoteRes.ok) continue;

        const quoteData = await quoteRes.json();
        const result = quoteData.chart?.result?.[0];
        if (!result) continue;

        const meta: QuoteMeta = result.meta || {};
        const closes: (number | null)[] =
          result.indicators?.quote?.[0]?.close || [];
        const volumes: (number | null)[] =
          result.indicators?.quote?.[0]?.volume || [];

        const currentPrice = meta.regularMarketPrice ?? 0;
        const prevClose =
          meta.chartPreviousClose ?? meta.previousClose ?? 0;
        if (currentPrice === 0) continue;

        // Calculate momentum metrics
        const validCloses = closes.filter(
          (c): c is number => c !== null && c > 0
        );

        // Price change today
        const dayChange = prevClose > 0
          ? ((currentPrice - prevClose) / prevClose) * 100
          : 0;

        // Price change over 1 week (last 5 trading days)
        const weekAgoPrice = validCloses.length >= 5
          ? validCloses[validCloses.length - 5]
          : validCloses[0];
        const weekChange = weekAgoPrice
          ? ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100
          : 0;

        // Price change over 1 month
        const monthAgoPrice = validCloses[0] || currentPrice;
        const monthChange =
          ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100;

        // Volume spike: compare recent volume to earlier volume
        const validVolumes = volumes.filter(
          (v): v is number => v !== null && v > 0
        );
        const recentVol =
          validVolumes.length >= 3
            ? validVolumes.slice(-3).reduce((a, b) => a + b, 0) / 3
            : 0;
        const avgVol =
          validVolumes.length >= 10
            ? validVolumes.slice(0, -3).reduce((a, b) => a + b, 0) /
              (validVolumes.length - 3)
            : recentVol;
        const volumeSpike =
          avgVol > 0 ? ((recentVol - avgVol) / avgVol) * 100 : 0;

        // Distance from 52-week low (how much it has run up)
        const low52 = meta.fiftyTwoWeekLow ?? currentPrice;
        const fromLow =
          low52 > 0
            ? ((currentPrice - low52) / low52) * 100
            : 0;

        // Momentum score (higher = stronger momentum)
        const momentumScore = Math.round(
          dayChange * 2 + weekChange * 1.5 + monthChange * 0.5 +
          Math.min(volumeSpike * 0.3, 30)
        );

        // Determine why it's trending
        const reasons: string[] = [];
        if (dayChange > 3) reasons.push(`Up ${dayChange.toFixed(1)}% today`);
        if (weekChange > 10) reasons.push(`Up ${weekChange.toFixed(1)}% this week`);
        if (monthChange > 20) reasons.push(`Up ${monthChange.toFixed(1)}% this month`);
        if (volumeSpike > 50) reasons.push(`${Math.round(volumeSpike)}% volume spike`);
        if (reasons.length === 0) reasons.push("Trending on Yahoo Finance");

        results.push({
          symbol: sym,
          name: meta.shortName || meta.longName || sym,
          currentPrice,
          dayChange,
          weekChange,
          monthChange,
          volumeSpike,
          fromLow52: fromLow,
          high52Week: meta.fiftyTwoWeekHigh ?? 0,
          low52Week: meta.fiftyTwoWeekLow ?? 0,
          momentumScore,
          reasons,
        });
      } catch {
        // Skip this symbol
      }
    }

    // Sort by momentum score (highest first)
    results.sort((a, b) => b.momentumScore - a.momentumScore);

    return NextResponse.json({
      stocks: results.slice(0, 12),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending stocks" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const symbols = symbol.split(",").map((s) => s.trim().toUpperCase());
    const results: Record<string, unknown> = {};

    for (const sym of symbols) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        results[sym] = { error: "Could not fetch data" };
        continue;
      }

      const data = await res.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        results[sym] = { error: "No data found" };
        continue;
      }

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice ?? 0;
      const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const change = currentPrice - previousClose;
      const changePercent =
        previousClose > 0 ? (change / previousClose) * 100 : 0;
      const high52 = meta.fiftyTwoWeekHigh ?? 0;
      const low52 = meta.fiftyTwoWeekLow ?? 0;

      results[sym] = {
        symbol: sym,
        name: meta.shortName || meta.longName || sym,
        currentPrice,
        previousClose,
        change,
        changePercent,
        high52Week: high52,
        low52Week: low52,
        currency: meta.currency || "USD",
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Quote API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

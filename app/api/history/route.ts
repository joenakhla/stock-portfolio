import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const range = request.nextUrl.searchParams.get("range") || "1y";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const validRanges = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];
  const safeRange = validRanges.includes(range) ? range : "1y";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.toUpperCase())}?interval=1d&range=${safeRange}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: "No historical data found" },
        { status: 404 }
      );
    }

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close || [];

    const history = timestamps
      .map((ts: number, i: number) => {
        const close = closes[i];
        if (close === null || close === undefined) return null;
        return {
          date: new Date(ts * 1000).toISOString().split("T")[0],
          close: Math.round(close * 100) / 100,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      history,
      meta: {
        high52Week: result.meta?.fiftyTwoWeekHigh ?? null,
        low52Week: result.meta?.fiftyTwoWeekLow ?? null,
        currentPrice: result.meta?.regularMarketPrice ?? null,
      },
    });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}

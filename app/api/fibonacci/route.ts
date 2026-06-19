import { NextRequest, NextResponse } from "next/server";

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

const FIB_LEVELS = [
  { percent: 0, label: "Swing High (0%)" },
  { percent: 0.236, label: "23.6%" },
  { percent: 0.382, label: "38.2%" },
  { percent: 0.5, label: "50%" },
  { percent: 0.618, label: "61.8%" },
  { percent: 0.786, label: "78.6%" },
  { percent: 1, label: "Swing Low (100%)" },
];

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=6mo`;
    const res = await fetch(url, { headers: YF_HEADERS, cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch data" }, { status: 502 });
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c): c is number => c !== null && c > 0);

    if (validCloses.length < 10) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 404 });
    }

    const currentPrice = result.meta?.regularMarketPrice ?? validCloses[validCloses.length - 1];
    const swingHigh = Math.max(...validCloses);
    const swingLow = Math.min(...validCloses);
    const range = swingHigh - swingLow;

    if (range === 0) {
      return NextResponse.json({ error: "No price movement" }, { status: 404 });
    }

    const levels = FIB_LEVELS.map((fl) => ({
      percent: fl.percent,
      price: Math.round((swingHigh - range * fl.percent) * 100) / 100,
      label: fl.label,
    }));

    // Determine where current price sits relative to Fibonacci levels
    const pricePosition = (swingHigh - currentPrice) / range;

    // Recent trend: compare current price to 20-day moving average
    const recent20 = validCloses.slice(-20);
    const ma20 = recent20.reduce((a, b) => a + b, 0) / recent20.length;
    const trendingUp = currentPrice > ma20;

    let recommendation: "Buy" | "Sell" | "Hold";
    let reasoning: string;

    if (pricePosition >= 0.55 && trendingUp) {
      recommendation = "Buy";
      reasoning = `Price near ${pricePosition >= 0.7 ? "strong" : ""} Fibonacci support (${(pricePosition * 100).toFixed(0)}% retracement) with upward trend. Potential bounce zone.`;
    } else if (pricePosition >= 0.55 && !trendingUp) {
      recommendation = "Hold";
      reasoning = `Price near Fibonacci support but trend is still downward. Wait for reversal confirmation before buying.`;
    } else if (pricePosition <= 0.15) {
      recommendation = "Sell";
      reasoning = `Price near swing high resistance. Consider taking profits or tightening stops.`;
    } else if (pricePosition <= 0.3 && !trendingUp) {
      recommendation = "Sell";
      reasoning = `Price rejected from upper Fibonacci levels (${(pricePosition * 100).toFixed(0)}% level) and trending down. Potential further decline.`;
    } else if (pricePosition > 0.35 && pricePosition < 0.55) {
      recommendation = "Hold";
      reasoning = `Price in the 38.2%-61.8% consolidation zone. Wait for a breakout above 38.2% (buy) or breakdown below 61.8% (sell).`;
    } else {
      recommendation = "Hold";
      reasoning = `Price between key Fibonacci levels. Monitor for clear direction before acting.`;
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      swingHigh,
      swingLow,
      currentPrice,
      levels,
      recommendation,
      reasoning,
    });
  } catch (error) {
    console.error("Fibonacci API error:", error);
    return NextResponse.json({ error: "Failed to calculate Fibonacci levels" }, { status: 500 });
  }
}

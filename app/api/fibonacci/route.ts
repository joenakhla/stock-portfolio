import { NextRequest, NextResponse } from "next/server";

interface FibonacciLevels {
  l0: number;
  l236: number;
  l382: number;
  l500: number;
  l618: number;
  l786: number;
  l100: number;
}

interface HistoryPoint {
  date: string;
  close: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcLevels(low: number, high: number): FibonacciLevels {
  const range = high - low;
  return {
    l0: round2(low),
    l236: round2(low + range * 0.236),
    l382: round2(low + range * 0.382),
    l500: round2(low + range * 0.5),
    l618: round2(low + range * 0.618),
    l786: round2(low + range * 0.786),
    l100: round2(high),
  };
}

function calcTrend(
  currentPrice: number,
  low: number,
  high: number
): "up" | "down" | "sideways" {
  const midpoint = (low + high) / 2;
  const range = high - low;
  const tenPct = range * 0.1;
  if (Math.abs(currentPrice - midpoint) <= tenPct) return "sideways";
  return currentPrice > midpoint ? "up" : "down";
}

async function getGeminiAnalysis(
  symbol: string,
  currentPrice: number,
  high6m: number,
  low6m: number,
  levels: FibonacciLevels,
  trend: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a technical analysis assistant. Analyze the following Fibonacci retracement data for ${symbol} and provide concise trading guidance.

Symbol: ${symbol}
Current Price: ${currentPrice}
6-Month High: ${high6m}
6-Month Low: ${low6m}
Trend: ${trend}

Fibonacci Levels:
- 0% (Low / Support): ${levels.l0}
- 23.6%: ${levels.l236}
- 38.2% (Key Buy): ${levels.l382}
- 50%: ${levels.l500}
- 61.8% (Golden Ratio): ${levels.l618}
- 78.6%: ${levels.l786}
- 100% (High / Resistance): ${levels.l100}

Respond in this exact format:
Buy Zone: [price range]
Sell Zone: [price range]
Stop-Loss: [price level]
Rationale: [exactly 2 sentences explaining the setup based on Fibonacci levels and current trend]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts?.[0]?.text as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol" },
      { status: 400 }
    );
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1d&range=6mo`;

    const yahooRes = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!yahooRes.ok) {
      throw new Error(
        `Yahoo Finance returned ${yahooRes.status}: ${yahooRes.statusText}`
      );
    }

    const yahooData = await yahooRes.json();
    const result = yahooData?.chart?.result?.[0];

    if (!result) {
      throw new Error("No data returned from Yahoo Finance for symbol: " + symbol);
    }

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const validPairs: { ts: number; close: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && (closes[i] as number) > 0) {
        validPairs.push({ ts: timestamps[i], close: closes[i] as number });
      }
    }

    if (validPairs.length === 0) {
      throw new Error("No valid close prices found for symbol: " + symbol);
    }

    const closePrices = validPairs.map((p) => p.close);
    const high6m = round2(Math.max(...closePrices));
    const low6m = round2(Math.min(...closePrices));
    const currentPrice = round2(closePrices[closePrices.length - 1]);

    const levels = calcLevels(low6m, high6m);
    const trend = calcTrend(currentPrice, low6m, high6m);

    const history: HistoryPoint[] = validPairs.map((p) => ({
      date: new Date(p.ts * 1000).toISOString().split("T")[0],
      close: round2(p.close),
    }));

    const analysis = await getGeminiAnalysis(
      symbol,
      currentPrice,
      high6m,
      low6m,
      levels,
      trend
    );

    return NextResponse.json({
      symbol,
      currentPrice,
      high6m,
      low6m,
      trend,
      levels,
      history,
      analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

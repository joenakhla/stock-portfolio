import { NextRequest, NextResponse } from "next/server";

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

function determineDividendFrequency(eventCount: number): string {
  if (eventCount === 0) return "None";
  if (eventCount === 1) return "Annual";
  if (eventCount === 2) return "Semi-Annual";
  if (eventCount >= 3 && eventCount <= 5) return "Quarterly";
  if (eventCount >= 6 && eventCount <= 9) return "Bi-Monthly";
  if (eventCount >= 10) return "Monthly";
  return "Unknown";
}

function unixToISO(ts: number | undefined | null): string | null {
  if (!ts) return null;
  // Yahoo returns seconds; JS Date needs ms
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const symbols = symbol.split(",").map((s) => s.trim().toUpperCase());
    const results: Record<string, unknown> = {};

    // ── Step 1: Fetch chart data (price + dividend events) ──
    for (const sym of symbols) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1y&events=div`;
      const res = await fetch(url, {
        headers: YF_HEADERS,
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
      const previousClose =
        meta.chartPreviousClose ?? meta.previousClose ?? 0;
      const change = currentPrice - previousClose;
      const changePercent =
        previousClose > 0 ? (change / previousClose) * 100 : 0;
      const high52 = meta.fiftyTwoWeekHigh ?? 0;
      const low52 = meta.fiftyTwoWeekLow ?? 0;

      // ── Parse dividend events from the last 12 months ──
      const dividendEvents = result.events?.dividends;
      let divCount = 0;
      let divAnnualSum = 0;

      if (dividendEvents && typeof dividendEvents === "object") {
        const now = Date.now();
        const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

        for (const ts of Object.keys(dividendEvents)) {
          const event = dividendEvents[ts];
          const eventMs = Number(ts) * 1000;
          if (eventMs >= oneYearAgo) {
            divCount++;
            divAnnualSum += event.amount ?? 0;
          }
        }
      }

      const dividendFrequency = determineDividendFrequency(divCount);
      const dividendYield =
        divAnnualSum > 0 && currentPrice > 0
          ? (divAnnualSum / currentPrice) * 100
          : 0;

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
        dividendRate: Math.round(divAnnualSum * 1000) / 1000,
        dividendYield: Math.round(dividendYield * 100) / 100,
        dividendFrequency,
        nextExDividendDate: null as string | null,
        nextDividendDate: null as string | null,
      };
    }

    // ── Step 2: Batch-fetch upcoming dividend dates via v7 quote ──
    try {
      const allSymbols = symbols.filter((s) => {
        const r = results[s];
        return r && typeof r === "object" && !("error" in (r as Record<string, unknown>));
      });

      if (allSymbols.length > 0) {
        const v7Url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${allSymbols.join(",")}`;
        const v7Res = await fetch(v7Url, {
          headers: YF_HEADERS,
          cache: "no-store",
        });

        if (v7Res.ok) {
          const v7Data = await v7Res.json();
          const v7Quotes = v7Data.quoteResponse?.result || [];

          for (const q of v7Quotes) {
            const sym = q.symbol?.toUpperCase();
            if (!sym || !results[sym]) continue;

            const existing = results[sym] as Record<string, unknown>;

            // Use v7 upcoming dates if available
            const exDiv = unixToISO(q.exDividendDate);
            const divDate = unixToISO(q.dividendDate);
            existing.nextExDividendDate = exDiv;
            existing.nextDividendDate = divDate;

            // If v7 has better dividend rate/yield, use those
            if (q.dividendRate && q.dividendRate > 0) {
              existing.dividendRate = Math.round(q.dividendRate * 1000) / 1000;
            }
            if (q.dividendYield && q.dividendYield > 0) {
              // v7 returns yield as decimal (0.015 = 1.5%), convert to %
              const yieldPct = q.dividendYield > 1 ? q.dividendYield : q.dividendYield * 100;
              existing.dividendYield = Math.round(yieldPct * 100) / 100;
            }
          }
        }
      }
    } catch (v7Err) {
      console.error("v7 dividend fetch error (non-critical):", v7Err);
      // Non-critical — we still have chart-based dividend data
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

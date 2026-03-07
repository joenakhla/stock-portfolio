import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Search failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const quotes = (data.quotes || [])
      .filter(
        (q: { quoteType: string; exchange: string }) =>
          q.quoteType === "EQUITY" &&
          !q.exchange?.includes("PNK")
      )
      .slice(0, 6)
      .map(
        (q: {
          symbol: string;
          shortname?: string;
          longname?: string;
          exchDisp?: string;
          quoteType: string;
        }) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          exchange: q.exchDisp || "",
          type: q.quoteType,
        })
      );

    return NextResponse.json({ results: quotes });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search stocks" },
      { status: 500 }
    );
  }
}

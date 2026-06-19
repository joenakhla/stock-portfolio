import { NextResponse } from "next/server";

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

const TROY_OZ_TO_GRAMS = 31.1035;
const BUY_SPREAD = 1.015;
const SELL_SPREAD = 0.985;

function applySpread(price: number) {
  return {
    buy: Math.round(price * BUY_SPREAD * 100) / 100,
    sell: Math.round(price * SELL_SPREAD * 100) / 100,
  };
}

export async function GET() {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch(
        "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
        { headers: YF_HEADERS, cache: "no-store" }
      ),
      fetch(
        "https://query1.finance.yahoo.com/v8/finance/chart/USDEGP%3DX?interval=1d&range=1d",
        { headers: YF_HEADERS, cache: "no-store" }
      ),
    ]);

    if (!goldRes.ok || !fxRes.ok) {
      return NextResponse.json({ error: "Could not fetch gold data" }, { status: 502 });
    }

    const [goldData, fxData] = await Promise.all([goldRes.json(), fxRes.json()]);

    const goldMeta = goldData.chart?.result?.[0]?.meta;
    const fxMeta = fxData.chart?.result?.[0]?.meta;

    if (!goldMeta || !fxMeta) {
      return NextResponse.json({ error: "No gold data found" }, { status: 404 });
    }

    const spotUsd = goldMeta.regularMarketPrice ?? 0;
    const usdToEgp = fxMeta.regularMarketPrice ?? 0;

    if (spotUsd === 0 || usdToEgp === 0) {
      return NextResponse.json({ error: "Invalid price data" }, { status: 502 });
    }

    const pricePerGram24K = (spotUsd / TROY_OZ_TO_GRAMS) * usdToEgp;
    const pricePerGram21K = pricePerGram24K * (21 / 24);
    const pricePerGram18K = pricePerGram24K * (18 / 24);
    // Gold pound: 8 grams at 21.6 karat purity
    const goldPoundPrice = pricePerGram24K * 8 * (21.6 / 24);
    // Gold bar: one troy ounce
    const goldBarPrice = spotUsd * usdToEgp;

    return NextResponse.json({
      spotUsd: Math.round(spotUsd * 100) / 100,
      usdToEgp: Math.round(usdToEgp * 100) / 100,
      updatedAt: new Date().toISOString(),
      prices: {
        karat24: applySpread(pricePerGram24K),
        karat21: applySpread(pricePerGram21K),
        karat18: applySpread(pricePerGram18K),
        goldPound: applySpread(goldPoundPrice),
        goldBar: applySpread(goldBarPrice),
      },
    });
  } catch (error) {
    console.error("Gold API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gold prices" },
      { status: 500 }
    );
  }
}

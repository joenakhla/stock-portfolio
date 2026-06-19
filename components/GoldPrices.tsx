"use client";

import { useState, useEffect } from "react";
import { GoldPricesData } from "@/lib/types";

interface GoldItem {
  key: keyof GoldPricesData["prices"];
  nameAr: string;
  nameEn: string;
  unit: string;
}

const GOLD_ITEMS: GoldItem[] = [
  { key: "karat24", nameAr: "عيار 24", nameEn: "24 Karat", unit: "per gram" },
  { key: "karat21", nameAr: "عيار 21", nameEn: "21 Karat", unit: "per gram" },
  { key: "karat18", nameAr: "عيار 18", nameEn: "18 Karat", unit: "per gram" },
  { key: "goldPound", nameAr: "جنيه الذهب", nameEn: "Gold Pound", unit: "8g / 21.6K" },
  { key: "goldBar", nameAr: "سبيكة الذهب", nameEn: "Gold Bar (1 oz)", unit: "31.1g" },
];

function formatEGP(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GoldPrices() {
  const [data, setData] = useState<GoldPricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchGold() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/gold?t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGold();
    const timer = setInterval(fetchGold, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading gold prices...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">&#x1FA99;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Could not load gold prices</h2>
        <p className="text-gray-500 mb-4">Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const updatedTime = new Date(data.updatedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Gold Prices in Egypt
        </h2>
        <p className="text-sm text-gray-500">
          Live gold prices in Egyptian Pounds (EGP). Buy &amp; sell estimates updated every minute.
        </p>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-amber-700 font-medium">Spot Gold (USD)</p>
          <p className="text-lg font-bold text-amber-900">${data.spotUsd.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-blue-700 font-medium">USD / EGP</p>
          <p className="text-lg font-bold text-blue-900">{data.usdToEgp.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-gray-500 font-medium">Last Updated</p>
          <p className="text-lg font-bold text-gray-700">{updatedTime}</p>
        </div>
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOLD_ITEMS.map((item) => {
          const prices = data.prices[item.key];
          return (
            <div
              key={item.key}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-3 border-b border-amber-100">
                <h3 className="font-bold text-gray-900 text-lg">{item.nameAr}</h3>
                <p className="text-xs text-gray-500">{item.nameEn} &middot; {item.unit}</p>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Buy</p>
                  <p className="text-xl font-bold text-green-700">{formatEGP(prices.buy)}</p>
                  <p className="text-xs text-gray-400">EGP</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Sell</p>
                  <p className="text-xl font-bold text-red-600">{formatEGP(prices.sell)}</p>
                  <p className="text-xs text-gray-400">EGP</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Prices are estimates based on international gold spot price and USD/EGP exchange rate.
        Buy/sell spread is approximate. Actual prices may vary by dealer.
      </p>
    </div>
  );
}

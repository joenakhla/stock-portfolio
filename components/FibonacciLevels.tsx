"use client";

import { useState, useEffect } from "react";
import { FibonacciResult } from "@/lib/types";

interface FibonacciLevelsProps {
  symbol: string;
}

export default function FibonacciLevels({ symbol }: FibonacciLevelsProps) {
  const [data, setData] = useState<FibonacciResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchFib() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/fibonacci?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFib();
    return () => { cancelled = true; };
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Calculating Fibonacci levels...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-400">
        Fibonacci analysis unavailable for {symbol}
      </div>
    );
  }

  const badgeColor =
    data.recommendation === "Buy"
      ? "bg-green-100 text-green-800"
      : data.recommendation === "Sell"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";

  const priceRange = data.swingHigh - data.swingLow;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900">
          Fibonacci Retracement
        </h4>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badgeColor}`}>
          {data.recommendation}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">{data.reasoning}</p>

      {/* Visual Fibonacci scale */}
      <div className="relative bg-gray-50 rounded-lg p-3">
        <div className="relative" style={{ height: "180px" }}>
          {data.levels.map((level) => {
            const topPercent = priceRange > 0
              ? ((data.swingHigh - level.price) / priceRange) * 100
              : 0;
            return (
              <div
                key={level.percent}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${Math.min(topPercent, 100)}%` }}
              >
                <div className="flex-1 border-t border-dashed border-gray-300" />
                <span className="text-[10px] text-gray-500 px-1.5 whitespace-nowrap">
                  {level.label}
                </span>
                <span className="text-[10px] font-medium text-gray-700 w-16 text-right">
                  ${level.price.toFixed(2)}
                </span>
              </div>
            );
          })}

          {/* Current price marker */}
          {priceRange > 0 && (
            <div
              className="absolute left-0 right-0 flex items-center z-10"
              style={{
                top: `${((data.swingHigh - data.currentPrice) / priceRange) * 100}%`,
              }}
            >
              <div className="flex-1 border-t-2 border-blue-500" />
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                Now ${data.currentPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Level table */}
      <div className="mt-3 space-y-1">
        {data.levels.map((level) => {
          const isNear = Math.abs(data.currentPrice - level.price) / data.currentPrice < 0.03;
          return (
            <div
              key={level.percent}
              className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                isNear ? "bg-blue-50 font-semibold text-blue-900" : "text-gray-600"
              }`}
            >
              <span>{level.label}</span>
              <span>${level.price.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        Based on 6-month price range. Not financial advice.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

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

interface FibonacciData {
  symbol: string;
  currentPrice: number;
  high6m: number;
  low6m: number;
  trend: "up" | "down" | "sideways";
  levels: FibonacciLevels;
  history: HistoryPoint[];
  analysis: string | null;
}

interface FibonacciPanelProps {
  symbol: string;
  onClose: () => void;
}

const LEVEL_DEFS: { key: keyof FibonacciLevels; label: string; pct: string }[] = [
  { key: "l100", label: "100%", pct: "100%" },
  { key: "l786", label: "78.6%", pct: "78.6%" },
  { key: "l618", label: "61.8%", pct: "61.8%" },
  { key: "l500", label: "50%", pct: "50%" },
  { key: "l382", label: "38.2%", pct: "38.2%" },
  { key: "l236", label: "23.6%", pct: "23.6%" },
  { key: "l0", label: "0%", pct: "0%" },
];

function levelBgColor(key: keyof FibonacciLevels): string {
  if (key === "l100") return "bg-red-100 border-red-300";
  if (key === "l786") return "bg-orange-100 border-orange-300";
  if (key === "l618") return "bg-amber-100 border-amber-300";
  if (key === "l500") return "bg-yellow-50 border-yellow-300";
  if (key === "l382") return "bg-emerald-100 border-emerald-300";
  if (key === "l236") return "bg-green-100 border-green-300";
  return "bg-green-200 border-green-400";
}

function priceToPercent(price: number, low: number, high: number): number {
  if (high === low) return 0;
  return ((price - low) / (high - low)) * 100;
}

export default function FibonacciPanel({ symbol, onClose }: FibonacciPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FibonacciData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fibonacci?symbol=${encodeURIComponent(symbol)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setData(json as FibonacciData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">Fibonacci Analysis</span>
            <span className="text-sm text-gray-500 font-medium">{symbol}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              <p className="text-sm text-gray-500">Analyzing Fibonacci levels...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">⚠️</div>
              <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loaded */}
          {!loading && !error && data && (
            <>
              {/* Price + Trend Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Current Price</p>
                </div>
                <div>
                  {data.trend === "up" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      ▲ Uptrend
                    </span>
                  )}
                  {data.trend === "down" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                      ▼ Downtrend
                    </span>
                  )}
                  {data.trend === "sideways" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                      → Sideways
                    </span>
                  )}
                </div>
              </div>

              {/* Fibonacci Ladder */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Fibonacci Levels
                </h3>
                {/* The ladder: vertical bar + level rows */}
                <div className="flex gap-3">
                  {/* Color bar */}
                  <div className="relative flex flex-col w-4 rounded-full overflow-hidden flex-shrink-0" style={{ minHeight: 280 }}>
                    {/* bottom green zone */}
                    <div className="flex-1 bg-gradient-to-t from-green-400 via-green-300 to-emerald-200" style={{ flex: "61.8" }} />
                    {/* amber caution zone 61.8–78.6 */}
                    <div className="bg-amber-400" style={{ flex: "16.8" }} />
                    {/* red overbought zone 78.6–100 */}
                    <div className="bg-red-400" style={{ flex: "21.4" }} />
                  </div>

                  {/* Levels list */}
                  <div className="flex-1 flex flex-col" style={{ minHeight: 280 }}>
                    {LEVEL_DEFS.map(({ key, label }) => {
                      const price = data.levels[key];
                      const positionPct = priceToPercent(price, data.low6m, data.high6m);
                      const currentPosPct = priceToPercent(data.currentPrice, data.low6m, data.high6m);
                      // Check if current price is within 1% of this level
                      const range = data.high6m - data.low6m;
                      const isNear = range > 0 && Math.abs(data.currentPrice - price) / range < 0.015;

                      return (
                        <div
                          key={key}
                          className={`relative flex items-center justify-between px-2 py-1 rounded-lg border text-xs mb-1 ${levelBgColor(key)} ${isNear ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                        >
                          <span className="font-semibold text-gray-700 w-12">{label}</span>
                          <span className="font-mono font-bold text-gray-900">
                            {price.toFixed(2)}
                          </span>
                          {/* Current price indicator dot */}
                          {(() => {
                            // Show current price marker between l0 and l100
                            // We position it inline on the row that matches its position
                            const rowMidPct = positionPct;
                            const diff = currentPosPct - rowMidPct;
                            if (Math.abs(diff) < 8) {
                              return (
                                <span className="ml-2 flex items-center gap-1 text-blue-600 font-bold">
                                  ◀ {data.currentPrice.toFixed(2)}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current price bar position indicator */}
                <div className="mt-3 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  {/* Zone fills */}
                  <div className="absolute inset-y-0 left-0 bg-green-300 rounded-l-full" style={{ width: "61.8%" }} />
                  <div className="absolute inset-y-0 bg-amber-300" style={{ left: "61.8%", width: "16.8%" }} />
                  <div className="absolute inset-y-0 bg-red-300 rounded-r-full" style={{ left: "78.6%", right: 0 }} />
                  {/* Current price dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md z-10"
                    style={{ left: `${priceToPercent(data.currentPrice, data.low6m, data.high6m).toFixed(1)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                    <span className="text-[10px] text-gray-600 font-medium">{data.low6m.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-600 font-medium">{data.high6m.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">6-month range — blue dot = current price</p>
              </div>

              {/* Zone Summary Cards */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Zone Summary
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-green-800 mb-1">Strong Buy Zone</p>
                    <p className="text-sm font-mono font-semibold text-green-900">
                      {data.levels.l382.toFixed(2)} – {data.levels.l618.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-green-600 mt-0.5">38.2% – 61.8%</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-amber-800 mb-1">Caution Zone</p>
                    <p className="text-sm font-mono font-semibold text-amber-900">
                      {data.levels.l618.toFixed(2)} – {data.levels.l786.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">61.8% – 78.6%</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-800 mb-1">Sell / Take Profit</p>
                    <p className="text-sm font-mono font-semibold text-red-900">
                      {data.levels.l786.toFixed(2)}+
                    </p>
                    <p className="text-[10px] text-red-600 mt-0.5">78.6% – 100%</p>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  AI Analysis
                </h3>
                {data.analysis ? (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✨</span>
                      <span className="text-xs font-bold text-purple-800">Gemini AI Insights</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{data.analysis}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl mt-0.5">💡</span>
                    <p className="text-sm text-gray-500">
                      Add{" "}
                      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-gray-700">
                        GEMINI_API_KEY
                      </code>{" "}
                      to your Vercel environment variables for AI-powered analysis.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <p className="text-[10px] text-gray-400 text-center pb-2">
                Based on 6-month price history. Not financial advice.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

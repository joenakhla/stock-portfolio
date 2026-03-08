"use client";

import { useState, useEffect } from "react";
import PerformanceChart from "./DynamicChart";
import StockNews from "./StockNews";

interface TrendingStock {
  symbol: string;
  name: string;
  currentPrice: number;
  dayChange: number;
  weekChange: number;
  monthChange: number;
  volumeSpike: number;
  fromLow52: number;
  high52Week: number;
  low52Week: number;
  momentumScore: number;
  reasons: string[];
}

interface TrendingData {
  stocks: TrendingStock[];
  updatedAt: string;
}

interface TrendingProps {
  onAddToWatchlist?: (stock: { symbol: string; name: string }) => void;
}

export default function Trending({ onAddToWatchlist }: TrendingProps) {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/trending?t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Scanning the market for hot stocks...
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Analyzing price momentum, volume spikes &amp; trends
          </p>
        </div>
      </div>
    );
  }

  if (error || !data || data.stocks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📡</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Couldn&apos;t load trending stocks
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Market data is temporarily unavailable. This usually happens outside
          trading hours or when Yahoo Finance is slow. Try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  function getMomentumLabel(score: number): {
    label: string;
    color: string;
    bg: string;
  } {
    if (score >= 30)
      return {
        label: "🔥 On Fire",
        color: "text-orange-700",
        bg: "bg-orange-100",
      };
    if (score >= 15)
      return {
        label: "🚀 Strong",
        color: "text-green-700",
        bg: "bg-green-100",
      };
    if (score >= 5)
      return {
        label: "📈 Rising",
        color: "text-blue-700",
        bg: "bg-blue-100",
      };
    return {
      label: "👀 Watching",
      color: "text-gray-600",
      bg: "bg-gray-100",
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🔥</span> Trending Stocks
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Stocks with strong momentum — big moves, volume spikes, and breakouts.
          Click any stock for news &amp; charts.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
          🔥 On Fire = Extremely strong momentum
        </span>
        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
          🚀 Strong = Solid uptrend
        </span>
        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
          📈 Rising = Building momentum
        </span>
        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          👀 Watching = Keep an eye on it
        </span>
      </div>

      {/* Stock Cards */}
      <div className="space-y-3">
        {data.stocks.map((stock) => {
          const momentum = getMomentumLabel(stock.momentumScore);
          const isExpanded = expandedSymbol === stock.symbol;

          return (
            <div
              key={stock.symbol}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Main Row */}
              <button
                onClick={() =>
                  setExpandedSymbol(isExpanded ? null : stock.symbol)
                }
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Momentum Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      stock.momentumScore >= 30
                        ? "bg-orange-100"
                        : stock.momentumScore >= 15
                          ? "bg-green-100"
                          : stock.momentumScore >= 5
                            ? "bg-blue-100"
                            : "bg-gray-100"
                    }`}
                  >
                    {stock.momentumScore >= 30
                      ? "🔥"
                      : stock.momentumScore >= 15
                        ? "🚀"
                        : stock.momentumScore >= 5
                          ? "📈"
                          : "👀"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">
                        {stock.symbol}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${momentum.bg} ${momentum.color}`}
                      >
                        {momentum.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{stock.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Price + Day Change */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      ${stock.currentPrice.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        stock.dayChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stock.dayChange >= 0 ? "+" : ""}
                      {stock.dayChange.toFixed(2)}% today
                    </p>
                  </div>

                  {/* Expand Arrow */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Why it's trending */}
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {stock.reasons.map((reason, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200"
                  >
                    {reason}
                  </span>
                ))}
              </div>

              {/* Stats Row */}
              <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-500">Week</p>
                  <p
                    className={`text-sm font-bold ${
                      stock.weekChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stock.weekChange >= 0 ? "+" : ""}
                    {stock.weekChange.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-500">Month</p>
                  <p
                    className={`text-sm font-bold ${
                      stock.monthChange >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stock.monthChange >= 0 ? "+" : ""}
                    {stock.monthChange.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-500">Volume</p>
                  <p
                    className={`text-sm font-bold ${
                      stock.volumeSpike > 0
                        ? "text-orange-600"
                        : "text-gray-600"
                    }`}
                  >
                    {stock.volumeSpike > 0 ? "+" : ""}
                    {stock.volumeSpike.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-500">From 52W Low</p>
                  <p className="text-sm font-bold text-blue-600">
                    +{stock.fromLow52.toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* 52-Week Range */}
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>${stock.low52Week.toFixed(2)}</span>
                  <div className="flex-1 relative h-2 bg-gray-200 rounded-full">
                    <div
                      className="absolute h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{
                        width: `${
                          stock.high52Week > stock.low52Week
                            ? Math.min(
                                ((stock.currentPrice - stock.low52Week) /
                                  (stock.high52Week - stock.low52Week)) *
                                  100,
                                100
                              )
                            : 50
                        }%`,
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 bg-blue-600 rounded-full -top-0.5 border-2 border-white shadow"
                      style={{
                        left: `${
                          stock.high52Week > stock.low52Week
                            ? Math.min(
                                ((stock.currentPrice - stock.low52Week) /
                                  (stock.high52Week - stock.low52Week)) *
                                  100,
                                100
                              )
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                  <span>${stock.high52Week.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  52-Week Range
                </p>
              </div>

              {/* Add to Watchlist button */}
              {onAddToWatchlist && (
                <div className="px-5 pb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToWatchlist({
                        symbol: stock.symbol,
                        name: stock.name,
                      });
                    }}
                    className="w-full py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Add to Watchlist
                  </button>
                </div>
              )}

              {/* Expanded Section — Chart + News */}
              {isExpanded && (
                <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <PerformanceChart
                      symbols={[stock.symbol]}
                      title={`${stock.symbol} Price History`}
                    />
                    <div>
                      <h4 className="text-base font-bold text-gray-900 mb-3">
                        Latest News for {stock.symbol}
                      </h4>
                      <StockNews symbol={stock.symbol} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Remember:</strong> Trending stocks can be risky. High
          momentum can reverse quickly. Always do your own research before
          investing. This is not financial advice.
        </p>
      </div>

      {/* Updated time */}
      <p className="text-xs text-gray-400 text-center">
        Last scanned:{" "}
        {new Date(data.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

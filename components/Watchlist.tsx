"use client";

import { useState, useEffect, useCallback } from "react";
import { WatchlistStock, StockQuote, SimulationResult } from "@/lib/types";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  generateId,
} from "@/lib/storage";
import AddStockModal from "./AddStockModal";
import PerformanceChart from "./DynamicChart";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [simulations, setSimulations] = useState<
    Record<string, SimulationResult[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  const fetchQuotes = useCallback(async (stocks: WatchlistStock[]) => {
    if (stocks.length === 0) {
      setLoading(false);
      return;
    }
    const symbols = [...new Set(stocks.map((s) => s.symbol))];
    try {
      const res = await fetch(`/api/quote?symbol=${symbols.join(",")}`);
      const data = await res.json();
      setQuotes(data);
    } catch {
      // Will show as unavailable
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const stocks = getWatchlist();
    setWatchlist(stocks);
    fetchQuotes(stocks);
  }, [fetchQuotes]);

  async function runSimulation(symbol: string) {
    if (simulations[symbol]) {
      setExpandedStock(expandedStock === symbol ? null : symbol);
      return;
    }

    setExpandedStock(symbol);

    // Fetch 1 year of history to calculate past performance
    try {
      const res = await fetch(
        `/api/history?symbol=${encodeURIComponent(symbol)}&range=1y`
      );
      const data = await res.json();
      const history = data.history || [];

      if (history.length === 0) {
        setSimulations((prev) => ({
          ...prev,
          [symbol]: [
            {
              months: 1,
              label: "1 month ago",
              pastPrice: null,
              currentPrice: 0,
              returnPercent: null,
              returnDollars: null,
            },
          ],
        }));
        return;
      }

      const currentPrice = history[history.length - 1]?.close || 0;
      const today = new Date();

      const periods = [
        { months: 1, label: "1 month ago" },
        { months: 3, label: "3 months ago" },
        { months: 6, label: "6 months ago" },
        { months: 12, label: "12 months ago" },
      ];

      const results: SimulationResult[] = periods.map((period) => {
        const targetDate = new Date(today);
        targetDate.setMonth(targetDate.getMonth() - period.months);

        // Find closest date in history
        let closest = history[0];
        let minDiff = Math.abs(
          new Date(history[0].date).getTime() - targetDate.getTime()
        );

        for (const point of history) {
          const diff = Math.abs(
            new Date(point.date).getTime() - targetDate.getTime()
          );
          if (diff < minDiff) {
            minDiff = diff;
            closest = point;
          }
        }

        // Only use data if within 10 days of target
        const daysDiff = minDiff / (1000 * 60 * 60 * 24);
        if (daysDiff > 10) {
          return {
            months: period.months,
            label: period.label,
            pastPrice: null,
            currentPrice,
            returnPercent: null,
            returnDollars: null,
          };
        }

        const pastPrice = closest.close;
        const returnPercent =
          ((currentPrice - pastPrice) / pastPrice) * 100;
        const returnDollars = (returnPercent / 100) * 100; // Gain on $100 invested

        return {
          months: period.months,
          label: period.label,
          pastPrice,
          currentPrice,
          returnPercent,
          returnDollars,
        };
      });

      setSimulations((prev) => ({ ...prev, [symbol]: results }));
    } catch {
      // Simulation unavailable
    }
  }

  function handleAdd(stock: {
    symbol: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }) {
    const newStock: WatchlistStock = {
      id: generateId(),
      symbol: stock.symbol,
      name: stock.name,
      addedDate: new Date().toISOString().split("T")[0],
    };
    const updated = addToWatchlist(newStock);
    setWatchlist(updated);
    fetchQuotes(updated);
  }

  function handleRemove(id: string) {
    const updated = removeFromWatchlist(id);
    setWatchlist(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Watchlist</h2>
          <p className="text-sm text-gray-500">
            Stocks you&apos;re interested in. See what would have happened if you
            bought them.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Watch a Stock
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">👀</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Your watchlist is empty
          </h3>
          <p className="text-gray-500 mb-4">
            Add stocks you&apos;re curious about. You&apos;ll see their current price and
            what your return would have been.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {watchlist.map((stock) => {
            const quote = quotes[stock.symbol] as StockQuote | undefined;
            const isExpanded = expandedStock === stock.symbol;
            const sim = simulations[stock.symbol];

            return (
              <div
                key={stock.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-bold text-lg text-gray-900">
                        {stock.symbol}
                      </span>
                      <p className="text-sm text-gray-500">{stock.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Current Price */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Price</p>
                      {loading ? (
                        <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse" />
                      ) : quote?.currentPrice ? (
                        <p className="font-bold text-lg text-gray-900">
                          ${quote.currentPrice.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-gray-400">N/A</p>
                      )}
                    </div>

                    {/* Today's Change */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Today</p>
                      {loading ? (
                        <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse" />
                      ) : quote?.changePercent !== undefined ? (
                        <p
                          className={`font-semibold ${quote.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {quote.changePercent >= 0 ? "+" : ""}
                          {quote.changePercent.toFixed(2)}%
                        </p>
                      ) : (
                        <p className="text-gray-400">N/A</p>
                      )}
                    </div>

                    {/* 52W Range */}
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-gray-500">
                        52W Low / High
                      </p>
                      {loading ? (
                        <span className="inline-block w-28 h-6 bg-gray-200 rounded animate-pulse" />
                      ) : quote?.low52Week && quote?.high52Week ? (
                        <p className="text-sm">
                          <span className="text-red-500 font-medium">
                            ${quote.low52Week.toFixed(2)}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-green-600 font-medium">
                            ${quote.high52Week.toFixed(2)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">N/A</p>
                      )}
                    </div>

                    {/* Simulate Button */}
                    <button
                      onClick={() => runSimulation(stock.symbol)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isExpanded
                          ? "bg-purple-100 text-purple-700"
                          : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                      }`}
                    >
                      {isExpanded ? "Hide" : "What If?"}
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(stock.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from watchlist"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Simulation Results */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-purple-50/50">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      &quot;What If&quot; — If you had invested $100...
                    </h4>
                    {sim ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {sim.map((result) => (
                          <div
                            key={result.months}
                            className="bg-white rounded-xl p-4 border border-gray-200"
                          >
                            <p className="text-sm text-gray-500 mb-1">
                              {result.label}
                            </p>
                            {result.returnPercent !== null ? (
                              <>
                                <p
                                  className={`text-xl font-bold ${result.returnPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {result.returnPercent >= 0 ? "+" : ""}
                                  {result.returnPercent.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  $100 would be{" "}
                                  <span className="font-medium text-gray-900">
                                    ${(100 + (result.returnDollars || 0)).toFixed(2)}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Price was ${result.pastPrice?.toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400">
                                Not enough data
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        Loading simulation...
                      </div>
                    )}

                    <div className="mt-4">
                      <PerformanceChart
                        symbols={[stock.symbol]}
                        title={`${stock.symbol} Price History`}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Past performance does not predict future results. This is
                      for educational purposes only, not financial advice.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddStockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        mode="watchlist"
      />
    </div>
  );
}

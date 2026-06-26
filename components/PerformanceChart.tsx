"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { HistoricalDataPoint } from "@/lib/types";

interface PerformanceChartProps {
  symbols: string[];
  title?: string;
  mode?: "individual" | "portfolio";
  defaultRange?: string;
  portfolioData?: {
    symbol: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }[];
}

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const RANGE_OPTIONS = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
];

export default function PerformanceChart({
  symbols,
  title = "Price History",
  mode = "individual",
  defaultRange = "1y",
  portfolioData,
}: PerformanceChartProps) {
  const [range, setRange] = useState(defaultRange);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);

  // Stabilize the symbols array so useEffect doesn't re-run on every render
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (symbolsKey === "") return;
    const currentSymbols = symbolsKey.split(",");

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setFailedSymbols([]);
      const map: Record<string, HistoricalDataPoint[]> = {};
      const failed: string[] = [];

      if (mode === "portfolio" && currentSymbols.length > 1) {
        // Sequential with progress to avoid hammering Yahoo with many stocks
        setLoadProgress({ loaded: 0, total: currentSymbols.length });
        for (let i = 0; i < currentSymbols.length; i++) {
          if (cancelled) return;
          const sym = currentSymbols[i];
          try {
            const res = await fetch(`/api/history?symbol=${encodeURIComponent(sym)}&range=${range}`);
            const data = await res.json();
            if (data.error) {
              map[sym] = [];
              failed.push(sym);
            } else {
              map[sym] = data.history || [];
            }
          } catch {
            map[sym] = [];
            failed.push(sym);
          }
          if (!cancelled) setLoadProgress({ loaded: i + 1, total: currentSymbols.length });
        }
      } else {
        // Parallel for single stock or small comparisons
        await Promise.all(
          currentSymbols.map(async (sym) => {
            try {
              const res = await fetch(`/api/history?symbol=${encodeURIComponent(sym)}&range=${range}`);
              const data = await res.json();
              if (data.error) {
                map[sym] = [];
                failed.push(sym);
              } else {
                map[sym] = data.history || [];
              }
            } catch {
              map[sym] = [];
              failed.push(sym);
            }
          })
        );
      }

      if (!cancelled) {
        setHistoryMap(map);
        setFailedSymbols(failed);
        setLoading(false);
        setLoadProgress(null);
      }
    }

    fetchHistory();

    return () => { cancelled = true; };
  }, [symbolsKey, range, mode]);

  const chartData = useMemo(() => {
    if (mode === "portfolio" && portfolioData && portfolioData.length > 0) {
      const allDates = new Set<string>();
      for (const stock of portfolioData) {
        const history = historyMap[stock.symbol] || [];
        for (const point of history) {
          allDates.add(point.date);
        }
      }

      const sortedDates = Array.from(allDates).sort();

      return sortedDates.map((date) => {
        let totalValue = 0;
        for (const stock of portfolioData) {
          const history = historyMap[stock.symbol] || [];
          const point = history.find((p) => p.date === date);
          if (point) {
            totalValue += stock.shares * point.close;
          }
        }
        return { date, value: Math.round(totalValue * 100) / 100 };
      });
    }

    if (symbols.length === 1) {
      const history = historyMap[symbols[0]] || [];
      return history.map((p) => ({ date: p.date, [symbols[0]]: p.close }));
    }

    const allDates = new Set<string>();
    for (const sym of symbols) {
      for (const point of historyMap[sym] || []) {
        allDates.add(point.date);
      }
    }

    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map((date) => {
      const entry: Record<string, string | number> = { date };
      for (const sym of symbols) {
        const history = historyMap[sym] || [];
        const point = history.find((p) => p.date === date);
        if (point) entry[sym] = point.close;
      }
      return entry;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyMap, symbolsKey, mode]);

  if (symbols.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 md:h-64 flex items-center justify-center text-gray-400">
          Add stocks to see their price history chart
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{title}</h3>
        <div className="flex flex-wrap gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                range === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 md:h-64 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          {loadProgress && loadProgress.total > 1 && (
            <p className="text-sm text-gray-400">
              Loading {loadProgress.loaded} / {loadProgress.total} stocks…
            </p>
          )}
        </div>
      ) : (
        <div className="h-48 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {mode === "portfolio" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                  width={80}
                />
                <Tooltip
                  formatter={(value: string | number | (string | number)[]) => [
                    `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Portfolio Value",
                  ]}
                  labelFormatter={(label: string) =>
                    new Date(label).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v}`}
                  width={70}
                />
                <Tooltip
                  formatter={(value: string | number | (string | number)[], name: string) => [
                    `$${Number(value).toFixed(2)}`,
                    name,
                  ]}
                  labelFormatter={(label: string) =>
                    new Date(label).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
                {symbols.map((sym, i) => (
                  <Line
                    key={sym}
                    type="monotone"
                    dataKey={sym}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {symbols.length > 1 && mode === "individual" && (
        <div className="flex flex-wrap gap-3 mt-3">
          {symbols.map((sym, i) => (
            <div key={sym} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-sm text-gray-600 font-medium">{sym}</span>
            </div>
          ))}
        </div>
      )}

      {failedSymbols.length > 0 && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            Could not load history for{" "}
            <strong>{failedSymbols.join(", ")}</strong>. Chart may be incomplete.
          </span>
        </div>
      )}
    </div>
  );
}

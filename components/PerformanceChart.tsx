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
  portfolioData,
}: PerformanceChartProps) {
  const [range, setRange] = useState("1y");
  const [historyMap, setHistoryMap] = useState<
    Record<string, HistoricalDataPoint[]>
  >({});
  const [loading, setLoading] = useState(false);

  // Stabilize the symbols array so useEffect doesn't re-run on every render
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (symbolsKey === "") return;
    const currentSymbols = symbolsKey.split(",");

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      const map: Record<string, HistoricalDataPoint[]> = {};

      await Promise.all(
        currentSymbols.map(async (sym) => {
          try {
            const res = await fetch(
              `/api/history?symbol=${encodeURIComponent(sym)}&range=${range}`
            );
            const data = await res.json();
            map[sym] = data.history || [];
          } catch {
            map[sym] = [];
          }
        })
      );

      if (!cancelled) {
        setHistoryMap(map);
        setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [symbolsKey, range]);

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
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Add stocks to see their price history chart
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex gap-1">
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
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-72">
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
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <span className="text-sm text-gray-600 font-medium">{sym}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

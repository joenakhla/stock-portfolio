"use client";

import { useState } from "react";
import { PortfolioStock, StockQuote } from "@/lib/types";
import PerformanceChart from "./DynamicChart";
import StockNews from "./StockNews";

interface DashboardProps {
  stocks: PortfolioStock[];
  quotes: Record<string, StockQuote | { error: string }>;
  loading: boolean;
  quotesLoading: boolean;
}

export default function Dashboard({
  stocks,
  quotes,
  loading,
  quotesLoading,
}: DashboardProps) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const totalInvested = stocks.reduce(
    (sum, s) => sum + s.shares * s.purchasePrice,
    0
  );

  const totalCurrentValue = stocks.reduce((sum, s) => {
    const quote = quotes[s.symbol];
    if (!quote || "error" in quote) return sum;
    return sum + s.shares * quote.currentPrice;
  }, 0);

  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent =
    totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const topGainers = stocks
    .map((s) => {
      const quote = quotes[s.symbol];
      if (!quote || "error" in quote) return null;
      const q = quote as StockQuote;
      if (!q.currentPrice) return null;
      const gain =
        ((q.currentPrice - s.purchasePrice) / s.purchasePrice) * 100;
      const amountPaid = s.shares * s.purchasePrice;
      const currentValue = s.shares * q.currentPrice;
      const dollarPL = currentValue - amountPaid;
      return { ...s, gain, currentPrice: q.currentPrice, amountPaid, currentValue, dollarPL };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.gain ?? 0) - (a?.gain ?? 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Your Stock Portfolio!
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Start by adding stocks you own. Click the{" "}
          <strong>&quot;My Stocks&quot;</strong> tab above to add your first
          stock and start tracking your money.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 max-w-sm mx-auto text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Start:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Go to the &quot;My Stocks&quot; tab</li>
            <li>2. Click &quot;Add Stock&quot;</li>
            <li>3. Search for a company (like Apple or Tesla)</li>
            <li>4. Enter how many shares you bought and at what price</li>
            <li>5. Come back here to see your dashboard!</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Value Now</p>
          <p className="text-2xl font-bold text-gray-900">
            {quotesLoading ? (
              <span className="inline-block w-24 h-7 bg-gray-200 rounded animate-pulse" />
            ) : (
              `$${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Profit / Loss</p>
          {quotesLoading ? (
            <span className="inline-block w-24 h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalGain >= 0 ? "+" : ""}${Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Return</p>
          {quotesLoading ? (
            <span className="inline-block w-24 h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalGainPercent >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Portfolio Chart */}
      <PerformanceChart
        symbols={Array.from(new Set(stocks.map((s) => s.symbol)))}
        title="Portfolio Value Over Time"
        mode="portfolio"
        portfolioData={stocks.map((s) => ({
          symbol: s.symbol,
          shares: s.shares,
          purchasePrice: s.purchasePrice,
          purchaseDate: s.purchaseDate,
        }))}
      />

      {/* Stocks list — click to expand for news + chart */}
      {topGainers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-lg font-bold text-gray-900">
              Your Stocks — Click for News &amp; Analysis
            </h3>
            <p className="text-sm text-gray-400">
              Tap any stock to see news that could move its price
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {topGainers.map((stock) =>
              stock ? (
                <div key={stock.id}>
                  {/* Stock row */}
                  <button
                    onClick={() =>
                      setExpandedSymbol(
                        expandedSymbol === stock.symbol ? null : stock.symbol
                      )
                    }
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm ${
                          stock.gain >= 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {stock.gain >= 0 ? "+" : "-"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {stock.symbol}
                        </span>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                        {/* Mobile-only: dollar P/L */}
                        <p className={`text-xs font-medium md:hidden ${stock.dollarPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                          P/L: {stock.dollarPL >= 0 ? "+" : "-"}${Math.abs(stock.dollarPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                      {/* Dollar P/L based on amount paid */}
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-400">
                          Paid ${stock.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p
                          className={`text-sm font-semibold ${stock.dollarPL >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {stock.dollarPL >= 0 ? "+" : "-"}${Math.abs(stock.dollarPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {/* Current price + % change */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm md:text-base">
                          ${stock.currentPrice.toFixed(2)}
                        </p>
                        <p
                          className={`text-xs md:text-sm font-medium ${stock.gain >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {stock.gain >= 0 ? "+" : ""}
                          {stock.gain.toFixed(2)}%
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform ${
                          expandedSymbol === stock.symbol ? "rotate-180" : ""
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

                  {/* Expanded section: chart + news */}
                  {expandedSymbol === stock.symbol && (
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
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

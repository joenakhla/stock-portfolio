"use client";

import { useState, useEffect } from "react";
import { PortfolioStock, StockQuote } from "@/lib/types";
import { getPortfolio } from "@/lib/storage";
import PerformanceChart from "./DynamicChart";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote | { error: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stocks = getPortfolio();
    setPortfolio(stocks);

    if (stocks.length === 0) {
      setLoading(false);
      return;
    }

    const symbols = [...new Set(stocks.map((s) => s.symbol))];
    fetch(`/api/quote?symbol=${symbols.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalInvested = portfolio.reduce(
    (sum, s) => sum + s.shares * s.purchasePrice,
    0
  );

  const totalCurrentValue = portfolio.reduce((sum, s) => {
    const quote = quotes[s.symbol];
    if (!quote || "error" in quote) return sum;
    return sum + s.shares * quote.currentPrice;
  }, 0);

  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent =
    totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const topGainers = portfolio
    .map((s) => {
      const quote = quotes[s.symbol] as StockQuote | undefined;
      if (!quote?.currentPrice) return null;
      const gain =
        ((quote.currentPrice - s.purchasePrice) / s.purchasePrice) * 100;
      return { ...s, gain, currentPrice: quote.currentPrice };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.gain ?? 0) - (a?.gain ?? 0));

  if (portfolio.length === 0) {
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
            {loading ? (
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
          {loading ? (
            <span className="inline-block w-24 h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p
              className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalGain >= 0 ? "+" : ""}$
              {Math.abs(totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Return</p>
          {loading ? (
            <span className="inline-block w-24 h-7 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p
              className={`text-2xl font-bold ${totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalGainPercent >= 0 ? "+" : ""}
              {totalGainPercent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Portfolio Chart */}
      <PerformanceChart
        symbols={[...new Set(portfolio.map((s) => s.symbol))]}
        title="Portfolio Value Over Time"
        mode="portfolio"
        portfolioData={portfolio.map((s) => ({
          symbol: s.symbol,
          shares: s.shares,
          purchasePrice: s.purchasePrice,
          purchaseDate: s.purchaseDate,
        }))}
      />

      {/* Top Performers */}
      {topGainers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Your Stocks Ranked by Return
          </h3>
          <div className="space-y-3">
            {topGainers.map((stock) =>
              stock ? (
                <div
                  key={stock.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="font-semibold text-gray-900">
                      {stock.symbol}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {stock.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${stock.currentPrice.toFixed(2)}
                    </p>
                    <p
                      className={`text-sm font-medium ${stock.gain >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stock.gain >= 0 ? "+" : ""}
                      {stock.gain.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

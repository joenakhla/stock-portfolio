"use client";

import { useState } from "react";
import { PortfolioStock, StockQuote } from "@/lib/types";
import AddStockModal from "./AddStockModal";
import PerformanceChart from "./DynamicChart";

interface PortfolioProps {
  stocks: PortfolioStock[];
  quotes: Record<string, StockQuote | { error: string }>;
  loading: boolean;
  quotesLoading: boolean;
  onAdd: (stock: {
    symbol: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function Portfolio({
  stocks,
  quotes,
  loading,
  quotesLoading,
  onAdd,
  onRemove,
}: PortfolioProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  function handleAdd(stock: {
    symbol: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }) {
    onAdd(stock);
  }

  function handleRemove(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to remove this stock from your portfolio?"
      )
    )
      return;
    onRemove(id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Stocks</h2>
          <p className="text-sm text-gray-500">
            Stocks you own. Add your purchases to track how they&apos;re doing.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </button>
      </div>

      {stocks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">💼</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No stocks yet</h3>
          <p className="text-gray-500 mb-4">
            Click &quot;Add Stock&quot; to start tracking your investments.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">Stock</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Shares</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Buy Price</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Current Price</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Profit / Loss</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">
                      <span title="Lowest and highest price in the last 52 weeks (1 year)">52W Low / High</span>
                    </th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Total Value</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => {
                    const quote = quotes[stock.symbol];
                    const q = quote && !("error" in quote) ? (quote as StockQuote) : null;
                    const currentPrice = q?.currentPrice;
                    const gain = currentPrice ? (currentPrice - stock.purchasePrice) * stock.shares : null;
                    const gainPercent = currentPrice
                      ? ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
                      : null;
                    const totalValue = currentPrice ? currentPrice * stock.shares : null;

                    return (
                      <tr
                        key={stock.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}
                      >
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900">{stock.symbol}</span>
                          <p className="text-sm text-gray-500 truncate max-w-[150px]">{stock.name}</p>
                        </td>
                        <td className="text-right px-5 py-4 font-medium text-gray-900">{stock.shares}</td>
                        <td className="text-right px-5 py-4 text-gray-700">${stock.purchasePrice.toFixed(2)}</td>
                        <td className="text-right px-5 py-4 font-medium text-gray-900">
                          {quotesLoading ? (
                            <span className="inline-block w-16 h-5 bg-gray-200 rounded animate-pulse" />
                          ) : currentPrice ? (
                            `$${currentPrice.toFixed(2)}`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-right px-5 py-4">
                          {quotesLoading ? (
                            <span className="inline-block w-20 h-5 bg-gray-200 rounded animate-pulse" />
                          ) : gain !== null && gainPercent !== null ? (
                            <div>
                              <span className={`font-semibold ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {gain >= 0 ? "+" : ""}${Math.abs(gain).toFixed(2)}
                              </span>
                              <p className={`text-sm ${gainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {gainPercent >= 0 ? "+" : ""}{gainPercent.toFixed(2)}%
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-right px-5 py-4 text-sm">
                          {quotesLoading ? (
                            <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse" />
                          ) : q?.low52Week && q?.high52Week ? (
                            <div>
                              <span className="text-red-500">${q.low52Week.toFixed(2)}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-green-600">${q.high52Week.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-right px-5 py-4 font-bold text-gray-900">
                          {quotesLoading ? (
                            <span className="inline-block w-20 h-5 bg-gray-200 rounded animate-pulse" />
                          ) : totalValue !== null ? (
                            `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(stock.id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove from portfolio"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedStock && (
            <PerformanceChart symbols={[selectedStock]} title={`${selectedStock} Price History`} />
          )}
        </>
      )}

      <AddStockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        mode="portfolio"
      />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PortfolioStock, StockQuote } from "@/lib/types";
import AddStockModal from "./AddStockModal";
import EditStockModal from "./EditStockModal";
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
  onUpdate: (
    id: string,
    updates: { shares: number; purchasePrice: number; purchaseDate: string }
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function Portfolio({
  stocks,
  quotes,
  loading,
  quotesLoading,
  onAdd,
  onUpdate,
  onRemove,
}: PortfolioProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState<PortfolioStock | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Compute lot labels for stocks that appear more than once
  const lotLabels = useMemo(() => {
    const symbolCounts: Record<string, string[]> = {};
    for (const s of stocks) {
      if (!symbolCounts[s.symbol]) symbolCounts[s.symbol] = [];
      symbolCounts[s.symbol].push(s.id);
    }
    const labels: Record<string, string | null> = {};
    for (const [symbol, ids] of Object.entries(symbolCounts)) {
      if (ids.length <= 1) {
        labels[ids[0]] = null; // no label needed
      } else {
        // Sort by purchase date to assign lot numbers
        const sorted = ids
          .map((id) => stocks.find((s) => s.id === id)!)
          .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
        sorted.forEach((s, i) => {
          labels[s.id] = `Lot ${i + 1}`;
        });
      }
    }
    return labels;
  }, [stocks]);

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
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
          <div className="text-5xl mb-4">💼</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No stocks yet</h3>
          <p className="text-gray-500 mb-4">
            Click &quot;Add Stock&quot; to start tracking your investments.
          </p>
        </div>
      ) : (
        <>
          {/* ===== DESKTOP TABLE ===== */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">Stock</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Shares</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Buy Price</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Amount Paid</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Purchased</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Current Price</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Profit / Loss</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">
                      <span title="Lowest and highest price in the last 52 weeks (1 year)">52W Low / High</span>
                    </th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">
                      <span title="Next ex-dividend date and distribution frequency">Dividend</span>
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
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-bold text-gray-900">{stock.symbol}</span>
                              {lotLabels[stock.id] && (
                                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                                  {lotLabels[stock.id]}
                                </span>
                              )}
                              <p className="text-sm text-gray-500 truncate max-w-[150px]">{stock.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-5 py-4 font-medium text-gray-900">{stock.shares}</td>
                        <td className="text-right px-5 py-4 text-gray-700">${stock.purchasePrice.toFixed(2)}</td>
                        <td className="text-right px-5 py-4 font-medium text-gray-900">
                          ${(stock.shares * stock.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right px-5 py-4 text-sm text-gray-500">
                          {new Date(stock.purchaseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
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
                        <td className="text-right px-5 py-4 text-sm">
                          {quotesLoading ? (
                            <span className="inline-block w-24 h-5 bg-gray-200 rounded animate-pulse" />
                          ) : q && q.dividendFrequency !== "None" ? (
                            <div>
                              <span className="font-medium text-gray-900">
                                {q.nextExDividendDate
                                  ? new Date(q.nextExDividendDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                  : "—"}
                              </span>
                              <p className="text-xs text-amber-600 font-medium">{q.dividendFrequency}</p>
                              {q.dividendYield > 0 && (
                                <p className="text-xs text-gray-400">{q.dividendYield.toFixed(2)}% yield</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingStock(stock); }}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                              title="Edit this entry"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemove(stock.id); }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove from portfolio"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== MOBILE CARD LIST ===== */}
          <div className="md:hidden space-y-3">
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
                <div
                  key={stock.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Top row: Symbol + Price + P/L */}
                  <button
                    onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}
                    className="w-full p-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-base">{stock.symbol}</span>
                          {lotLabels[stock.id] && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                              {lotLabels[stock.id]}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        {quotesLoading ? (
                          <span className="inline-block w-16 h-5 bg-gray-200 rounded animate-pulse" />
                        ) : currentPrice ? (
                          <>
                            <p className="font-bold text-gray-900">${currentPrice.toFixed(2)}</p>
                            {gainPercent !== null && (
                              <p className={`text-xs font-semibold ${gainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {gainPercent >= 0 ? "+" : ""}{gainPercent.toFixed(2)}%
                                {gain !== null && (
                                  <span className="ml-1">
                                    ({gain >= 0 ? "+" : ""}${Math.abs(gain).toFixed(2)})
                                  </span>
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-1.5 mt-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Shares</p>
                        <p className="text-sm font-semibold text-gray-900">{stock.shares}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Buy Price</p>
                        <p className="text-sm font-semibold text-gray-900">${stock.purchasePrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Purchased</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {new Date(stock.purchaseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-blue-600 uppercase font-medium">Amount Paid</p>
                        <p className="text-sm font-bold text-blue-800">
                          ${(stock.shares * stock.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Total Value</p>
                        {quotesLoading ? (
                          <span className="inline-block w-14 h-4 bg-gray-200 rounded animate-pulse mt-0.5" />
                        ) : totalValue !== null ? (
                          <p className="text-sm font-semibold text-gray-900">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">N/A</p>
                        )}
                      </div>
                    </div>

                    {/* Dividend info */}
                    {q && q.dividendFrequency !== "None" && (
                      <div className="bg-amber-50 rounded-lg p-2 mt-1.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-amber-700 uppercase font-medium">Next Distribution</p>
                          <p className="text-xs font-bold text-amber-900">
                            {q.nextExDividendDate
                              ? new Date(q.nextExDividendDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-amber-700 uppercase font-medium">Frequency</p>
                          <p className="text-xs font-bold text-amber-900">{q.dividendFrequency}</p>
                        </div>
                        {q.dividendYield > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] text-amber-700 uppercase font-medium">Yield</p>
                            <p className="text-xs font-bold text-amber-900">{q.dividendYield.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 52W Range */}
                    {q?.low52Week && q?.high52Week && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-red-500">${q.low52Week.toFixed(2)}</span>
                        <div className="flex-1 relative h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="absolute h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((currentPrice! - q.low52Week) / (q.high52Week - q.low52Week)) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-green-600">${q.high52Week.toFixed(2)}</span>
                      </div>
                    )}
                  </button>

                  {/* Edit + Delete buttons */}
                  <div className="border-t border-gray-100 px-3.5 py-2 flex justify-end gap-4">
                    <button
                      onClick={() => setEditingStock(stock)}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemove(stock.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
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

      {editingStock && (
        <EditStockModal
          stock={editingStock}
          onClose={() => setEditingStock(null)}
          onSave={onUpdate}
        />
      )}
    </div>
  );
}

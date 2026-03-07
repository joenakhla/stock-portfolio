"use client";

import { useState } from "react";
import { SearchResult } from "@/lib/types";
import StockSearch from "./StockSearch";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stock: {
    symbol: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }) => void;
  mode: "portfolio" | "watchlist";
}

export default function AddStockModal({
  isOpen,
  onClose,
  onAdd,
  mode,
}: AddStockModalProps) {
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  function handleSelect(stock: SearchResult) {
    setSelectedStock(stock);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock) return;

    if (mode === "portfolio") {
      const sharesNum = parseFloat(shares);
      const priceNum = parseFloat(price);
      if (!sharesNum || sharesNum <= 0 || !priceNum || priceNum <= 0) return;

      onAdd({
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        shares: sharesNum,
        purchasePrice: priceNum,
        purchaseDate: date,
      });
    } else {
      onAdd({
        symbol: selectedStock.symbol,
        name: selectedStock.name,
        shares: 0,
        purchasePrice: 0,
        purchaseDate: date,
      });
    }

    setSelectedStock(null);
    setShares("");
    setPrice("");
    setDate(new Date().toISOString().split("T")[0]);
    onClose();
  }

  function handleClose() {
    setSelectedStock(null);
    setShares("");
    setPrice("");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "portfolio" ? "Add Stock to Portfolio" : "Add to Watchlist"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Find a Stock
            </label>
            <StockSearch onSelect={handleSelect} />
            {selectedStock && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900">
                    {selectedStock.symbol}
                  </span>
                  <span className="ml-2 text-blue-700 text-sm">
                    {selectedStock.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStock(null)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {mode === "portfolio" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How many shares did you buy?
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can enter partial shares like 0.5
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price you paid per share ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 150.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  When did you buy it?
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStock}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {mode === "portfolio" ? "Add to Portfolio" : "Add to Watchlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

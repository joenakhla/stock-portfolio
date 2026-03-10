"use client";

import { useState } from "react";
import { PortfolioStock } from "@/lib/types";

interface EditStockModalProps {
  stock: PortfolioStock;
  onClose: () => void;
  onSave: (
    id: string,
    updates: { shares: number; purchasePrice: number; purchaseDate: string }
  ) => Promise<void>;
}

export default function EditStockModal({
  stock,
  onClose,
  onSave,
}: EditStockModalProps) {
  const [shares, setShares] = useState(stock.shares.toString());
  const [price, setPrice] = useState(stock.purchasePrice.toString());
  const [date, setDate] = useState(stock.purchaseDate);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(price);
    if (!sharesNum || sharesNum <= 0 || !priceNum || priceNum <= 0) return;

    setSaving(true);
    await onSave(stock.id, {
      shares: sharesNum,
      purchasePrice: priceNum,
      purchaseDate: date,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stock info — read only */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <span className="font-bold text-blue-900">{stock.symbol}</span>
            <span className="ml-2 text-blue-700 text-sm">{stock.name}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of shares
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per share ($)
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase date
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { PortfolioStock, StockQuote } from "@/lib/types";
import { isMarketOpen } from "@/lib/marketHours";

const REFRESH_INTERVAL = 30_000; // 30 seconds

interface DbPortfolioRow {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  purchase_date: string;
  created_at: string;
}

function mapRow(row: DbPortfolioRow): PortfolioStock {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    name: row.name,
    shares: Number(row.shares),
    purchasePrice: Number(row.purchase_price),
    purchaseDate: row.purchase_date,
  };
}

export function usePortfolio(userId: string | undefined) {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote | { error: string }>>({});
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const stocksRef = useRef<PortfolioStock[]>([]);

  const fetchStocks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Fetch ALL users' stocks (shared dashboard view)
    // My Stocks tab filters client-side by userId
    const { data, error } = await supabase
      .from("portfolio_stocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = (data as DbPortfolioRow[]).map(mapRow);
      setStocks(mapped);
      stocksRef.current = mapped;
    }
    setLoading(false);
  }, [userId]);

  const fetchQuotes = useCallback(async (stockList?: PortfolioStock[]) => {
    const list = stockList || stocksRef.current;
    if (list.length === 0) return;
    setQuotesLoading(true);
    const symbols = Array.from(new Set(list.map((s) => s.symbol)));
    try {
      const res = await fetch(`/api/quote?symbol=${symbols.join(",")}&t=${Date.now()}`);
      const data = await res.json();
      setQuotes(data);
      setLastUpdated(new Date());
    } catch {
      // Quotes unavailable
    }
    setQuotesLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Fetch quotes when stocks change
  useEffect(() => {
    if (stocks.length > 0) {
      fetchQuotes(stocks);
    }
  }, [stocks, fetchQuotes]);

  // Auto-refresh every 30s — only when market is open
  useEffect(() => {
    if (stocksRef.current.length === 0) return;

    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchQuotes();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchQuotes, stocks.length]);

  async function addStock(stock: {
    symbol: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
  }) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("portfolio_stocks")
      .insert({
        user_id: userId,
        symbol: stock.symbol,
        name: stock.name,
        shares: stock.shares,
        purchase_price: stock.purchasePrice,
        purchase_date: stock.purchaseDate,
      })
      .select()
      .single();

    if (!error && data) {
      const mapped = mapRow(data as DbPortfolioRow);
      const updated = [mapped, ...stocksRef.current];
      setStocks(updated);
      stocksRef.current = updated;
    }
  }

  async function updateStock(
    id: string,
    updates: { shares: number; purchasePrice: number; purchaseDate: string }
  ) {
    if (!userId) return;

    const { error } = await supabase
      .from("portfolio_stocks")
      .update({
        shares: updates.shares,
        purchase_price: updates.purchasePrice,
        purchase_date: updates.purchaseDate,
      })
      .eq("id", id);

    if (!error) {
      const updated = stocksRef.current.map((s) =>
        s.id === id
          ? { ...s, shares: updates.shares, purchasePrice: updates.purchasePrice, purchaseDate: updates.purchaseDate }
          : s
      );
      setStocks(updated);
      stocksRef.current = updated;
    }
  }

  async function removeStock(id: string) {
    await supabase.from("portfolio_stocks").delete().eq("id", id);
    const updated = stocksRef.current.filter((s) => s.id !== id);
    setStocks(updated);
    stocksRef.current = updated;
  }

  return {
    stocks,
    quotes,
    loading,
    quotesLoading,
    lastUpdated,
    addStock,
    updateStock,
    removeStock,
    refreshQuotes: () => fetchQuotes(),
  };
}

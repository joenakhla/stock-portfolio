"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PortfolioStock, StockQuote } from "@/lib/types";

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

  const fetchStocks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("portfolio_stocks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = (data as DbPortfolioRow[]).map(mapRow);
      setStocks(mapped);
    }
    setLoading(false);
  }, [userId]);

  const fetchQuotes = useCallback(async (stockList: PortfolioStock[]) => {
    if (stockList.length === 0) return;
    setQuotesLoading(true);
    const symbols = Array.from(new Set(stockList.map((s) => s.symbol)));
    try {
      const res = await fetch(`/api/quote?symbol=${symbols.join(",")}`);
      const data = await res.json();
      setQuotes(data);
    } catch {
      // Quotes unavailable
    }
    setQuotesLoading(false);
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchQuotes(stocks);
    }
  }, [stocks, fetchQuotes]);

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
      setStocks((prev) => [mapped, ...prev]);
    }
  }

  async function removeStock(id: string) {
    await supabase.from("portfolio_stocks").delete().eq("id", id);
    setStocks((prev) => prev.filter((s) => s.id !== id));
  }

  return {
    stocks,
    quotes,
    loading,
    quotesLoading,
    addStock,
    removeStock,
    refetchQuotes: () => fetchQuotes(stocks),
  };
}

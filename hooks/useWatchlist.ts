"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { WatchlistStock, StockQuote } from "@/lib/types";

interface DbWatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  added_date: string;
  created_at: string;
}

function mapRow(row: DbWatchlistRow): WatchlistStock {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    addedDate: row.added_date,
  };
}

export function useWatchlist(userId: string | undefined) {
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(true);

  const fetchStocks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("watchlist_stocks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = (data as DbWatchlistRow[]).map(mapRow);
      setStocks(mapped);
    }
    setLoading(false);
  }, [userId]);

  const fetchQuotes = useCallback(async (stockList: WatchlistStock[]) => {
    if (stockList.length === 0) return;
    const symbols = Array.from(new Set(stockList.map((s) => s.symbol)));
    try {
      const res = await fetch(`/api/quote?symbol=${symbols.join(",")}`);
      const data = await res.json();
      setQuotes(data);
    } catch {
      // Quotes unavailable
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  useEffect(() => {
    if (stocks.length > 0) {
      fetchQuotes(stocks);
    }
  }, [stocks, fetchQuotes]);

  async function addStock(stock: { symbol: string; name: string }) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("watchlist_stocks")
      .insert({
        user_id: userId,
        symbol: stock.symbol,
        name: stock.name,
        added_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (!error && data) {
      const mapped = mapRow(data as DbWatchlistRow);
      setStocks((prev) => [mapped, ...prev]);
    }
  }

  async function removeStock(id: string) {
    await supabase.from("watchlist_stocks").delete().eq("id", id);
    setStocks((prev) => prev.filter((s) => s.id !== id));
  }

  return {
    stocks,
    quotes,
    loading,
    addStock,
    removeStock,
  };
}

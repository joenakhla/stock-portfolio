"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { WatchlistStock, StockQuote } from "@/lib/types";
import { isMarketOpen } from "@/lib/marketHours";

const REFRESH_INTERVAL = 30_000; // 30 seconds

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const stocksRef = useRef<WatchlistStock[]>([]);

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
      stocksRef.current = mapped;
    }
    setLoading(false);
  }, [userId]);

  const fetchQuotes = useCallback(async (stockList?: WatchlistStock[]) => {
    const list = stockList || stocksRef.current;
    if (list.length === 0) return;
    const symbols = Array.from(new Set(list.map((s) => s.symbol)));
    try {
      const res = await fetch(`/api/quote?symbol=${symbols.join(",")}&t=${Date.now()}`);
      const data = await res.json();
      setQuotes(data);
      setLastUpdated(new Date());
    } catch {
      // Quotes unavailable
    }
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
      const updated = [mapped, ...stocksRef.current];
      setStocks(updated);
      stocksRef.current = updated;
    }
  }

  async function removeStock(id: string) {
    await supabase.from("watchlist_stocks").delete().eq("id", id);
    const updated = stocksRef.current.filter((s) => s.id !== id);
    setStocks(updated);
    stocksRef.current = updated;
  }

  return {
    stocks,
    quotes,
    loading,
    lastUpdated,
    addStock,
    removeStock,
    refreshQuotes: () => fetchQuotes(),
  };
}

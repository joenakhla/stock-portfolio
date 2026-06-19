"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketId } from "@/lib/markets";

const STORAGE_KEY = "stock-portfolio-markets";

export function useMarketSelection() {
  const [selectedMarkets, setSelectedMarkets] = useState<MarketId[]>(["US"]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MarketId[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedMarkets(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMarkets));
    }
  }, [selectedMarkets, loaded]);

  const toggleMarket = useCallback((marketId: MarketId) => {
    setSelectedMarkets((prev) => {
      if (prev.includes(marketId)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== marketId);
      }
      return [...prev, marketId];
    });
  }, []);

  const isEgyptSelected = selectedMarkets.includes("EGX");

  return { selectedMarkets, toggleMarket, isEgyptSelected, loaded };
}

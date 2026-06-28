"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketId } from "@/lib/markets";

const STORAGE_KEY = "stock-portfolio-market";

export function useMarketSelection() {
  const [selectedMarket, setSelectedMarket] = useState<MarketId>("EGX");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as MarketId | null;
      if (stored === "EGX" || stored === "US") {
        setSelectedMarket(stored);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, selectedMarket);
    }
  }, [selectedMarket, loaded]);

  const selectMarket = useCallback((marketId: MarketId) => {
    setSelectedMarket(marketId);
  }, []);

  // toggleMarket kept for backward compat — behaves as select
  const toggleMarket = useCallback((marketId: MarketId) => {
    setSelectedMarket(marketId);
  }, []);

  const isEgyptSelected = selectedMarket === "EGX";

  // selectedMarkets array for components that still accept MarketId[]
  const selectedMarkets: MarketId[] = [selectedMarket];

  return { selectedMarket, selectedMarkets, selectMarket, toggleMarket, isEgyptSelected, loaded };
}
